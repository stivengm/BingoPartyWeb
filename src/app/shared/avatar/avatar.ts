import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';

@Component({
  selector: 'app-avatar',
  imports: [],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
})
export class Avatar implements OnInit {
  
  listAvatares = [
    'astronauta_1',
    'astronauta_2',
    'gato',
    'leon',
    'perro',
    'pirata_1',
    'pirata_2',
    'reina',
    'rey',
    'robot',
    'vaca'
  ];

  player: Player = {} as Player;

  avatarSelected: string = "";
  showModal: boolean = false;
  tempAvatarSelected: string = "";

  constructor(private dataApp: DataAppService) {}

  ngOnInit(): void {
    this.avatarSelected = this.listAvatares[Math.floor(Math.random() * this.listAvatares.length)];
    this.player = this.dataApp.getCurrentPlayer() as Player;

    this.player.avatar = this.avatarSelected;
    this.dataApp.setPlayer(this.player);
  }

  openModal(): void {
    this.tempAvatarSelected = this.avatarSelected;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  selectAvatar(avatar: string): void {
    this.tempAvatarSelected = avatar;
  }

  confirmAvatar(): void {
    this.avatarSelected = this.tempAvatarSelected;
    this.showModal = false;

    this.player.avatar = this.avatarSelected;
    this.dataApp.setPlayer(this.player);
  }
}
