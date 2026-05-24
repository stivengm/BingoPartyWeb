import { Ball } from "./ball.model";
import { Player } from "./player.model";

export interface RoomModel {
  id: string;
  createdAt: any;
  gameBoardType: number;
  gameType: number;
  gameTypeName?: 'automatic' | 'manual'
  host: Player,
  // players
  secondsBalls: number;
  status: 'waiting' | 'playing' | 'finished';




  hostId?: string;
  timer: number;
  players?: Player[];
  currentBall?: Ball;
  calledBalls?: Ball[];
  bingoBoardId?: number;
  
  // mode?: 'automatic' | 'manual';
}