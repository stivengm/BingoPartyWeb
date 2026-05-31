import { Component, Input, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
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

  isViewInfoBall = false;

  progress = signal(100);
  timer = signal(0);

  interval!: ReturnType<typeof setInterval>;
  restartInterval!: ReturnType<typeof setInterval>;

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
        this.startCounterCycle();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['paused']) {

      if (this.paused) {
        this.stopCounterCycle();
      } else if (this.isViewInfoBall) {
        this.startCounterCycle();
      }
    }
  }

  startCounterCycle(): void {
    this.stopCounterCycle();
    this.start();
    this.restartInterval = setInterval(() => {
      if (!this.paused) {
        this.start();
      }
    }, (this.seconds + 0.5) * 1000);
  }

  stopCounterCycle(): void {
    clearInterval(this.interval);
    clearInterval(this.restartInterval);
  }

  start(): void {
    clearInterval(this.interval);
    let current = this.seconds;
    this.timer.set(current);
    this.progress.set(100);

    this.interval = setInterval(() => {
      if (this.paused) {
        clearInterval(this.interval);
        return;
      }
      current--;
      this.timer.set(current);
      const percentage = (current / this.seconds) * 100;
      this.progress.set(percentage);
      if (current <= 0) {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  getStrokeOffset(): number {
    return this.circumference - (this.progress() / 100) * this.circumference;
  }

  getCalledBalls(roomId: string): void {
    this.roomService.getCalledBalls(roomId).subscribe((balls: any[]) => {
      if (!balls) {
        this.lastThreeBalls = [];
        return;
      }

      this.lastThreeBalls = balls.slice(-3).reverse();
    });
  }

  getCurrentBall(roomId: string): void {
    this.roomService.getCurrentBall(roomId).subscribe((currentBall: any) => {
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