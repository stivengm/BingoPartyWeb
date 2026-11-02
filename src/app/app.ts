import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { Loader } from "./shared/loader/loader";
import { DataAppService } from './core/services/data-app.service';
import { RoomService } from './core/services/room.service';
import { errorModal } from './utils/modals';

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
  private destroyRef = inject(DestroyRef);
  isLoader = false;

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService
  ) {

  }

  ngOnInit(): void {
    // Conectar desde el inicio despierta el servidor (Render) mientras la persona escribe su alias.
    this.roomService.connect();

    this.dataApp.getIsLoader().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isLoader) => {
      this.isLoader = isLoader;
    });

    this.roomService.sessionLost$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      errorModal({ title: message || 'La sala ya no está disponible.' });
      this.dataApp.goToPage('/welcome_view');
    });
  }

}
