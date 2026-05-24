export const enum statusGameEnum {
    Waiting = 'waiting',
    Playing = 'playing',
    Paused = 'paused',
    Finished = 'finished'
};

export interface StatusGameModel {
    status: statusGameEnum
}