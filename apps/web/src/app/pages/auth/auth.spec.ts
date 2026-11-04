import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Auth } from './auth';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('Existing-account Google linking', () => {
  const code = 'x'.repeat(43);
  const exchangeGoogle = vi.fn();
  const navigateByUrl = vi.fn().mockResolvedValue(true);
  let component: Auth;
  beforeEach(() => {
    exchangeGoogle.mockReset();
    navigateByUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: { exchangeGoogle } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new Auth());
    component.pendingGoogleCode.set(code);
  });
  it('requires a password before attempting to link', () => {
    component.onSubmit();
    expect(exchangeGoogle).not.toHaveBeenCalled();
  });
  it('submits password proof without requiring the empty email field', () => {
    exchangeGoogle.mockReturnValue(of({ access_token: 'access', expires_in: 900 }));
    component.form.controls.password.setValue('existing-password');
    component.onSubmit();
    expect(exchangeGoogle).toHaveBeenCalledWith(code, 'existing-password');
    expect(navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
    expect(component.pendingGoogleCode()).toBeNull();
  });
  it('keeps the pending code after rejected password proof', () => {
    exchangeGoogle.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.form.controls.password.setValue('wrong');
    component.onSubmit();
    expect(component.pendingGoogleCode()).toBe(code);
    expect(component.serverError()).toContain('existing account password');
  });
  it('clears expired codes and asks the user to restart Google', () => {
    exchangeGoogle.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    component.form.controls.password.setValue('password');
    component.onSubmit();
    expect(component.pendingGoogleCode()).toBeNull();
    expect(component.serverError()).toContain('start Google sign-in again');
  });
  it('allows switching back to normal password signin', () => {
    component.cancelGoogleLink();
    expect(component.pendingGoogleCode()).toBeNull();
  });
});

describe('OAuth popup cancellation and errors', () => {
  const exchangeGoogle = vi.fn();
  const navigateByUrl = vi.fn().mockResolvedValue(true);
  let component: Auth;
  let popup: { closed: boolean; close: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.useFakeTimers();
    exchangeGoogle.mockReset().mockReturnValue(of({ access_token: 'access', expires_in: 900 }));
    navigateByUrl.mockClear();
    popup = {
      closed: false,
      close: vi.fn(() => {
        popup.closed = true;
      }),
    };
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: { exchangeGoogle } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new Auth());
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  function message(data: object, origin = environment.backendOrigin, source: object = popup): void {
    const event = new MessageEvent('message', { origin, data });
    Object.defineProperty(event, 'source', { value: source });
    window.dispatchEvent(event);
  }
  it('restores the form when the browser blocks the popup', () => {
    vi.mocked(window.open).mockReturnValueOnce(null);
    component.signInWithGoogle();
    expect(component.isLoading()).toBe(false);
    expect(component.form.enabled).toBe(true);
    expect(component.serverError()).toBeTruthy();
    expect(exchangeGoogle).not.toHaveBeenCalled();
  });
  it('handles a trusted provider cancellation/error and cleans up timers/listeners', () => {
    const before = vi.getTimerCount();
    component.signInWithGoogle();
    message({ type: 'google-oauth-error' });
    expect(component.isLoading()).toBe(false);
    expect(component.form.enabled).toBe(true);
    expect(component.serverError()).toContain('cancelled or failed');
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(before);
    message({ type: 'google-oauth-success', code: 'x'.repeat(43) });
    expect(exchangeGoogle).not.toHaveBeenCalled();
  });
  it('ignores error messages from another origin or window', () => {
    component.signInWithGoogle();
    message({ type: 'google-oauth-error' }, 'https://attacker.invalid');
    message({ type: 'google-oauth-error' }, environment.backendOrigin, {});
    expect(component.isLoading()).toBe(true);
    expect(component.serverError()).toBeNull();
    message({ type: 'google-oauth-error' });
    expect(component.isLoading()).toBe(false);
  });
  it('reports a manually closed popup as cancellation', () => {
    component.signInWithGoogle();
    popup.closed = true;
    vi.advanceTimersByTime(1000);
    expect(component.isLoading()).toBe(false);
    expect(component.form.enabled).toBe(true);
    expect(component.serverError()).toContain('window was closed');
    expect(exchangeGoogle).not.toHaveBeenCalled();
  });
  it('accepts a queued success message during the popup-close grace period', () => {
    component.signInWithGoogle();
    popup.closed = true;
    vi.advanceTimersByTime(500);
    message({ type: 'google-oauth-success', code: 'x'.repeat(43) });
    vi.advanceTimersByTime(1000);
    expect(exchangeGoogle).toHaveBeenCalledWith('x'.repeat(43), undefined);
    expect(navigateByUrl).toHaveBeenCalledWith('/home', { replaceUrl: true });
    expect(component.serverError()).toBeNull();
  });
  it('closes an abandoned popup and restores the form after timeout', () => {
    component.signInWithGoogle();
    vi.advanceTimersByTime(120000);
    expect(component.isLoading()).toBe(false);
    expect(component.form.enabled).toBe(true);
    expect(component.serverError()).toBeTruthy();
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(exchangeGoogle).not.toHaveBeenCalled();
  });
  it('closes the popup and removes handlers when the signin page is destroyed', () => {
    component.signInWithGoogle();
    TestBed.resetTestingModule();
    expect(popup.close).toHaveBeenCalledTimes(1);
    message({ type: 'google-oauth-success', code: 'x'.repeat(43) });
    vi.advanceTimersByTime(120000);
    expect(exchangeGoogle).not.toHaveBeenCalled();
    expect(popup.close).toHaveBeenCalledTimes(1);
  });
});
