import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';
import { RoomModel } from '../../core/models/room.model';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { RoomService } from '../../core/services/room.service';
import { CommonModule } from '@angular/common';
import { errorModal } from '../../utils/modals';

@Component({
  selector: 'app-lobby',
  imports: [
    Header,
    TableroBingo,
    CommonModule
],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class Lobby implements OnInit {

  player: Player = {} as Player;
  room: RoomModel = {} as RoomModel;

  playersOnline: any = [];

  board: BingoCell[][] = [];

  rangosBoard = {
    b: [1, 15],
    i: [16, 30],
    n: [31, 45],
    g: [46, 60],
    o: [61, 75]
  };

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {}

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

      let romStorage = this.dataApp.getStorage('room') as RoomModel;

      if (romStorage === null) {
        // TODO: Enviar al welcome porque no existe Room
        return;
      };
      
      this.room = romStorage;
      this.dataApp.setRoom(romStorage);
    });

    this.generateBingoBoard();
    this.getPlayersRoom();
    this.getRoomInLobby();
  }

  getPlayersRoom() {

  this.roomService.getPlayers(this.room.id).subscribe((players: any[]) => {
    if (this.player?.id) {
      players.sort((a, b) => {
        if (a.id === this.player.id) {
          return -1;
        }

        if (b.id === this.player.id) {
          return 1;
        }
        return 0;
      });
    }
    this.playersOnline = players;
    this.cdr.detectChanges();
  });
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

  getRoomInLobby() {
    this.roomService.getRoomInLobby(this.room.id).subscribe((room: any) => {
      this.room = room;
      if (room.status === 'playing') {
        console.log('El juego inició');
        this.dataApp.goToPage('/game_curse');
      }
    });
  }

  goToPlay() {
    let playRoom = {
      roomId: this.room.id,
      playerId: this.player.id,
      status: "playing"
    }
    this.roomService.updateRoom(playRoom).subscribe((isUpdate) => {
      if (isUpdate.code != "UR001") {
        errorModal({ title: isUpdate.message ?? "Ha ocurrido un error"});
      }
    });
  }

}
