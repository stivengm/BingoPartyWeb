import { Component } from '@angular/core';

@Component({
  selector: 'app-bingo',
  imports: [],
  templateUrl: './bingo.html',
  styleUrl: './bingo.scss',
})
export class Bingo {
  readonly letters: string[] = ['B', 'I', 'N', 'G', 'O'];
}
