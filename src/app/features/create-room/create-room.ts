import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { Router } from '@angular/router';
import { CommonModule, NgClass } from "@angular/common";
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { errorModal } from '../../utils/modals';

@Component({
  selector: 'app-create-room',
  imports: [
    CommonModule,
    Header,
    TableroBingo,
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

    // TODO: Realizar la creación de la sala.
    this.dataApp.goToPage("/lobby");
  }

  selectedGameType(id: number) {
    this.idGameType = id;
  }

  selectedBoardType(id: number) {
    this.idBoardType = id;
  }
}
