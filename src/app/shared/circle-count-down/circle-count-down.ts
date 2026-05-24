import { Component, Input, OnInit, signal, SimpleChanges } from '@angular/core';
import { DataAppService } from '../../core/services/data-app.service';
import { RoomService } from '../../core/services/room.service';
import { RoomModel } from '../../core/models/room.model';

@Component({
  selector: 'app-circle-count-down',
  imports: [],
  templateUrl: './circle-count-down.html',
  styleUrl: './circle-count-down.scss',
})
export class CircleCountDown implements OnInit {

  @Input() seconds: number = 10;
  isViewInfoBall = false;

  // Cambia este valor para reiniciar
  @Input() trigger: number = 0;

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

  ngOnInit() {
    this.dataApp.getRoom().subscribe((room) => {
      if (room != null) {
        this.room = room;
        this.getCalledBalls(this.room.id);
        this.getCurrentBall(this.room.id);
        return;
      }

      let romStorage = this.dataApp.getStorage('room') as RoomModel;

      if (romStorage === null) {
        // TODO: Enviar al welcome porque no existe Room
        return;
      };
      
      this.room = romStorage;
      this.dataApp.setRoom(romStorage);
    });
    
    this.dataApp.getIsViewInitialGame().subscribe((value) => {
      this.isViewInfoBall = !value;

      if (this.isViewInfoBall) {
        this.start();

        setInterval(() => {
          this.start();
        }, (this.seconds + 0.5) * 1000);
      }
    });
  }

  start(): void {
    clearInterval(this.interval);
    let current = this.seconds;
    this.timer.set(current);
    this.progress.set(100);

    this.interval = setInterval(() => {
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

  getCalledBalls(roomId: string) {
    this.roomService.getCalledBalls(roomId).subscribe((balls: any[]) => {
      if (!balls) {
        this.lastThreeBalls = [];
        return;
      }
      
      this.lastThreeBalls = balls.slice(-3).reverse();
      console.log(this.lastThreeBalls);
    });
  }

  getCurrentBall(roomId: string) {
    this.roomService.getCurrentBall(roomId).subscribe((isChangeCurrentBall: any) => {
      this.currentBall = {
        letter: isChangeCurrentBall.letter,
        number: isChangeCurrentBall.number
      }
    });
  }

}
