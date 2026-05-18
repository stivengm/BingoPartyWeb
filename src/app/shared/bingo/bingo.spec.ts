import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bingo } from './bingo';

describe('Bingo', () => {
  let component: Bingo;
  let fixture: ComponentFixture<Bingo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bingo],
    }).compileComponents();

    fixture = TestBed.createComponent(Bingo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
