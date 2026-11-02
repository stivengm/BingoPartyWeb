import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { CountDownOverlayGame } from '../../shared/count-down-overlay-game/count-down-overlay-game';
import { DataAppService } from '../../core/services/data-app.service';
import { CircleCountDown } from '../../shared/circle-count-down/circle-count-down';
import { RoomModel } from '../../core/models/room.model';
import { VerifyGameResults } from '../../shared/verify-game-results/verify-game-results';
import { PhysicalClaim } from '../../shared/physical-claim/physical-claim';
import { RoomService } from '../../core/services/room.service';
import { Player } from '../../core/models/player.model';
import { errorModal, infoModal } from '../../utils/modals';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { Ball } from '../../core/models/ball.model';
import { statusBall, VerifyBall } from '../../core/models/verify_ball';
import { Winner } from '../../shared/winner/winner';

@Component({
  selector: 'app-game',
  imports: [
    Header,
    TableroBingo,
    CountDownOverlayGame,
    CircleCountDown,
    VerifyGameResults,
    PhysicalClaim,
    Winner
  ],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements OnInit {

  private destroyRef = inject(DestroyRef);

  isViewInitialGame = true;
  player: Player = {} as Player;
  board: BingoCell[][] = [];
  room: RoomModel = {} as RoomModel;

  /** Bolitas 1-75 con las que se dibuja la verificación. */
  allBallsCalled: VerifyBall[] = [];
  /** Tabla de 1 a 75 para comparar con el cartón físico. */
  numbers = Array.from({ length: 75 }, (_, i) => i + 1);
  calledNumbers = new Set<number>();

  isValidateBoard = false;
  isWinnerGame = false;
  isSendingBingo = false;
  isDrawing = false;
  isEnding = false;

  manualNumber = '';

  private hasWarnedExhausted = false;
  private lastStatus: string | null = null;
  private lastRound = 0;
  private initialized = false;

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {}

  get isManual(): boolean {
    return this.room.gameType === 2;
  }

  get isHost(): boolean {
    return !!this.player?.id && this.player.id === this.room.hostId;
  }

  get claimant(): Player | null {
    return this.room.playerLastUpdateGame;
  }

  get canResolveClaim(): boolean {
    return !!this.player?.id && (this.player.id === this.claimant?.id || this.isHost);
  }

  ngOnInit(): void {
    const roomStorage = this.dataApp.getCurrentRoom() ?? this.dataApp.getStorage('room') as RoomModel | null;
    const playerStorage = this.dataApp.getCurrentPlayer() ?? this.dataApp.getStorage('player') as Player | null;

    if (!roomStorage || !playerStorage) {
      this.dataApp.goToPage('/welcome_view');
      return;
    }

    this.room = roomStorage;
    this.player = playerStorage;
    this.dataApp.setPlayer(playerStorage);

    this.dataApp.getPlayer().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((player) => {
      if (player) this.player = player;
    });

    this.dataApp.getIsViewInitialGame().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.isViewInitialGame = value;
      if (!value) {
        this.dataApp.setStatusGame('playing');
      }
      this.cdr.detectChanges();
    });

    this.dataApp.getBoard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((board) => {
      if (board) {
        this.board = board;
        return;
      }

      const boardStorage = this.dataApp.getStorage('board') as BingoCell[][] | null;
      if (boardStorage) {
        this.board = boardStorage;
      }
    });

    this.roomService.getRoomSuscription(this.room.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((room) => {
      this.onRoomState(room);
    });
  }

  private onRoomState(room: RoomModel): void {
    this.room = room;
    this.calledNumbers = new Set(room.calledBalls.map(b => b.number));

    // Revancha: el host reinició la partida, todos vuelven al lobby.
    if (room.status === 'waiting') {
      this.dataApp.setIsViewInitialGame(true);
      this.dataApp.goToPage('/lobby');
      return;
    }

    if (!this.initialized) {
      this.initialized = true;
      this.lastRound = room.round;
      // La cuenta regresiva 3-2-1 solo se ve al empezar; al recargar la página no se repite.
      const countdownRunning =
        room.gameType === 1 &&
        room.status === 'playing' &&
        room.calledBalls.length === 0 &&
        !!room.nextBallAt &&
        room.nextBallAt - Date.now() > room.secondsBalls * 1000;
      this.dataApp.setIsViewInitialGame(countdownRunning);
    }

    const statusChanged = room.status !== this.lastStatus;
    this.lastStatus = room.status;

    this.isValidateBoard = room.status === 'paused';
    this.isWinnerGame = room.status === 'finished';

    if (statusChanged) {
      this.isSendingBingo = false;
    }

    if (room.status === 'paused' && room.gameType === 1) {
      this.allBallsCalled = this.buildVerifyBalls(room.calledBalls);
    }

    if (room.exhausted && room.status === 'playing') {
      this.warnExhausted();
    }

    this.cdr.detectChanges();
  }

  private warnExhausted(): void {
    if (this.hasWarnedExhausted) return;
    this.hasWarnedExhausted = true;

    infoModal({
      title: '¡Ya salieron las 75 bolitas!',
      html: this.isHost
        ? 'No quedan más bolitas por generar. Verifiquen si alguien tiene bingo; si no hay ganador, puedes finalizar la partida.'
        : 'No quedan más bolitas por generar. Si completaste tu figura, ¡canta bingo ahora!'
    });
  }

  private buildVerifyBalls(calledBalls: Ball[]): VerifyBall[] {
    const calledNumbers = new Set(calledBalls.map(ball => ball.number));

    return Array.from({ length: 75 }, (_, index) => {
      const number = index + 1;

      return {
        id: number,
        isComplete: calledNumbers.has(number),
        status: statusBall.Pending
      };
    });
  }

  /** Cualquier jugador canta bingo: el servidor pausa la partida y verifica. */
  validateBoard() {
    if (this.isSendingBingo || this.isValidateBoard || this.isViewInitialGame || this.isWinnerGame) {
      return;
    }

    if (this.room.calledBalls.length === 0) {
      errorModal({ title: 'Todavía no ha salido ninguna bolita.' });
      return;
    }

    this.isSendingBingo = true;

    this.roomService.callBingo(this.isManual ? undefined : this.board).subscribe((resp) => {
      if (resp.code !== 'UR001') {
        this.isSendingBingo = false;
        errorModal({ title: resp.message ?? 'No se pudo cantar el bingo, intenta de nuevo.' });
        this.cdr.detectChanges();
      }
    });
  }

  /** Juego físico: el host saca una bolita (al azar o la que salió de su tómbola). */
  drawBall(number?: number) {
    if (this.isDrawing || !this.isHost) return;
    this.isDrawing = true;

    this.roomService.drawBall(number).subscribe((resp) => {
      this.isDrawing = false;
      if (resp.code !== 'UR001') {
        errorModal({ title: resp.message ?? 'No se pudo sacar la bolita.' });
      } else {
        this.manualNumber = '';
      }
      this.cdr.detectChanges();
    });
  }

  drawManualBall() {
    const number = parseInt(this.manualNumber, 10);
    if (Number.isNaN(number) || number < 1 || number > 75) {
      errorModal({ title: 'Escribe un número entre 1 y 75.' });
      return;
    }
    this.drawBall(number);
  }

  endGame() {
    if (this.isEnding || !this.isHost) return;
    this.isEnding = true;

    this.roomService.endGame().subscribe((resp) => {
      this.isEnding = false;
      if (resp.code !== 'UR001') {
        errorModal({ title: resp.message ?? 'No se pudo finalizar la partida.' });
      }
      this.cdr.detectChanges();
    });
  }
}
