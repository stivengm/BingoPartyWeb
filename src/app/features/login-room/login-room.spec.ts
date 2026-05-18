import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginRoom } from './login-room';

describe('LoginRoom', () => {
  let component: LoginRoom;
  let fixture: ComponentFixture<LoginRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginRoom],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginRoom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
