import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';

@Component({
  selector: 'app-lobby',
  imports: [
    Header,
    TableroBingo
  ],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class Lobby {}
