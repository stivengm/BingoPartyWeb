import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { CountDownOverlayGame } from '../../shared/count-down-overlay-game/count-down-overlay-game';
import { DataAppService } from '../../core/services/data-app.service';
import { CircleCountDown } from '../../shared/circle-count-down/circle-count-down';

@Component({
  selector: 'app-game',
  imports: [
    Header,
    TableroBingo,
    CountDownOverlayGame,
    CircleCountDown
  ],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements OnInit {

  isViewInitialGame = true;

  constructor(
    private dataApp: DataAppService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dataApp.getIsViewInitialGame().subscribe((value) => {
      this.isViewInitialGame = value;
      this.cdr.detectChanges();
    });
  }

}
