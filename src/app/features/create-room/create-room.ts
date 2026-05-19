import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { Router } from '@angular/router';
import { CommonModule, NgClass } from "@angular/common";

@Component({
  selector: 'app-create-room',
  imports: [
    CommonModule,
    Header,
    NgClass
],
  templateUrl: './create-room.html',
  styleUrl: './create-room.scss',
})
export class CreateRoom {

  idGameType = 0;

  constructor(private router: Router) {}

  createRoom() {
    this.router.navigate(['lobby']);
  }

  selectedGameType(id: number) {
    debugger;

    this.idGameType = id;

  }
}
