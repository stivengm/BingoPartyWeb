import { Ball } from "./ball.model";
import { Player } from "./player.model";

export interface RoomModel {
  
  id?: string;
  hostId?: string;
  timer: number;
  players?: Player[];
  currentBall?: Ball;
  calledBalls?: Ball[];
  bingoBoardId?: number;
  status?: 'waiting' | 'playing' | 'finished';
  mode?: 'automatic' | 'manual';
}