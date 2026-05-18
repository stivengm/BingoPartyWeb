import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Player } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class DataAppService {

    //#region Evento para almacenar el alias de la persona
    private $player = new BehaviorSubject<Player | null>(null);

    public setPlayer(val: Player): void {
        this.$player.next(val);
    }

    public getPlayer(): Observable<any> {
        return this.$player.asObservable();
    }

    public getCurrentPlayer(): Player | null {
        return this.$player.getValue();
    }
    //#endregion
}