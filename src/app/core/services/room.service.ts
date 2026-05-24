import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CreateRoomModel } from '../models/create_room.model';
import { ResponseServicesModel } from '../models/response_services.model';
import { RoomModel } from '../models/room.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

    constructor(
        private router: Router,
        private http: HttpClient
    ) {}

    createRoom(room: CreateRoomModel): Observable<ResponseServicesModel<RoomModel>> {
        return this.http.post<ResponseServicesModel<RoomModel>>(`${environment.apiUrl}/rooms/create`, room);
    }
}