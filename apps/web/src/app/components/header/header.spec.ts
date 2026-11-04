import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let locationSpy: Pick<Location, 'back' | 'getState'>;
  let routerSpy: Pick<Router, 'navigate'>;

  beforeEach(async () => {
    locationSpy = {
      back: vi.fn(),
      getState: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: Location, useValue: locationSpy },
        { provide: Router, useValue: routerSpy },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use browser back when navigation history exists', () => {
    vi.mocked(locationSpy.getState).mockReturnValue({ navigationId: 2 });

    (component as never as { goBack: () => void }).goBack();

    expect(locationSpy.back).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to fallback route when page was opened directly', () => {
    vi.mocked(locationSpy.getState).mockReturnValue({ navigationId: 1 });

    (component as never as { goBack: () => void }).goBack();

    expect(locationSpy.back).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });
});
