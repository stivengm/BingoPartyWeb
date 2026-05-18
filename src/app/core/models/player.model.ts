import { BingoBoard } from "./bingo_board.model";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  board?: BingoBoard;
}