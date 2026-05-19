import { Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { Player } from '../../core/models/player.model';
import { DataAppService } from '../../core/services/data-app.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  player: Player | null = null;
  public roomControl = new FormControl('');

  public keys: string[] = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'CLEAN', '0', 'DEL'
  ];


  constructor(
    private dataApp: DataAppService,
    private router: Router
  ) {

  }

  ngOnInit() {
    this.dataApp.getPlayer().subscribe((player) => {
      this.player = player;
      console.log(player);
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

    console.log(this.roomControl.value);
  }

  joinRoom() {
    this.router.navigate(['lobby']);
  }

}
