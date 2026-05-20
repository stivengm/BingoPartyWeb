import { Component, Input } from '@angular/core';
import { BingoBoard } from '../../core/models/bingo_board.model';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { DataAppService } from '../../core/services/data-app.service';

@Component({
  selector: 'app-tablero-bingo',
  imports: [],
  templateUrl: './tablero-bingo.html',
  styleUrl: './tablero-bingo.scss',
})
export class TableroBingo {
  @Input() cells: BingoCell[][] | null = null;
  @Input() isViewLetters = true;
  @Input() isBoardDisabled = false;

  letters = ['B', 'I', 'N', 'G', 'O'];

  board: BingoCell[][] = [];

  timer = 10;

  constructor(private dataApp: DataAppService) {}

  ngOnInit(): void {
    if (this.cells && this.cells.length > 0) {
      this.board = this.cells;
      return;
    }

    this.dataApp.getBoard().subscribe((board) => {
      if (board === null) {
        this.generateEmptyBoard();
      };

      this.board = board;
    });
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
