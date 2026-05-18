import { BingoCard } from "./bingo_card.model";

export interface BingoBoard {
  id: string;
  code: string;
  size: number;
  cards: BingoCard[];
  numbersDrawn: number[];
  currentNumber?: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  hostName: string;
}