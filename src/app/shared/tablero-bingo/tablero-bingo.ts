import { Component, Input } from '@angular/core';
import { BingoBoard } from '../../core/models/bingo_board.model';
import { BingoCell } from '../../core/models/bingo_cell.model';

@Component({
  selector: 'app-tablero-bingo',
  imports: [],
  templateUrl: './tablero-bingo.html',
  styleUrl: './tablero-bingo.scss',
})
export class TableroBingo {
  @Input() cells: BingoCell[][] | null = null;
  @Input() isBoardDisabled = false;

  board: BingoCell[][] = [];

  ngOnInit(): void {

    if (this.cells && this.cells.length > 0) {
      this.board = this.cells;
      return;
    }

    this.generateEmptyBoard();
  }

  generateEmptyBoard(): void {

    this.board = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => ({
        value: ''
      }))
    );

  }

  onSelect(cell: BingoCell): void {
    if (this.isBoardDisabled) return;
    if (cell.disabled) return;

    cell.marked = !cell.marked;
  }
}
