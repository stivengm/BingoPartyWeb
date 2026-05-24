import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CreateRoomModel } from '../models/create_room.model';
import { ResponseServicesModel } from '../models/response_services.model';
import { RoomModel } from '../models/room.model';
import { map, Observable } from 'rxjs';
import { Player } from '../models/player.model';
import { JoinRoomModel } from '../models/join_room.model';

import { objectVal, ref, Database } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

    private db = inject(Database);

    constructor(
        private router: Router,
        private http: HttpClient
    ) {}

    createRoom(room: CreateRoomModel): Observable<ResponseServicesModel<RoomModel>> {
        return this.http.post<ResponseServicesModel<RoomModel>>(`${environment.apiUrl}/rooms/create`, room);
    }

    joinRoom(room: JoinRoomModel): Observable<ResponseServicesModel<RoomModel>> {
        return this.http.post<ResponseServicesModel<RoomModel>>(`${environment.apiUrl}/rooms/join`, room);
    }

    updateRoom(updateRoom: any): Observable<ResponseServicesModel<RoomModel>> {
        return this.http.post<ResponseServicesModel<RoomModel>>(`${environment.apiUrl}/rooms/update`, updateRoom);
    }

    getRoomInLobby(roomCode: string): Observable<any> {
        const roomRef = ref(
            this.db,
            `rooms/${roomCode}`
        );

        return objectVal(roomRef) as Observable<any>;
    }

    getPlayers(roomCode: string): Observable<Player[]> {
        const playersRef = ref(
        this.db,
        `rooms/${roomCode}/players`
        );

        return objectVal(playersRef).pipe(
            map((players: any) => {
                if (!players) {
                return [];
                }

                return Object.values(players);

            })
        ) as Observable<Player[]>;
    }
}