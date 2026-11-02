import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { ConfetiWinner } from '../confeti-winner/confeti-winner';
import { DataAppService } from '../../core/services/data-app.service';
import { RoomService } from '../../core/services/room.service';
import { errorModal } from '../../utils/modals';

@Component({
  selector: 'app-winner',
  imports: [
    ConfetiWinner
  ],
  templateUrl: './winner.html',
  styleUrl: './winner.scss',
})
export class Winner {

  @Input() winnerName = '';
  @Input() isHost = false;

  isSending = false;

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {}

  /** El host reinicia la partida con los mismos jugadores; todos vuelven al lobby. */
  newGame() {
    if (this.isSending) return;
    this.isSending = true;

    this.roomService.rematch().subscribe((resp) => {
      this.isSending = false;
      if (resp.code !== 'UR001') {
        errorModal({ title: resp.message ?? 'Ha ocurrido un error' });
      }
      this.cdr.detectChanges();
    });
  }

  goToHome() {
    this.roomService.leaveRoom();
    this.dataApp.resetGameState();
    this.dataApp.goToPage('/welcome_view');
  }
}
