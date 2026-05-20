import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { CommonModule, NgClass } from "@angular/common";
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { errorModal } from '../../utils/modals';
import { Room } from '../../core/models/room.model';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-room',
  imports: [
    CommonModule,
    Header,
    TableroBingo,
    ReactiveFormsModule,
    NgClass
],
  templateUrl: './create-room.html',
  styleUrl: './create-room.scss',
})
export class CreateRoom {

  idGameType = 0;
  idBoardType = 0;

  idRoom = "";

  boards = [1, 2, 3, 4, 5, 6, 7, 8];

  room: Room = {} as Room;

  public timer = new FormControl(
    '10',
    [
      Validators.minLength(0),
      Validators.maxLength(2)
    ]
  );

  constructor(
    private dataApp: DataAppService
  ) {}

  ngOnInit() {
    this.idRoom = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
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

    this.room!.id = this.idRoom;
    this.room!.hostId = this.idRoom;
    this.room!.status = 'waiting';
    this.room!.timer = parseInt(this.timer.value!.toString()) ?? 10;

    this.dataApp.setRoom(this.room!);

    // TODO: Realizar la creación de la sala con servicio.
    this.dataApp.goToPage("/lobby");
  }

  selectedGameType(id: number) {
    this.idGameType = id;
    this.room!.mode = id === 1 ? 'automatic' : 'manual';
  }

  selectedBoardType(id: number) {
    this.idBoardType = id;
    this.room!.bingoBoardId = id;
  }
}
