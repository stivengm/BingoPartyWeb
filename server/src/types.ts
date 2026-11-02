export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
export type BallLetter = 'B' | 'I' | 'N' | 'G' | 'O';

/** 1 = digital (sorteo automático), 2 = físico (el host saca las bolitas a mano). */
export type GameType = 1 | 2;

export interface Ball {
  number: number;
  letter: BallLetter;
  value: string;
  calledAt: number;
}

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  connected: boolean;
}

export interface BoardCell {
  value: number;
  marked?: boolean;
}

export interface Claim {
  playerId: string;
  playerName: string;
  avatar: string;
  /** Cartón enviado por el jugador (solo en juego digital). */
  board: BoardCell[][] | null;
  /** Resultado de la verificación automática. `null` en juego físico: decide el host. */
  valid: boolean | null;
  claimedAt: number;
}

export interface Winner {
  id: string;
  name: string;
  avatar: string;
}

/** Lo que reciben los clientes en cada `room:state`. */
export interface RoomView {
  id: string;
  gameType: GameType;
  gameTypeName: 'automatic' | 'manual';
  gameBoardType: number;
  secondsBalls: number;
  status: GameStatus;
  hostId: string;
  players: PublicPlayer[];
  currentBall: Ball | null;
  calledBalls: Ball[];
  remainingBalls: number;
  /** Ya salieron las 75 bolitas. */
  exhausted: boolean;
  /** Marca de tiempo del servidor en la que saldrá la siguiente bolita (solo digital jugando). */
  nextBallAt: number | null;
  /** Hora del servidor al armar el estado: sirve para corregir el desfase de reloj. */
  serverNow: number;
  playerLastUpdateGame: PublicPlayer | null;
  boardLastUpdateGame: BoardCell[][] | null;
  claimValid: boolean | null;
  winner: Winner | null;
  /** Se incrementa en cada partida nueva (revancha). */
  round: number;
}

export interface Ack<T = unknown> {
  code: string;
  message: string;
  data: T | null;
}
