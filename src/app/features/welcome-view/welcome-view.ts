import { Component, inject, OnInit } from '@angular/core';
import { Version } from "../../shared/version/version";
import { Bingo } from '../../shared/bingo/bingo';
import { DataAppService } from '../../core/services/data-app.service';
import { Player } from '../../core/models/player.model';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../../shared/layout/header/header';
import { errorModal } from '../../utils/modals';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

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
  private destroyRef = inject(DestroyRef);
  

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
  ) {}

  ngOnInit() {
    this.dataApp.getPlayer().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((player) => {
      if (player != null) {
        this.player = player;
        this.aliasControl.patchValue(player.name);
        return;
      }

      let playerStorage = this.dataApp.getStorage('player') as Player;

      if (playerStorage === null) return;

      this.player = playerStorage;
      this.aliasControl.patchValue(playerStorage.name);
    });
  }

  selectUser(isHost: boolean = false) {
    if (this.aliasControl.invalid) {
      errorModal({ title: "Por favor ingrese el nombre del jugador."});
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
      this.dataApp.goToPage("/create_room");
      return;
    }
    
    this.dataApp.goToPage("/login_room");
  }

}
