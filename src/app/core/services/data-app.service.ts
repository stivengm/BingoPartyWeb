import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Player } from '../models/player.model';
import { Router } from '@angular/router';

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

    //#region Evento para almacenar el alias de la persona
    private $player = new BehaviorSubject<Player | null>(null);

    public setPlayer(val: Player): void {
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
}