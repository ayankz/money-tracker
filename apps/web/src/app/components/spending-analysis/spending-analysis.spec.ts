import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpendingAnalysis } from './spending-analysis';

describe('SpendingAnalysis', () => {
  let component: SpendingAnalysis;
  let fixture: ComponentFixture<SpendingAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpendingAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
