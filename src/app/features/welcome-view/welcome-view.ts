import { Component } from '@angular/core';
import { Version } from "../../shared/version/version";
import { Bingo } from '../../shared/bingo/bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';

@Component({
  selector: 'app-welcome-view',
  imports: [
    Bingo,
    Version
  ],
  templateUrl: './welcome-view.html',
  styleUrl: './welcome-view.scss',
})
export class WelcomeView {

  constructor(private dataApp: DataAppService) {

  }

  selectUser(isHost: boolean = false) {
    const player: Player = {
      id: "123",
      name: "",
      isHost: isHost
    }

    this.dataApp.setPlayer(player);
  }

}
