import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlannedPayments } from './planned-payments';

describe('PlannedPayments', () => {
  let component: PlannedPayments;
  let fixture: ComponentFixture<PlannedPayments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlannedPayments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlannedPayments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
