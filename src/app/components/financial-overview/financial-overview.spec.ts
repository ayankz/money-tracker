import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FinancialOverview } from './financial-overview';

describe('FinancialOverview', () => {
  let component: FinancialOverview;
  let fixture: ComponentFixture<FinancialOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialOverview],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
