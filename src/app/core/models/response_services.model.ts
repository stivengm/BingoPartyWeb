export interface ResponseServicesModel<T> {
    code: string;
    message: string;
    data: T
}

/** Datos que devuelven crear sala / unirse / reconectar. */
export interface RoomSession {
    room: import('./room.model').RoomModel;
    playerId: string;
}
