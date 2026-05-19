import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-room',
  imports: [
    Header
  ],
  templateUrl: './create-room.html',
  styleUrl: './create-room.scss',
})
export class CreateRoom {

  constructor(private router: Router) {}

  createRoom() {
    this.router.navigate(['lobby']);
  }
}
