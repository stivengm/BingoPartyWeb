import { Component, ChangeDetectorRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';


import { Player } from '../../core/models/player.model';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { VerifyBall, VerifyCell } from '../../core/models/verify_cell.model';
import { RoomService } from '../../core/services/room.service';
import { errorModal } from '../../utils/modals';

@Component({
  selector: 'app-verify-game-results',
  imports: [
    CommonModule
  ],
  templateUrl: './verify-game-results.html',
  styleUrl: './verify-game-results.scss',
})
export class VerifyGameResults implements OnChanges, OnDestroy {

  @Input() boardId: number = 0;
  @Input() player: Player = {} as Player;
  @Input() board: BingoCell[][] = [];
  /** Solo quien cantó el bingo (o el host) confirma el resultado al terminar la animación. */
  @Input() canResolve = false;

  boardVerify: VerifyCell[][] = [];
  isFinishedValidation = false;
  isValidBoard: boolean | null = null;
  isSending = false;

  @Input() allBallsCalled: VerifyBall[] = [];

  private verificationStarted = false;
  private destroyed = false;

  constructor(
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {}

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

  ngOnDestroy(): void {
    this.destroyed = true;
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

        // Si el juego se reanudó o terminó antes de acabar la animación, se corta.
        if (this.destroyed) return;

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

    if (this.destroyed) return;

    this.isValidBoard = !hasErrors;
    this.isFinishedValidation = true;

    this.cdr.detectChanges();
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** El servidor decide el resultado: gana la partida o se reanuda el juego. */
  confirm() {
    if (this.isSending) return;
    this.isSending = true;

    this.roomService.resolveClaim().subscribe((resp) => {
      this.isSending = false;
      if (resp.code !== 'UR001') {
        errorModal({ title: resp.message ?? 'Ha ocurrido un error' });
      }
      this.cdr.detectChanges();
    });
  }
}
