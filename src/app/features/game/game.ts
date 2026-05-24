import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from '../../shared/layout/header/header';
import { TableroBingo } from '../../shared/tablero-bingo/tablero-bingo';
import { CountDownOverlayGame } from '../../shared/count-down-overlay-game/count-down-overlay-game';
import { DataAppService } from '../../core/services/data-app.service';
import { CircleCountDown } from '../../shared/circle-count-down/circle-count-down';
import { RoomModel } from '../../core/models/room.model';
import { VerifyGameResults } from '../../shared/verify-game-results/verify-game-results';
import { RoomService } from '../../core/services/room.service';
import { Player } from '../../core/models/player.model';
import { JoinRoomModel } from '../../core/models/join_room.model';
import { GenerateBallModel } from '../../core/models/generate_ball.model';
import { statusGameEnum } from '../../core/models/status_game.model';
import { errorModal } from '../../utils/modals';
import { UpdateGameModel } from '../../core/models/update_game.model';

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
  player: Player = {} as Player;

  statusGame = "";

  timerChangeBall = 0;

  isValidateBoard = false;

  room: RoomModel = {} as RoomModel;

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.dataApp.getIsViewInitialGame().subscribe((value) => {
      this.isViewInitialGame = value;
      // Juego iniciado por primera vez
      if (!this.isViewInitialGame) {
        this.dataApp.setStatusGame(statusGameEnum.Playing);
      }
      this.cdr.detectChanges();
    });

    this.dataApp.getStatusGame().subscribe((val) => {
      this.statusGame = val;
      if (this.player.isHost && val === statusGameEnum.Playing) {
        const generateBall: GenerateBallModel = {
          roomId: this.room.id,
          playerId: this.player.id
        };

        const generate = () => {
          this.roomService.generateBallService(generateBall).subscribe((isGenerateBall) => {
            if (isGenerateBall.code != "GB001") {
              errorModal({ title: isGenerateBall.message });
              return;
            }
          });
        };

        generate();

        setInterval(() => {
          generate();
        }, (this.timerChangeBall + 0.5) * 1000);
      }
    });

    this.dataApp.getRoom().subscribe((room) => {
      if (room != null) {
        this.room = room;
        this.timerChangeBall = this.room.secondsBalls;
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

    this.dataApp.getPlayer().subscribe((player: Player) => {
      if (player != null) {
        this.player = player;
        return;
      }

      let playerStorage = this.dataApp.getStorage('player') as Player;

      if (playerStorage === null) {
        // TODO: Enviar al welcome porque no existe player
        return;
      };
      
      this.player = playerStorage;
      this.dataApp.setPlayer(playerStorage);
    });

    this.getRoomInGame();
  }

  getRoomInGame() {
    this.roomService.getRoomSuscription(this.room.id).subscribe((updateRoom) => {

      if (updateRoom != null && updateRoom.status === statusGameEnum.Paused) {
        debugger;
        console.log("El juego se pausó.");
        this.isValidateBoard = true;
        this.cdr.detectChanges();
      }
    });
  }

  validateBoard() {
    let pauseRoom: UpdateGameModel = {
      roomId: this.room.id,
      playerId: this.player.id,
      status: statusGameEnum.Paused
    }

    // Pausar juego
    this.roomService.updateRoom(pauseRoom).subscribe((isPauseGame) => {

      debugger;
      console.log(isPauseGame);
    });
  }

}
