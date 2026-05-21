import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyGameResults } from './verify-game-results';

describe('VerifyGameResults', () => {
  let component: VerifyGameResults;
  let fixture: ComponentFixture<VerifyGameResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyGameResults],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyGameResults);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
