import { Component, OnInit } from '@angular/core';
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

  constructor(private router: Router) {}

  ngOnInit() {}

  newGame() {
    this.router.navigate(["/create_room"]);
  }

  goToHome() {
    this.router.navigate(["/welcome_view"]);
  }
}
