import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceCard } from './balance-card';

describe('BalanceCard', () => {
  let component: BalanceCard;
  let fixture: ComponentFixture<BalanceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
