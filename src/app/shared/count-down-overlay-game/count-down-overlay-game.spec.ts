import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountDownOverlayGame } from './count-down-overlay-game';

describe('CountDownOverlayGame', () => {
  let component: CountDownOverlayGame;
  let fixture: ComponentFixture<CountDownOverlayGame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountDownOverlayGame],
    }).compileComponents();

    fixture = TestBed.createComponent(CountDownOverlayGame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
