import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataAppService } from '../../core/services/data-app.service';

import { Player } from '../../core/models/player.model';
import { BingoCell } from '../../core/models/bingo_cell.model';

type VerifyStatus =
  | 'pending'
  | 'success'
  | 'error';

interface VerifyCell {
  number: number;
  isDrawn: boolean;
  status: VerifyStatus;
}

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

  allBalls = [
    { id: 1, isComplete: true },
    { id: 2, isComplete: false },
    { id: 3, isComplete: true },
    { id: 4, isComplete: true },
    { id: 5, isComplete: false },
    { id: 6, isComplete: true },
    { id: 7, isComplete: false },
    { id: 8, isComplete: false },
    { id: 9, isComplete: true },
    { id: 10, isComplete: false },

    { id: 11, isComplete: false },
    { id: 12, isComplete: true },
    { id: 13, isComplete: false },
    { id: 14, isComplete: false },
    { id: 15, isComplete: true },
    { id: 16, isComplete: false },
    { id: 17, isComplete: false },
    { id: 18, isComplete: true },
    { id: 19, isComplete: false },
    { id: 20, isComplete: false },

    { id: 21, isComplete: true },
    { id: 22, isComplete: false },
    { id: 23, isComplete: true },
    { id: 24, isComplete: true },
    { id: 25, isComplete: false },
    { id: 26, isComplete: false },
    { id: 27, isComplete: true },
    { id: 28, isComplete: false },
    { id: 29, isComplete: false },
    { id: 30, isComplete: true },

    { id: 31, isComplete: false },
    { id: 32, isComplete: false },
    { id: 33, isComplete: true },
    { id: 34, isComplete: false },
    { id: 35, isComplete: false },
    { id: 36, isComplete: true },
    { id: 37, isComplete: true },
    { id: 38, isComplete: false },
    { id: 39, isComplete: true },
    { id: 40, isComplete: true },

    { id: 41, isComplete: false },
    { id: 42, isComplete: true },
    { id: 43, isComplete: false },
    { id: 44, isComplete: false },
    { id: 45, isComplete: true },
    { id: 46, isComplete: true },
    { id: 47, isComplete: true },
    { id: 48, isComplete: true },
    { id: 49, isComplete: false },
    { id: 50, isComplete: false },

    { id: 51, isComplete: true },
    { id: 52, isComplete: false },
    { id: 53, isComplete: false },
    { id: 54, isComplete: true },
    { id: 55, isComplete: false },
    { id: 56, isComplete: false },
    { id: 57, isComplete: true },
    { id: 58, isComplete: true },
    { id: 59, isComplete: true },
    { id: 60, isComplete: true },

    { id: 61, isComplete: false },
    { id: 62, isComplete: false },
    { id: 63, isComplete: true },
    { id: 64, isComplete: false },
    { id: 65, isComplete: true },
    { id: 66, isComplete: true },
    { id: 67, isComplete: false },
    { id: 68, isComplete: true },
    { id: 69, isComplete: true },
    { id: 70, isComplete: false },

    { id: 71, isComplete: false },
    { id: 72, isComplete: true },
    { id: 73, isComplete: false },
    { id: 74, isComplete: false },
    { id: 75, isComplete: true },
  ];

  constructor(
    private dataApp: DataAppService
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

    for (const row of this.boardVerify) {

      for (const cell of row) {

        cell.status = cell.isDrawn
          ? 'success'
          : 'error';

        await this.sleep(200);

      }

    }

  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}