import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Player } from '../models/player.model';
import { Router } from '@angular/router';
import { RoomModel } from '../models/room.model';
import { BingoCell } from '../models/bingo_cell.model';

@Injectable({
  providedIn: 'root'
})
export class DataAppService {

    constructor(private router: Router) {}

    public goToPage(url: string) {
        this.router.navigate([url]);
    }

    public saveStorage(key: string, data: any) {
        sessionStorage.setItem(key, JSON.stringify(data));
    }

    public getStorage<T>(key: string): T | null {
        const data = sessionStorage.getItem(key);

        if (!data) {
            return null;
        }

        return JSON.parse(data) as T;
    }

    public clearStorage() {
        sessionStorage.clear();
    }

    //#region Evento para almacenar el alias de la persona
    private $isLoader = new BehaviorSubject<boolean>(false);

    public setIsLoader(val: boolean): void {
        this.$isLoader.next(val);
    }

    public getIsLoader(): Observable<boolean> {
        return this.$isLoader.asObservable();
    }

    public getCurrentIsLoader(): boolean {
        return this.$isLoader.getValue();
    }
    //#endregion


    //#region Evento para almacenar el alias de la persona
    private $player = new BehaviorSubject<Player | null>(null);

    public setPlayer(val: Player | null): void {
        this.$player.next(val);
        this.saveStorage('player', val);
    }

    public getPlayer(): Observable<any> {
        return this.$player.asObservable();
    }

    public getCurrentPlayer(): Player | null {
        return this.$player.getValue();
    }
    //#endregion

    //#region Evento para almacenar el room actual
    private $room = new BehaviorSubject<RoomModel | null>(null);

    public setRoom(val: RoomModel): void {
        this.$room.next(val);
        this.saveStorage('room', val);
    }

    public getRoom(): Observable<any> {
        return this.$room.asObservable();
    }

    public getCurrentRoom(): RoomModel | null {
        return this.$room.getValue();
    }
    //#endregion

    //#region Evento para almacenar el Board actual
    private $board = new BehaviorSubject<BingoCell[][] | null>(null);

    public setBoard(val: BingoCell[][]): void {
        this.$board.next(val);
        this.saveStorage('board', val);
    }

    public getBoard(): Observable<any> {
        return this.$board.asObservable();
    }

    public getCurrentBoard(): BingoCell[][] | null {
        return this.$board.getValue();
    }
    //#endregion

    //#region Evento para almacenar el valor inicial del countDown del inicio de la partida actual
    private $isViewInitialGame = new BehaviorSubject<boolean>(true);

    public setIsViewInitialGame(val: boolean): void {
        this.$isViewInitialGame.next(val);
    }

    public getIsViewInitialGame(): Observable<boolean> {
        return this.$isViewInitialGame.asObservable();
    }

    public getCurrentIsViewInitialGame(): boolean {
        return this.$isViewInitialGame.getValue();
    }
    //#endregion
}