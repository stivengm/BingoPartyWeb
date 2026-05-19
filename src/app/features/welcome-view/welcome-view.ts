import { Component, OnInit } from '@angular/core';
import { Version } from "../../shared/version/version";
import { Bingo } from '../../shared/bingo/bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../shared/layout/header/header';

@Component({
  selector: 'app-welcome-view',
  imports: [
    Bingo,
    Version,
    Header,
    ReactiveFormsModule
  ],
  templateUrl: './welcome-view.html',
  styleUrl: './welcome-view.scss',
})
export class WelcomeView implements OnInit {

  player: Player | null = null;

  public aliasControl = new FormControl(
    '',
    [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ]
  );

  constructor(
    private dataApp: DataAppService,
    private router: Router
  ) {

  }

  ngOnInit() {
    this.dataApp.getPlayer().subscribe((player) => {
      if (player != null) return;

      let playerStorage = this.dataApp.getStorage('player') as Player;

      debugger;

      if (playerStorage == null || playerStorage == undefined) return;


      this.player = playerStorage;
      this.dataApp.setPlayer(playerStorage);
    });
  }

  selectUser(isHost: boolean = false) {
    if (this.aliasControl.invalid) {
      this.aliasControl.markAsTouched();
      return;
    }

    const alias = this.aliasControl.value;

    const player: Player = {
      id: "123",
      name: alias ?? "",
      isHost: isHost
    }

    this.dataApp.setPlayer(player);

    if (isHost) {
      this.router.navigate(['/create_room']);
      return;
    }
    
    this.router.navigate(['/login_room']);
  }

}
