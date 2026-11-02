import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';
import { RoomModel } from '../../core/models/room.model';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { RoomService } from '../../core/services/room.service';
import { CommonModule } from '@angular/common';
import { errorModal } from '../../utils/modals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  private destroyRef = inject(DestroyRef);
  player: Player = {} as Player;
  room: RoomModel = {} as RoomModel;

  playersOnline: Player[] = [];

  board: BingoCell[][] = [];
  /** En juego físico se muestra solo la figura a completar, sin números. */
  emptyBoard: BingoCell[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => ({ value: '', disabled: true }))
  );

  isStarting = false;
  copied = false;

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
    const playerStorage = this.dataApp.getCurrentPlayer() ?? this.dataApp.getStorage('player') as Player | null;
    const roomStorage = this.dataApp.getCurrentRoom() ?? this.dataApp.getStorage('room') as RoomModel | null;

    if (!playerStorage || !roomStorage) {
      this.dataApp.goToPage('/welcome_view');
      return;
    }

    this.player = playerStorage;
    this.room = roomStorage;
    this.dataApp.setPlayer(playerStorage);
    this.dataApp.setRoom(roomStorage);

    this.dataApp.getPlayer().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((player) => {
      if (player) this.player = player;
      this.cdr.detectChanges();
    });

    if (this.room.gameType !== 2) {
      this.generateBingoBoard();
    }

    this.roomService.getRoomSuscription(this.room.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((room) => {
      this.room = room;
      this.playersOnline = [...room.players].sort((a, b) => {
        if (a.id === this.player.id) return -1;
        if (b.id === this.player.id) return 1;
        return 0;
      });

      if (room.status === 'playing') {
        this.dataApp.goToPage('/game_curse');
        return;
      }
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

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.room.id);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
        this.cdr.detectChanges();
      }, 2000);
    } catch {
      errorModal({ title: 'No se pudo copiar el código.' });
    }
  }

  goToPlay() {
    if (this.isStarting) return;
    this.isStarting = true;

    this.roomService.startGame().subscribe((resp) => {
      if (resp.code !== 'UR001') {
        this.isStarting = false;
        errorModal({ title: resp.message ?? 'Ha ocurrido un error' });
        this.cdr.detectChanges();
      }
    });
  }

}
