import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal
} from '@angular/core';

import { DataAppService } from '../../core/services/data-app.service';
import { RoomService } from '../../core/services/room.service';
import { RoomModel } from '../../core/models/room.model';

@Component({
  selector: 'app-circle-count-down',
  imports: [],
  templateUrl: './circle-count-down.html',
  styleUrl: './circle-count-down.scss',
})
export class CircleCountDown implements OnInit, OnChanges {

  @Input() paused = false;
  @Input() seconds = 10;
  @Input() trigger = 0;
  @Input() nextBallAt: number = 0;

  isViewInfoBall = false;

  progress = signal(100);
  timer = signal(0);

  interval!: ReturnType<typeof setInterval>;

  radius = 54;
  circumference = 2 * Math.PI * this.radius;

  room: RoomModel = {} as RoomModel;
  currentBall: any = null;

  lastThreeBalls: any[] = [];

  constructor(
    private dataApp: DataAppService,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    this.dataApp.getRoom().subscribe((room) => {
      if (room != null) {
        this.room = room;
        this.getCalledBalls(this.room.id);
        this.getCurrentBall(this.room.id);
        return;
      }

      const roomStorage = this.dataApp.getStorage('room') as RoomModel;

      if (roomStorage === null) {
        return;
      }

      this.room = roomStorage;
      this.dataApp.setRoom(roomStorage);
    });

    this.dataApp.getIsViewInitialGame().subscribe((value) => {
      this.isViewInfoBall = !value;

      if (this.isViewInfoBall && !this.paused) {
        this.start();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['paused']) {

      if (this.paused) {
        this.stopCounter();
      } else {
        this.start();
      }
    }

    if (changes['nextBallAt'] && !this.paused && this.nextBallAt) {
      this.start();
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
    let current = this.getRemainingSeconds();
    if (current <= 0 && this.nextBallAt && this.nextBallAt <= Date.now()) {
      current = this.seconds;
    }
    this.timer.set(current);
    this.progress.set((current / this.seconds) * 100);

    this.interval = setInterval(() => {
      if (this.paused) {
        clearInterval(this.interval);
        return;
      }
      const remaining = this.getRemainingSeconds();
      this.timer.set(remaining);
      this.progress.set(
        (remaining / this.seconds) * 100
      );

      if (remaining <= 0) {

        clearInterval(this.interval);
      }

    }, 250);

  }

  stopCounter(): void {
    clearInterval(this.interval);
  }

  getStrokeOffset(): number {
    return (
      this.circumference -
      (this.progress() / 100) *
      this.circumference
    );
  }

  getCalledBalls(roomId: string): void {
    this.roomService
      .getCalledBalls(roomId)
      .subscribe((balls: any[]) => {
        if (!balls) {
          this.lastThreeBalls = [];
          return;
        }
        this.lastThreeBalls = balls.slice(-3).reverse();
      });
  }

  getCurrentBall(roomId: string): void {
    this.roomService
      .getCurrentBall(roomId)
      .subscribe((currentBall: any) => {
        if (!currentBall) {
          return;
        }
        this.currentBall = {
          letter: currentBall.letter,
          number: currentBall.number
        };
      });
  }
}