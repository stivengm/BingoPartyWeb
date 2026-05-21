import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  player: Player = {} as Player;

  board: BingoCell[][] = [];

  boardVerify: VerifyCell[][] = [];
  isFinishedValidation = false;
  isValidBoard: boolean | null = null;

  allBalls: VerifyBall[] = [
    { id: 1, isComplete: true, status: 'pending' },
    { id: 2, isComplete: false, status: 'pending' },
    { id: 3, isComplete: true, status: 'pending' },
    { id: 4, isComplete: true, status: 'pending' },
    { id: 5, isComplete: false, status: 'pending' },
    { id: 6, isComplete: true, status: 'pending' },
    { id: 7, isComplete: false, status: 'pending' },
    { id: 8, isComplete: false, status: 'pending' },
    { id: 9, isComplete: true, status: 'pending' },
    { id: 10, isComplete: false, status: 'pending' },

    { id: 11, isComplete: false, status: 'pending' },
    { id: 12, isComplete: true, status: 'pending' },
    { id: 13, isComplete: false, status: 'pending' },
    { id: 14, isComplete: false, status: 'pending' },
    { id: 15, isComplete: true, status: 'pending' },
    { id: 16, isComplete: false, status: 'pending' },
    { id: 17, isComplete: false, status: 'pending' },
    { id: 18, isComplete: true, status: 'pending' },
    { id: 19, isComplete: false, status: 'pending' },
    { id: 20, isComplete: false, status: 'pending' },

    { id: 21, isComplete: true, status: 'pending' },
    { id: 22, isComplete: false, status: 'pending' },
    { id: 23, isComplete: true, status: 'pending' },
    { id: 24, isComplete: true, status: 'pending' },
    { id: 25, isComplete: false, status: 'pending' },
    { id: 26, isComplete: false, status: 'pending' },
    { id: 27, isComplete: true, status: 'pending' },
    { id: 28, isComplete: false, status: 'pending' },
    { id: 29, isComplete: false, status: 'pending' },
    { id: 30, isComplete: true, status: 'pending' },

    { id: 31, isComplete: false, status: 'pending' },
    { id: 32, isComplete: false, status: 'pending' },
    { id: 33, isComplete: true, status: 'pending' },
    { id: 34, isComplete: false, status: 'pending' },
    { id: 35, isComplete: false, status: 'pending' },
    { id: 36, isComplete: true, status: 'pending' },
    { id: 37, isComplete: true, status: 'pending' },
    { id: 38, isComplete: false, status: 'pending' },
    { id: 39, isComplete: true, status: 'pending' },
    { id: 40, isComplete: true, status: 'pending' },

    { id: 41, isComplete: false, status: 'pending' },
    { id: 42, isComplete: true, status: 'pending' },
    { id: 43, isComplete: false, status: 'pending' },
    { id: 44, isComplete: false, status: 'pending' },
    { id: 45, isComplete: true, status: 'pending' },
    { id: 46, isComplete: true, status: 'pending' },
    { id: 47, isComplete: true, status: 'pending' },
    { id: 48, isComplete: true, status: 'pending' },
    { id: 49, isComplete: false, status: 'pending' },
    { id: 50, isComplete: false, status: 'pending' },

    { id: 51, isComplete: true, status: 'pending' },
    { id: 52, isComplete: false, status: 'pending' },
    { id: 53, isComplete: false, status: 'pending' },
    { id: 54, isComplete: true, status: 'pending' },
    { id: 55, isComplete: false, status: 'pending' },
    { id: 56, isComplete: false, status: 'pending' },
    { id: 57, isComplete: true, status: 'pending' },
    { id: 58, isComplete: true, status: 'pending' },
    { id: 59, isComplete: true, status: 'pending' },
    { id: 60, isComplete: true, status: 'pending' },

    { id: 61, isComplete: false, status: 'pending' },
    { id: 62, isComplete: false, status: 'pending' },
    { id: 63, isComplete: true, status: 'pending' },
    { id: 64, isComplete: false, status: 'pending' },
    { id: 65, isComplete: true, status: 'pending' },
    { id: 66, isComplete: true, status: 'pending' },
    { id: 67, isComplete: false, status: 'pending' },
    { id: 68, isComplete: true, status: 'pending' },
    { id: 69, isComplete: true, status: 'pending' },
    { id: 70, isComplete: false, status: 'pending' },

    { id: 71, isComplete: false, status: 'pending' },
    { id: 72, isComplete: true, status: 'pending' },
    { id: 73, isComplete: true, status: 'pending' },
    { id: 74, isComplete: false, status: 'pending' },
    { id: 75, isComplete: true, status: 'pending' },
  ];

  constructor(
    private dataApp: DataAppService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadPlayer();
    await this.loadBoard();
    await this.startVerification();
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
    this.boardVerify = this.board.map((row) =>
      row.map((cell) => {
        const drawnBall = this.allBalls.find(
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
        const ball = this.allBalls.find(
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