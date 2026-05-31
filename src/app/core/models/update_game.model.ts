import { statusGameEnum, StatusGameModel } from "./status_game.model";

export interface UpdateGameModel {
    roomId: string;
    playerId: string;
    status: statusGameEnum;
    board?: any;
}