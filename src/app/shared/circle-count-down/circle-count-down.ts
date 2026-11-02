import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataAppService } from '../../core/services/data-app.service';
import { RoomService } from '../../core/services/room.service';
import { RoomModel } from '../../core/models/room.model';

/** Cuánto antes de salir la bolita empieza a girar. */
const SPIN_BEFORE_BALL_MS = 1500;

@Component({
  selector: 'app-circle-count-down',
  imports: [],
  templateUrl: './circle-count-down.html',
  styleUrl: './circle-count-down.scss',
})
export class CircleCountDown implements OnInit, OnChanges, OnDestroy {

  private destroyRef = inject(DestroyRef);

  @Input() paused = false;
  @Input() seconds = 10;
  @Input() nextBallAt: number | null = 0;
  /** Juego físico: no hay cuenta regresiva, la bolita sale cuando el host la saca. */
  @Input() isManual = false;
  /** El host acaba de pedir una bolita y se espera la respuesta (modo físico). */
  @Input() isRequesting = false;

  isViewInfoBall = false;

  progress = signal(100);
  timer = signal(0);
  /** La bolita gira mientras se genera la siguiente. */
  isSpinning = signal(false);
  /** Destello breve cuando llega una bolita nueva. */
  isRevealing = signal(false);

  interval: ReturnType<typeof setInterval> | undefined;
  private revealTimeout: ReturnType<typeof setTimeout> | undefined;

  radius = 54;
  circumference = 2 * Math.PI * this.radius;

  room: RoomModel = {} as RoomModel;
  currentBall: { letter: string; number: number } | null = null;

  lastThreeBalls: any[] = [];

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    const roomStorage = this.dataApp.getCurrentRoom() ?? this.dataApp.getStorage('room') as RoomModel | null;
    if (roomStorage) {
      this.room = roomStorage;
    }

    this.roomService.getRoomSuscription(this.room.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((room) => {
      this.room = room;
      this.updateBalls(room);
    });

    this.dataApp.getIsViewInitialGame().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.isViewInfoBall = !value;

      if (this.isViewInfoBall && !this.paused && !this.isManual) {
        this.start();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isManual) {
      this.stopCounter();
      return;
    }

    if (changes['paused']) {
      if (this.paused) {
        this.stopCounter();
        this.isSpinning.set(false);
      } else {
        this.start();
      }
    }

    if (changes['nextBallAt'] && !this.paused) {
      this.start();
    }
  }

  ngOnDestroy(): void {
    this.stopCounter();
    clearTimeout(this.revealTimeout);
  }

  /** Detecta una bolita nueva para animarla. */
  private updateBalls(room: RoomModel): void {
    const ball = room.currentBall;
    this.lastThreeBalls = room.calledBalls.slice(-3).reverse();

    if (!ball) {
      this.currentBall = null;
      return;
    }

    const isNew = this.currentBall?.number !== ball.number;
    this.currentBall = { letter: ball.letter, number: ball.number };

    if (isNew) {
      this.isSpinning.set(false);
      this.isRevealing.set(true);
      clearTimeout(this.revealTimeout);
      this.revealTimeout = setTimeout(() => this.isRevealing.set(false), 900);
    }
  }

  private getRemainingSeconds(): number {
    if (!this.nextBallAt) {
      return this.seconds;
    }
    return Math.max(
      0,
      Math.ceil(
        (this.nextBallAt - Date.now()) / 1000
      )
    );
  }

  start(): void {
    this.stopCounter();
    if (this.isManual) return;

    const total = Math.max(1, this.seconds);
    this.tick(total);

    this.interval = setInterval(() => this.tick(total), 100);
  }

  private tick(total: number): void {
    if (this.paused) {
      this.stopCounter();
      return;
    }

    const remaining = this.getRemainingSeconds();
    this.timer.set(Math.min(remaining, total));
    this.progress.set(Math.min(100, (remaining / total) * 100));

    // Último tramo antes de la bolita: gira hasta que el servidor mande la nueva.
    const msLeft = this.nextBallAt ? this.nextBallAt - Date.now() : Infinity;
    this.isSpinning.set(this.isViewInfoBall && !!this.nextBallAt && msLeft <= SPIN_BEFORE_BALL_MS);
  }

  stopCounter(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  get isBallSpinning(): boolean {
    return this.isSpinning() || this.isRequesting;
  }

  getStrokeOffset(): number {
    return (
      this.circumference -
      (this.progress() / 100) *
      this.circumference
    );
  }
}
