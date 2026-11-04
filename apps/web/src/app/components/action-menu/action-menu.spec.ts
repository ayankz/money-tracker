import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionMenu } from './action-menu';

describe('ActionMenu', () => {
  let component: ActionMenu;
  let fixture: ComponentFixture<ActionMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});