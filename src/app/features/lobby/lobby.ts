import { Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';
import { Room } from '../../core/models/room.model';
import { BingoCell } from '../../core/models/bingo_cell.model';

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

  board: BingoCell[][] = [];

  rangosBoard = {
    b: [1, 15],
    i: [16, 30],
    n: [31, 45],
    g: [46, 60],
    o: [61, 75]
  };

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

    this.generateBingoBoard();
  }

  generateBingoBoard() {
    const columnas = [
      this.generateColumn(this.rangosBoard.b[0], this.rangosBoard.b[1]),
      this.generateColumn(this.rangosBoard.i[0], this.rangosBoard.i[1]),
      this.generateColumn(this.rangosBoard.n[0], this.rangosBoard.n[1]),
      this.generateColumn(this.rangosBoard.g[0], this.rangosBoard.g[1]),
      this.generateColumn(this.rangosBoard.o[0], this.rangosBoard.o[1]),
    ];

    this.board = [];

    for (let row = 0; row < 5; row++) {

      const fila: BingoCell[] = [];

      for (let col = 0; col < 5; col++) {

        fila.push({
          value: columnas[col][row],
          marked: false,
          disabled: false
        });
      }

      this.board.push(fila);
    }

    this.dataApp.setBoard(this.board);
  }

  generateColumn(min: number, max: number): number[] {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const random =
        Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(random)) {
        numbers.push(random);
      }
    }

    return numbers;
  }

  goToPlay() {

  }

}
