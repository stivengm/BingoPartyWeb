import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Player } from '../../core/models/player.model';
import { RoomService } from '../../core/services/room.service';
import { errorModal } from '../../utils/modals';

/** Juego físico: alguien cantó bingo y el host revisa su cartón físico. */
@Component({
  selector: 'app-physical-claim',
  imports: [],
  templateUrl: './physical-claim.html',
  styleUrl: './physical-claim.scss',
})
export class PhysicalClaim {

  @Input() player: Player | null = null;
  @Input() isHost = false;
  @Input() calledBalls: { letter: string; number: number }[] = [];

  isSending = false;

  constructor(private roomService: RoomService, private cdr: ChangeDetectorRef) {}

  resolve(accepted: boolean) {
    if (this.isSending) return;
    this.isSending = true;

    this.roomService.resolveClaim(accepted).subscribe((resp) => {
      this.isSending = false;
      if (resp.code !== 'UR001') {
        errorModal({ title: resp.message ?? 'Ha ocurrido un error' });
      }
      this.cdr.detectChanges();
    });
  }
}
