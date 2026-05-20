import { Component, OnInit, signal } from '@angular/core';
import { DataAppService } from '../../core/services/data-app.service';

@Component({
  selector: 'app-count-down-overlay-game',
  imports: [],
  templateUrl: './count-down-overlay-game.html',
  styleUrl: './count-down-overlay-game.scss',
})
export class CountDownOverlayGame implements OnInit {

  values = ['3', '2', '1', '¡YA!'];

  currentValue = signal<string | null>(null);

  constructor(private dataApp: DataAppService) {
  }
  
  ngOnInit(): void {
    this.startCountdown();
  }

  startCountdown(): void {
    this.values.forEach((value, index) => {
      setTimeout(() => {
        this.currentValue.set(value);
        setTimeout(() => {
          this.currentValue.set(null);
          if (index === this.values.length - 1) {
            setTimeout(() => {
              this.dataApp.setIsViewInitialGame(false);
            }, 0);
          }
        }, 1000);
      }, (index + 1) * 1200);
    });
  }

}
