import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loader } from "./shared/loader/loader";
import { DataAppService } from './core/services/data-app.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Loader
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('BingoPartyWeb');
  isLoader = false;

  constructor(private dataApp: DataAppService) {

  }

  ngOnInit(): void {
    this.dataApp.getIsLoader().subscribe((isLoader) => {
      this.isLoader = isLoader;
    });
  }

}
