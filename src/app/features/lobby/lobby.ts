import { Component } from '@angular/core';
import { Header } from '../../shared/layout/header/header';

@Component({
  selector: 'app-lobby',
  imports: [
    Header
  ],
  templateUrl: './lobby.html',
  styleUrl: './lobby.scss',
})
export class Lobby {}
