import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircleCountDown } from './circle-count-down';

describe('CircleCountDown', () => {
  let component: CircleCountDown;
  let fixture: ComponentFixture<CircleCountDown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircleCountDown],
    }).compileComponents();

    fixture = TestBed.createComponent(CircleCountDown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
