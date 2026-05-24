import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { CommonModule, NgClass } from "@angular/common";
import { DataAppService } from '../../core/services/data-app.service';
import { errorModal } from '../../utils/modals';
import { RoomModel } from '../../core/models/room.model';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoomService } from '../../core/services/room.service';
import { CreateRoomModel } from '../../core/models/create_room.model';
import { Player } from '../../core/models/player.model';
import { ResponseServicesModel } from '../../core/models/response_services.model';

@Component({
  selector: 'app-create-room',
  imports: [
    CommonModule,
    Header,
    ReactiveFormsModule,
    NgClass
],
  templateUrl: './create-room.html',
  styleUrl: './create-room.scss',
})
export class CreateRoom {

  idGameType = 0;
  idBoardType = 0;
  player: Player = {} as Player;

  idRoom = "";

  boards = [1, 2, 3, 4, 5, 6, 7, 8];

  room: RoomModel = {} as RoomModel;

  public timer = new FormControl(
    '10',
    [
      Validators.minLength(0),
      Validators.maxLength(2)
    ]
  );

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService
  ) {}

  ngOnInit() {
    this.getPlayer();

    this.idRoom = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
  }

  getPlayer() {
    this.dataApp.getPlayer().subscribe((player) => {
      if (player != null) {
        this.player = player;
        return;
      }

      let playerStorage = this.dataApp.getStorage('player') as Player;

      if (playerStorage === null) {
        // TODO: Enviar al welcome porque no existe player
        return;
      };
      
      this.player = playerStorage;
      this.dataApp.setPlayer(playerStorage);
    });
  }

  returnWelcome() {
    this.dataApp.goToPage("/welcome_view");
  }

  createRoom() {
    if (this.idGameType === 0) {
      errorModal({ title: "Por favor eliga el tipo de juego."});
      return;
    }

    if (this.idBoardType === 0) {
      errorModal({ title: "Por favor eliga el estilo de cartón."});
      return;
    }

    this.dataApp.setIsLoader(true);

    let createRoom: CreateRoomModel = {
      hostName: this.player.name,
      gameBoardType: this.idBoardType,
      secondsBalls: parseInt(this.timer.value!.toString()) ?? 10,
      gameType: this.idGameType
    }

    this.roomService.createRoom(createRoom).subscribe((respCreateRoom: ResponseServicesModel<RoomModel>) => {
      if (respCreateRoom.code != "CR001") {
        errorModal({ title: respCreateRoom.message ?? "Ha ocurrido un error"});
        return;
      }

      this.dataApp.setPlayer(respCreateRoom.data.host);
      this.room = respCreateRoom.data;
      this.dataApp.setRoom(this.room!);
      this.dataApp.setIsLoader(false);

      this.dataApp.goToPage("/lobby");
    });
  }

  selectedGameType(id: number) {
    this.idGameType = id;
    // this.room!.mode = id === 1 ? 'automatic' : 'manual';
  }

  selectedBoardType(id: number) {
    this.idBoardType = id;
    this.room!.bingoBoardId = id;
  }
}
