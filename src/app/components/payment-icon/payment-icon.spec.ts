import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentIcon } from './payment-icon';

describe('PaymentIcon', () => {
  let component: PaymentIcon;
  let fixture: ComponentFixture<PaymentIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
