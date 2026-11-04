import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingPaymentCard } from './upcoming-payment-card';

describe('UpcomingPaymentCard', () => {
  let component: UpcomingPaymentCard;
  let fixture: ComponentFixture<UpcomingPaymentCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingPaymentCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingPaymentCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
