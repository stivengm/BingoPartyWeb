import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


import { DataAppService } from '../../core/services/data-app.service';

import { Player } from '../../core/models/player.model';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { VerifyBall, VerifyCell } from '../../core/models/verify_cell.model';

@Component({
  selector: 'app-verify-game-results',
  imports: [
    CommonModule
  ],
  templateUrl: './verify-game-results.html',
  styleUrl: './verify-game-results.scss',
})
export class VerifyGameResults implements OnInit {

  @Input() player: Player = {} as Player;
  @Input() board: BingoCell[][] = [];

  boardVerify: VerifyCell[][] = [];
  isFinishedValidation = false;
  isValidBoard: boolean | null = null;

  @Input() allBallsCalled: VerifyBall[] = [];

  constructor(
    private dataApp: DataAppService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // this.loadPlayer();
    // await this.loadBoard();


    setInterval(() => {
      console.log(this.allBallsCalled);
    }, 1000);

    this.cdr.detectChanges();
    await this.startVerification();
  }

  // loadPlayer(): void {
  //   this.dataApp.getPlayer().subscribe((player) => {
  //     if (player != null) {
  //       this.player = player;
  //       return;
  //     }

  //     const playerStorage = this.dataApp.getStorage('player') as Player;

  //     if (playerStorage === null) {
  //       return;
  //     }

  //     this.player = playerStorage;

  //     this.dataApp.setPlayer(playerStorage);

  //   });
  // }

  // async loadBoard(): Promise<void> {
  //   return new Promise((resolve) => {
  //     this.dataApp.getBoard().subscribe((board) => {
  //       if (board) {
  //         this.board = board;
  //         this.generateBoardVerify();
  //         resolve();
  //         return;
  //       }
  //       const boardStorage = this.dataApp.getStorage('board') as BingoCell[][];
  //       if (boardStorage) {
  //         this.board = boardStorage;
  //         this.generateBoardVerify();
  //         resolve();
  //       }
  //     });
  //   });
  // }

  generateBoardVerify(): void {
    this.boardVerify = this.board.map((row) =>
      row.map((cell) => {
        const drawnBall = this.allBallsCalled.find(
          ball => ball.id === cell.value
        );
        return {
          number: Number(cell.value),
          isDrawn: drawnBall?.isComplete ?? false,
          status: 'pending'
        };
      })
    );
  }

  async startVerification(): Promise<void> {
    let hasErrors = false;
    for (const row of this.boardVerify) {
      for (const cell of row) {
        const ball = this.allBallsCalled.find(
          x => x.id === cell.number
        );
        const success = cell.isDrawn;
        if (!success) {
          hasErrors = true;
        }
        cell.status = success
          ? 'active-success'
          : 'active-error';

        if (ball) {
          ball.status = success
            ? 'active-success'
            : 'active-error';
        }

        this.cdr.detectChanges();
        await this.sleep(500);
        cell.status = success
          ? 'success'
          : 'error';

        if (ball) {
          ball.status = success
            ? 'success'
            : 'error';
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

}