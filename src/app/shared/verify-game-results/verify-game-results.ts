import { Component, OnInit, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';


import { DataAppService } from '../../core/services/data-app.service';

import { Player } from '../../core/models/player.model';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { VerifyBall, VerifyCell } from '../../core/models/verify_cell.model';
import { RoomService } from '../../core/services/room.service';
import { UpdateGameModel } from '../../core/models/update_game.model';
import { statusGameEnum } from '../../core/models/status_game.model';
import { RoomModel } from '../../core/models/room.model';

@Component({
  selector: 'app-verify-game-results',
  imports: [
    CommonModule
  ],
  templateUrl: './verify-game-results.html',
  styleUrl: './verify-game-results.scss',
})
export class VerifyGameResults implements OnInit, OnChanges {

  @Input() boardId: number = 0;
  @Input() player: Player = {} as Player;
  @Input() board: BingoCell[][] = [];

  room: RoomModel = {} as RoomModel;
  boardVerify: VerifyCell[][] = [];
  isFinishedValidation = false;
  isValidBoard: boolean | null = null;

  @Input() allBallsCalled: VerifyBall[] = [];

  private verificationStarted = false;

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.board?.length &&
      this.allBallsCalled?.length &&
      !this.verificationStarted
    ) {

      this.verificationStarted = true;

      this.generateBoardVerify();

      this.startVerification();
    }
  }

  loadPlayer(): void {
    this.dataApp.getPlayer().subscribe((player) => {
      if (player != null) {
        this.player = player;
        return;
      }

      const playerStorage = this.dataApp.getStorage('player') as Player;

      if (playerStorage === null) {
        return;
      }

      this.player = playerStorage;

      this.dataApp.setPlayer(playerStorage);

    });
  }

  async loadBoard(): Promise<void> {
    return new Promise((resolve) => {
      this.dataApp.getBoard().subscribe((board) => {
        if (board) {
          this.board = board;
          this.generateBoardVerify();
          resolve();
          return;
        }
        const boardStorage = this.dataApp.getStorage('board') as BingoCell[][];
        if (boardStorage) {
          this.board = boardStorage;
          this.generateBoardVerify();
          resolve();
        }
      });
    });
  }

  generateBoardVerify(): void {
    this.boardVerify = this.board.map((row, rowIndex) =>
      row.map((cell, colIndex) => {

        const drawnBall = this.allBallsCalled.find(
          ball => ball.id === Number(cell.value)
        );

        return {
          number: Number(cell.value),
          isDrawn: drawnBall?.isComplete ?? false,
          isInGame: this.isInGame(rowIndex, colIndex),
          status: 'pending'
        };
      })
    );
  }

  isInGame(rowIndex: number, colIndex: number): boolean {
    switch (this.boardId) {

      case 1:
        return rowIndex === 2;

      case 2:
        return colIndex === 2;

      case 3:
        return rowIndex === colIndex;

      case 4:
        return rowIndex + colIndex === 4;

      case 5:
        return (
          colIndex === 0 ||
          rowIndex === 4
        );

      case 6:
        return (
          colIndex === 4 ||
          rowIndex === 4
        );

      case 7:
        return (
          rowIndex === 0 ||
          rowIndex === 4 ||
          colIndex === 0 ||
          colIndex === 4
        );

      case 8:
        return true;

      default:
        return false;
    }
  }

  async startVerification(): Promise<void> {

    let hasErrors = false;

    for (const row of this.boardVerify) {

      for (const cell of row) {

        const ball = this.allBallsCalled.find(
          x => x.id === cell.number
        );

        // NO PARTICIPA EN EL PATRÓN
        if (!cell.isInGame) {
          cell.status = 'active-error';
          this.cdr.detectChanges();
          await this.sleep(200);
          cell.status = 'error';
          this.cdr.detectChanges();
          continue;
        }

        // PARTICIPA EN EL PATRÓN
        const success = cell.isDrawn;

        if (!success) {
          hasErrors = true;
        }

        cell.status = success
          ? 'active-success'
          : 'active-warning';

        if (ball) {
          ball.status = success
            ? 'active-success'
            : 'active-warning';
        }

        this.cdr.detectChanges();
        await this.sleep(500);

        cell.status = success
          ? 'success'
          : 'warning';

        if (ball) {
          ball.status = success
            ? 'success'
            : 'warning';
        }

        this.cdr.detectChanges();
      }
    }

    this.isValidBoard = !hasErrors;
    this.isFinishedValidation = true;

    this.cdr.detectChanges();
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  goToWin() {
    let winRoom: UpdateGameModel = {
      roomId: this.room.id,
      playerId: this.player.id,
      status: statusGameEnum.Finished,
      board: this.board
    }

    // Finalizar juego
    this.roomService.updateRoomUser(winRoom).subscribe((isPauseGame) => {console.log(isPauseGame)});
  }

  resumeRoom() {
    let resumeRoom: UpdateGameModel = {
      roomId: this.room.id,
      playerId: this.player.id,
      status: statusGameEnum.Playing,
      board: this.board
    }

    // Reanudar juego
    this.roomService.updateRoomUser(resumeRoom).subscribe((isPauseGame) => {
      this.dataApp.setStatusGame(statusGameEnum.Playing);
    });
  }
}