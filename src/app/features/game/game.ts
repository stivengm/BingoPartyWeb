import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { CountDownOverlayGame } from '../../shared/count-down-overlay-game/count-down-overlay-game';
import { DataAppService } from '../../core/services/data-app.service';
import { CircleCountDown } from '../../shared/circle-count-down/circle-count-down';
import { RoomModel } from '../../core/models/room.model';
import { VerifyGameResults } from '../../shared/verify-game-results/verify-game-results';

@Component({
  selector: 'app-game',
  imports: [
    Header,
    TableroBingo,
    CountDownOverlayGame,
    CircleCountDown,
    VerifyGameResults
  ],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})
export class Game implements OnInit {

  isViewInitialGame = true;

  timerChangeBall = 0;

  isValidateBoard = false;

  room: RoomModel = {} as RoomModel;

  constructor(
    private dataApp: DataAppService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dataApp.getIsViewInitialGame().subscribe((value) => {
      this.isViewInitialGame = value;
      this.cdr.detectChanges();
    });

    this.dataApp.getRoom().subscribe((room) => {
      if (room != null) {
        this.room = room;
        this.timerChangeBall = this.room.timer;
        return;
      }

      let romStorage = this.dataApp.getStorage('room') as RoomModel;

      if (romStorage === null) {
        // TODO: Enviar al welcome porque no existe Room
        return;
      };
      
      this.room = romStorage;
      this.dataApp.setRoom(romStorage);
    });
  }

  validateBoard() {
    this.isValidateBoard = true;
  }

}
