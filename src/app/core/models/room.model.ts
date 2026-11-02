import { Ball } from "./ball.model";
import { BingoCell } from "./bingo_cell.model";
import { Player } from "./player.model";

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface Winner {
  id: string;
  name: string;
  avatar: string;
}

/** Estado de la sala tal como lo envía el servidor en cada `room:state`. */
export interface RoomModel {
  id: string;
  /** 1 = juego digital, 2 = juego físico. */
  gameType: 1 | 2;
  gameTypeName: 'automatic' | 'manual';
  gameBoardType: number;
  secondsBalls: number;
  status: GameStatus;
  hostId: string;
  players: Player[];
  currentBall: Ball | null;
  calledBalls: Ball[];
  remainingBalls: number;
  /** Ya salieron las 75 bolitas. */
  exhausted: boolean;
  /** Hora local (ya corregida el desfase con el servidor) de la siguiente bolita. */
  nextBallAt: number | null;
  serverNow: number;
  playerLastUpdateGame: Player | null;
  boardLastUpdateGame: BingoCell[][] | null;
  /** Resultado de la verificación automática (digital). `null` en juego físico. */
  claimValid: boolean | null;
  winner: Winner | null;
  round: number;
}
