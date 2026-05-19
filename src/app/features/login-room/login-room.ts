import { Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { Player } from '../../core/models/player.model';
import { DataAppService } from '../../core/services/data-app.service';

@Component({
  selector: 'app-login-room',
  imports: [
    Header
  ],
  templateUrl: './login-room.html',
  styleUrl: './login-room.scss',
})
export class LoginRoom implements OnInit {
  player: Player | null = null;

  public keys: string[] = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'CLEAN', '0', 'DEL'
];


  constructor(private dataApp: DataAppService) {

  }

  ngOnInit() {
    this.dataApp.getPlayer().subscribe((player) => {
      debugger;
      this.player = player;
      console.log(player);
    });
  }

  pressKey(key: string) {

  }

}
