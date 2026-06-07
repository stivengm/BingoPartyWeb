import { Component, OnInit } from '@angular/core';
import { ConfetiWinner } from '../confeti-winner/confeti-winner';

@Component({
  selector: 'app-winner',
  imports: [
    ConfetiWinner
  ],
  templateUrl: './winner.html',
  styleUrl: './winner.scss',
})
export class Winner implements OnInit {

  constructor() {}

  ngOnInit() {}

}
