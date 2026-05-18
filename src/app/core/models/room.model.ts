import { Ball } from "./ball.model";
import { Player } from "./player.model";

export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  currentBall?: Ball;
  calledBalls: Ball[];
  status: 'waiting' | 'playing' | 'finished';
  mode: 'automatic' | 'manual';
}