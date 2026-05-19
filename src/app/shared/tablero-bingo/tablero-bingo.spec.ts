import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableroBingo } from './tablero-bingo';

describe('TableroBingo', () => {
  let component: TableroBingo;
  let fixture: ComponentFixture<TableroBingo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableroBingo],
    }).compileComponents();

    fixture = TestBed.createComponent(TableroBingo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
