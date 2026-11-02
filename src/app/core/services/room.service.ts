import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DataAppService } from './data-app.service';
import { CreateRoomModel } from '../models/create_room.model';
import { JoinRoomModel } from '../models/join_room.model';
import { ResponseServicesModel, RoomSession } from '../models/response_services.model';
import { RoomModel } from '../models/room.model';
import { Player } from '../models/player.model';
import { Ball } from '../models/ball.model';
import { BingoCell } from '../models/bingo_cell.model';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/** Un Render dormido puede tardar un minuto en despertar: se espera la conexión antes de fallar. */
const WAKE_UP_TIMEOUT_MS = 90_000;
const ACK_TIMEOUT_MS = 20_000;

@Injectable({
  providedIn: 'root'
})
export class RoomService {

    private socket: Socket | null = null;
    private state$ = new BehaviorSubject<RoomModel | null>(null);
    private connection$ = new BehaviorSubject<ConnectionStatus>('connecting');

    /** Se emite cuando el servidor ya no reconoce la sala o al jugador (p. ej. la sala se cerró). */
    readonly sessionLost$ = new Subject<string>();

    constructor(private dataApp: DataAppService) {}

    // ------------------------------------------------------------ conexión

    /** Abre la conexión. Se llama al iniciar la app para despertar el servidor cuanto antes. */
    connect(): void {
        if (this.socket) return;

        const socket = io(environment.socketUrl || undefined, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 4000,
            timeout: 20_000
        });
        this.socket = socket;

        socket.on('connect', () => {
            this.connection$.next('connected');
            this.rejoinFromStorage();
        });
        socket.on('disconnect', () => this.connection$.next('disconnected'));
        socket.on('connect_error', () => this.connection$.next('connecting'));
        socket.io.on('reconnect_attempt', () => this.connection$.next('connecting'));
        socket.on('room:state', (state: RoomModel) => this.applyState(state));
    }

    getConnectionStatus(): Observable<ConnectionStatus> {
        return this.connection$.asObservable();
    }

    /** Si hay una sala guardada en esta pestaña, vuelve a ocupar la silla (recarga o corte de red). */
    private rejoinFromStorage(): void {
        const room = this.dataApp.getStorage<RoomModel>('room');
        const player = this.dataApp.getStorage<Player>('player');
        if (!room?.id || !player?.id) return;

        this.socket?.timeout(ACK_TIMEOUT_MS).emit(
            'room:rejoin',
            { roomId: room.id, playerId: player.id },
            (err: unknown, res?: ResponseServicesModel<RoomSession | null>) => {
                if (err || !res) return;
                if (res.code === 'JR001' && res.data) {
                    this.applyState(res.data.room);
                    return;
                }
                if (res.code === 'E_NO_ROOM' || res.code === 'E_NO_PLAYER') {
                    this.dataApp.resetGameState();
                    this.state$.next(null);
                    this.sessionLost$.next(res.message);
                }
            }
        );
    }

    private applyState(raw: RoomModel): void {
        // Corrige el desfase entre el reloj del servidor y el de este dispositivo.
        const skew = Date.now() - raw.serverNow;
        const state: RoomModel = {
            ...raw,
            nextBallAt: raw.nextBallAt ? raw.nextBallAt + skew : null
        };
        this.state$.next(state);
        this.dataApp.setRoom(state);

        const me = this.dataApp.getCurrentPlayer();
        const mine = me ? state.players.find(p => p.id === me.id) : undefined;
        if (me && mine && (mine.isHost !== me.isHost || mine.avatar !== me.avatar)) {
            this.dataApp.setPlayer({ ...me, isHost: mine.isHost, avatar: mine.avatar || me.avatar });
        }
    }

    private applySession(res: ResponseServicesModel<RoomSession | null>): void {
        if (res.data?.room) {
            this.applyState(res.data.room);
        }
    }

    /** Envía un evento y espera la respuesta. Nunca falla: los errores llegan como `code` ≠ éxito. */
    private request<T>(event: string, payload: unknown = {}): Observable<ResponseServicesModel<T>> {
        return new Observable<ResponseServicesModel<T>>(subscriber => {
            this.connect();
            const socket = this.socket!;
            let cancelled = false;
            let wakeTimer: ReturnType<typeof setTimeout> | null = null;

            const send = () => {
                socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (err: unknown, res?: ResponseServicesModel<T>) => {
                    if (cancelled) return;
                    subscriber.next(err || !res
                        ? { code: 'E_NETWORK', message: 'El servidor no respondió. Inténtalo de nuevo.', data: null as T }
                        : res);
                    subscriber.complete();
                });
            };

            if (socket.connected) {
                send();
            } else {
                const onConnect = () => {
                    if (wakeTimer) clearTimeout(wakeTimer);
                    send();
                };
                socket.once('connect', onConnect);
                wakeTimer = setTimeout(() => {
                    socket.off('connect', onConnect);
                    if (cancelled) return;
                    subscriber.next({ code: 'E_NETWORK', message: 'No se pudo conectar con el servidor.', data: null as T });
                    subscriber.complete();
                }, WAKE_UP_TIMEOUT_MS);
                return () => {
                    cancelled = true;
                    if (wakeTimer) clearTimeout(wakeTimer);
                    socket.off('connect', onConnect);
                };
            }
            return () => { cancelled = true; };
        });
    }

    // ------------------------------------------------------------- acciones

    createRoom(room: CreateRoomModel): Observable<ResponseServicesModel<RoomSession>> {
        return this.request<RoomSession>('room:create', room).pipe(tap(res => this.applySession(res)));
    }

    joinRoom(room: JoinRoomModel): Observable<ResponseServicesModel<RoomSession>> {
        return this.request<RoomSession>('room:join', room).pipe(tap(res => this.applySession(res)));
    }

    leaveRoom(): void {
        if (this.socket?.connected) {
            this.socket.emit('room:leave', {}, () => {});
        }
        this.state$.next(null);
    }

    startGame() {
        return this.request<null>('game:start');
    }

    /** Juego físico: el anfitrión saca una bolita (al azar o la que salió de la tómbola). */
    drawBall(number?: number) {
        return this.request<Ball>('game:ball:next', number === undefined ? {} : { number });
    }

    callBingo(board?: BingoCell[][]) {
        return this.request<null>('game:bingo', { board });
    }

    resolveClaim(accepted?: boolean) {
        return this.request<{ result: 'won' | 'resumed' }>('game:bingo:resolve', { accepted });
    }

    endGame() {
        return this.request<null>('game:end');
    }

    rematch() {
        return this.request<null>('game:rematch');
    }

    // -------------------------------------------------------- suscripciones

    get currentState(): RoomModel | null {
        return this.state$.getValue();
    }

    /** Estado de la sala. Espera a que llegue (p. ej. tras recargar la página). */
    getRoomSuscription(roomCode?: string): Observable<RoomModel> {
        return this.state$.pipe(
            filter((room): room is RoomModel => room !== null && (!roomCode || room.id === roomCode))
        );
    }

    getPlayers(roomCode?: string): Observable<Player[]> {
        return this.getRoomSuscription(roomCode).pipe(map(room => room.players));
    }

    getCurrentBall(roomCode?: string): Observable<Ball | null> {
        return this.getRoomSuscription(roomCode).pipe(
            map(room => room.currentBall),
            distinctUntilChanged((a, b) => a?.number === b?.number)
        );
    }

    getCalledBalls(roomCode?: string): Observable<Ball[]> {
        return this.getRoomSuscription(roomCode).pipe(map(room => room.calledBalls));
    }
}
