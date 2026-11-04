import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { refreshTokenInterceptor } from '../interceptors/refresh-token.interceptor';

describe('Cookie session authentication', () => {
  let auth: AuthService;
  let http: HttpClient;
  let requests: HttpTestingController;
  const navigate = vi.fn().mockResolvedValue(true);
  beforeEach(() => {
    localStorage.setItem('access_token', 'legacy-access');
    localStorage.setItem('refresh_token', 'legacy-refresh');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshTokenInterceptor, authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: navigate } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    navigate.mockClear();
  });
  afterEach(() => requests.verify());

  function csrf() {
    const req = requests.expectOne('/api/auth/csrf');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ csrfToken: 'browser-bound-csrf' });
  }
  function reply(path: string, token = 'access-one') {
    const req = requests.expectOne('/api/auth/' + path);
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.get('X-CSRF-Token')).toBe('browser-bound-csrf');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ access_token: token, expires_in: 900 });
  }
  async function login() {
    const done = firstValueFrom(
      auth.signin({ email: 'person@example.invalid', password: 'password-for-unit-tests' })
    );
    csrf();
    reply('local/signin');
    await done;
  }

  it('removes legacy credentials and never persists new JWTs or refresh tokens', async () => {
    expect(auth.getToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    await login();
    expect(auth.getToken()).toBe('access-one');
    expect(auth.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
  it('sends password signup through the same-origin cookie/CSRF transport', async () => {
    const done = firstValueFrom(
      auth.signup({ email: 'person@example.invalid', password: 'password-for-unit-tests' })
    );
    csrf();
    reply('local/signup');
    await done;
    expect(auth.isAuthenticated()).toBe(true);
  });
  it('restores a session once before protected routing', async () => {
    const one = auth.restoreSession();
    const two = auth.restoreSession();
    csrf();
    reply('refresh');
    expect(await one).toBe(true);
    expect(await two).toBe(true);
    expect(await auth.restoreSession()).toBe(true);
    requests.expectNone('/api/auth/refresh');
  });
  it('treats a missing cookie session as signed out without refresh loops', async () => {
    const restored = auth.restoreSession();
    csrf();
    requests.expectOne('/api/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(await restored).toBe(false);
    expect(auth.isAuthenticated()).toBe(false);
    expect(await auth.restoreSession()).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
  it('shares one in-flight cookie rotation for multiple callers', async () => {
    const one = firstValueFrom(auth.refresh());
    const two = firstValueFrom(auth.refresh());
    csrf();
    reply('refresh');
    expect((await one).access_token).toBe('access-one');
    expect((await two).access_token).toBe('access-one');
  });
  it('refreshes concurrent 401s once and retries with the new bearer token', async () => {
    await login();
    const one = firstValueFrom(http.get('/api/accounts'));
    const two = firstValueFrom(http.get('/api/transactions'));
    const initial = requests.expectOne('/api/accounts');
    expect(initial.request.headers.get('Authorization')).toBe('Bearer access-one');
    initial.flush({}, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne('/api/transactions').flush({}, { status: 401, statusText: 'Unauthorized' });
    csrf();
    reply('refresh', 'access-two');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const retriedOne = requests.expectOne('/api/accounts');
    const retriedTwo = requests.expectOne('/api/transactions');
    expect(retriedOne.request.headers.get('Authorization')).toBe('Bearer access-two');
    expect(retriedTwo.request.headers.get('Authorization')).toBe('Bearer access-two');
    retriedOne.flush([]);
    retriedTwo.flush([]);
    expect(await one).toEqual([]);
    expect(await two).toEqual([]);
  });
  it('does not attach tokens or trigger refresh for another origin', async () => {
    await login();
    const done = firstValueFrom(http.get('https://attacker.invalid/api/accounts'));
    const req = requests.expectOne('https://attacker.invalid/api/accounts');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
    expect(await done).toEqual([]);
  });
  it('exchanges only a one-time Google code, not popup JWTs', async () => {
    const done = firstValueFrom(auth.exchangeGoogle('x'.repeat(43)));
    csrf();
    const req = requests.expectOne('/api/auth/google/exchange');
    expect(req.request.body).toEqual({ code: 'x'.repeat(43) });
    expect(req.request.headers.get('X-CSRF-Token')).toBe('browser-bound-csrf');
    req.flush({ access_token: 'google-access', expires_in: 900 });
    await done;
    expect(auth.getToken()).toBe('google-access');
  });
  it('logs out through cookie+CSRF and clears in-memory authentication', async () => {
    await login();
    const done = firstValueFrom(auth.logout());
    csrf();
    const req = requests.expectOne('/api/auth/logout');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('browser-bound-csrf');
    expect(req.request.withCredentials).toBe(true);
    req.flush(null, { status: 204, statusText: 'No Content' });
    await done;
    expect(auth.isAuthenticated()).toBe(false);
  });
  it('retains authenticated state if logout fails so revocation is not falsely reported', async () => {
    await login();
    const done = firstValueFrom(auth.logout()).catch(() => undefined);
    csrf();
    requests.expectOne('/api/auth/logout').flush({}, { status: 503, statusText: 'Unavailable' });
    await done;
    expect(auth.isAuthenticated()).toBe(true);
  });
  it('revokes owned sessions using access authentication and CSRF', async () => {
    await login();
    const done = firstValueFrom(
      auth.revokeSession({
        id: 'session-id',
        current: true,
        createdAt: '',
        lastUsedAt: '',
        expiresAt: '',
        userAgent: null,
      })
    );
    csrf();
    const req = requests.expectOne('/api/auth/sessions/session-id');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-one');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('browser-bound-csrf');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await done;
    expect(auth.isAuthenticated()).toBe(false);
  });
  it('includes password proof only when explicitly linking an existing Google account', async () => {
    const done = firstValueFrom(auth.exchangeGoogle('x'.repeat(43), 'existing-password'));
    csrf();
    const req = requests.expectOne('/api/auth/google/exchange');
    expect(req.request.body).toEqual({ code: 'x'.repeat(43), password: 'existing-password' });
    req.flush({ access_token: 'linked-access', expires_in: 900 });
    await done;
    expect(auth.isAuthenticated()).toBe(true);
  });
});
