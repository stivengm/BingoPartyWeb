import { Component } from '@angular/core';
import { DataAppService } from '../../../core/services/data-app.service';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  constructor(private dataApp: DataAppService, private roomService: RoomService) {}

  goToHome() {
    // Salir de la sala avisa al servidor para liberar la silla.
    this.roomService.leaveRoom();
    this.dataApp.clearStorage();
    this.dataApp.resetGameState();
    this.dataApp.goToPage('/welcome_view');
    this.dataApp.setPlayer(null);
  }
}
