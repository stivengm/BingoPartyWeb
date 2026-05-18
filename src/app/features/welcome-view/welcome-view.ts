import { Component } from '@angular/core';
import { Version } from "../../shared/version/version";
import { Bingo } from '../../shared/bingo/bingo';

@Component({
  selector: 'app-welcome-view',
  imports: [
    Bingo,
    Version
  ],
  templateUrl: './welcome-view.html',
  styleUrl: './welcome-view.scss',
})
export class WelcomeView {}
