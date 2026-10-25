import { Component, Input, OnInit } from '@angular/core';
import { DataAppService } from '../../core/services/data-app.service';
import { ConfetiWinner } from '../confeti-winner/confeti-winner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-winner',
  imports: [
    ConfetiWinner
  ],
  templateUrl: './winner.html',
  styleUrl: './winner.scss',
})
export class Winner implements OnInit {

  @Input() winnerName = '';

  constructor(private router: Router, private dataApp: DataAppService) {}

  ngOnInit() {}

  newGame() {
    this.dataApp.resetGameState();
    this.router.navigate(["/create_room"]);
  }

  goToHome() {
    this.dataApp.resetGameState();
    this.router.navigate(["/welcome_view"]);
  }
}
