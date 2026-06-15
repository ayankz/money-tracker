import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialOverview } from './financial-overview';

describe('FinancialOverview', () => {
  let component: FinancialOverview;
  let fixture: ComponentFixture<FinancialOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialOverview);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('weeklyEarnings', 2450);
    fixture.componentRef.setInput('monthlyEarnings', 9800);
    fixture.componentRef.setInput('weeklySpending', 1120.5);
    fixture.componentRef.setInput('monthlySpending', 4250);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
