import { Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';
import { Room } from '../../core/models/room.model';

@Component({
  selector: 'app-lobby',
  imports: [
    Header,
    TableroBingo
  ],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class Lobby implements OnInit {

  player: Player = {} as Player;
  room: Room = {} as Room;

  constructor(private dataApp: DataAppService) {}
  ngOnInit() {
    this.dataApp.getPlayer().subscribe((player) => {
      if (player != null) {
        this.player = player;
        return;
      }

      let playerStorage = this.dataApp.getStorage('player') as Player;

      if (playerStorage === null) {
        // TODO: Enviar al welcome porque no existe player
        return;
      };
      
      this.player = playerStorage;
      this.dataApp.setPlayer(playerStorage);
    });

    this.dataApp.getRoom().subscribe((room) => {
      if (room != null) {
        this.room = room;
        return;
      }

      let romStorage = this.dataApp.getStorage('room') as Room;

      if (romStorage === null) {
        // TODO: Enviar al welcome porque no existe Room
        return;
      };
      
      this.room = romStorage;
      this.dataApp.setRoom(romStorage);
    });
  }

  goToPlay() {

  }

}
