import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomeView } from './welcome-view';

describe('WelcomeView', () => {
  let component: WelcomeView;
  let fixture: ComponentFixture<WelcomeView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeView],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
