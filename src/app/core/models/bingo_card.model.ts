export interface BingoCard {
  id: string;
  playerName: string;
  numbers: (number | string)[][];
  markedNumbers: number[];
  hasBingo: boolean;
}