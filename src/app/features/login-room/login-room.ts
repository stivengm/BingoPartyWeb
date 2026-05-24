import { Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { Player } from '../../core/models/player.model';
import { DataAppService } from '../../core/services/data-app.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RoomService } from '../../core/services/room.service';
import { JoinRoomModel } from '../../core/models/join_room.model';
import { errorModal } from '../../utils/modals';
import { RoomModel } from '../../core/models/room.model';

@Component({
  selector: 'app-login-room',
  imports: [
    Header,
    ReactiveFormsModule
  ],
  templateUrl: './login-room.html',
  styleUrl: './login-room.scss',
})
export class LoginRoom implements OnInit {
  player: Player = {} as Player;
  room: RoomModel = {} as RoomModel;
  public roomControl = new FormControl('');

  public keys: string[] = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'CLEAN', '0', 'DEL'
  ];


  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService
  ) {

  }

  ngOnInit() {
    this.getPlayer();
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

  pressKey(key: string): void {
    const currentValue = this.roomControl.value || '';

    switch (key) {
      case 'DEL':
        this.roomControl.setValue(
          currentValue.slice(0, -1)
        );
        break;
      case 'CLEAN':
        this.roomControl.setValue('');
        break;
      default:
        this.roomControl.setValue(
          currentValue + key
        );
        break;
    }
  }

  joinRoom() {
    let joinRoom: JoinRoomModel = {
      roomId: this.roomControl.value ?? "",
      playerName: this.player.name
    }

    this.roomService.joinRoom(joinRoom).subscribe((joinRoom) => {
      if (joinRoom.code != "JR001") {
        errorModal({ title: joinRoom.message ?? "Ha ocurrido un error"});
        return;
      }

      this.dataApp.setPlayer(joinRoom.data.player);
      this.room = joinRoom.data;
      this.dataApp.setRoom(this.room!);
      this.dataApp.setIsLoader(false);

      this.dataApp.goToPage("/lobby");
    });
  }

}
