import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { Router } from '@angular/router';
import { CommonModule, NgClass } from "@angular/common";
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';

@Component({
  selector: 'app-create-room',
  imports: [
    CommonModule,
    Header,
    TableroBingo,
    NgClass
],
  templateUrl: './create-room.html',
  styleUrl: './create-room.scss',
})
export class CreateRoom {

  idGameType = 0;

  boards = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor(private router: Router) {}

  createRoom() {
    this.router.navigate(['lobby']);
  }

  selectedGameType(id: number) {
    this.idGameType = id;
  }
}
