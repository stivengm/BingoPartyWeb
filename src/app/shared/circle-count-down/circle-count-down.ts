import { Component, Input, signal, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-circle-count-down',
  imports: [],
  templateUrl: './circle-count-down.html',
  styleUrl: './circle-count-down.scss',
})
export class CircleCountDown {

  @Input() seconds: number = 10;

  // Cambia este valor para reiniciar
  @Input() trigger: number = 0;

  progress = signal(100);

  timer = signal(0);

  interval!: ReturnType<typeof setInterval>;

  radius = 54;
  circumference = 2 * Math.PI * this.radius;

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['trigger']) {
      this.start();
    }

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

}
