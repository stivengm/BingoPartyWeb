import { Component, Input } from '@angular/core';
import { BingoCell } from '../../core/models/bingo_cell.model';
import { DataAppService } from '../../core/services/data-app.service';
import { RoomModel } from '../../core/models/room.model';

@Component({
  selector: 'app-tablero-bingo',
  imports: [],
  templateUrl: './tablero-bingo.html',
  styleUrl: './tablero-bingo.scss',
})
export class TableroBingo {
  @Input() boardId: number = 0;
  @Input() cells: BingoCell[][] | null = null;
  @Input() isViewLetters = true;
  @Input() isBoardDisabled = false;

  letters = ['B', 'I', 'N', 'G', 'O'];

  board: BingoCell[][] = [];

  timer = 10;

  constructor(private dataApp: DataAppService) {}

  ngOnInit(): void {
    this.dataApp.getRoom().subscribe((room) => {
      if (room != null) {
        debugger;
        this.boardId = room.gameBoardType;
        return;
      }

      let romStorage = this.dataApp.getStorage('room') as RoomModel;

      if (romStorage === null) {
        return;
      };
      
      this.dataApp.setRoom(romStorage);
    });

    if (this.cells && this.cells.length > 0) {
      this.board = this.cells;
      return;
    }

    this.dataApp.getBoard().subscribe((board) => {
      debugger;
      if (board) {
        this.board = board;
        // this.boardId = board.boardId;
        return;
      }

      const boardStorage = this.dataApp.getStorage('board') as BingoCell[][];

      if (boardStorage) {
        debugger;
        this.board = boardStorage;
        // this.boardId = board.boardId;
        return;
      }

      this.generateEmptyBoard();
    });
  }

  isInGame(rowIndex: number, colIndex: number): boolean {
    switch (this.boardId) {

      // B3, I3, N3, G3, O3
      case 1:
        return rowIndex === 2;

      // N1, N2, N3, N4, N5
      case 2:
        return colIndex === 2;

      // B1, I2, N3, G4, O5
      case 3:
        return rowIndex === colIndex;

      // B5, I4, N3, G2, O1
      case 4:
        return rowIndex + colIndex === 4;

      // B1, B2, B3, B4, B5, I5, N5, G5, O5
      case 5:
        return (
          colIndex === 0 ||
          rowIndex === 4
        );

      // O1, O2, O3, O4, O5, G5, N5, I5, B5
      case 6:
        return (
          colIndex === 4 ||
          rowIndex === 4
        );

      // B1, B2, B3, B4, B5,
      // I1, I5,
      // N1, N5,
      // G1, G5,
      // O1, O2, O3, O4, O5
      case 7:
        return (
          rowIndex === 0 ||
          rowIndex === 4 ||
          colIndex === 0 ||
          colIndex === 4
        );

      // TODO EL TARJETÓN
      case 8:
        return true;

      default:
        return false;
    }
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
