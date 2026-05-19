import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';

@Component({
  selector: 'app-game',
  imports: [
    Header,
    TableroBingo
  ],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game {}
