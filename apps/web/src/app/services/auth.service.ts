import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Observable,
  catchError,
  defer,
  finalize,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

export interface AuthDto {
  name?: string;
  email: string;
  password: string;
}
export interface Tokens {
  access_token: string;
  expires_in: number;
}
export interface AuthSession {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  userAgent: string | null;
  current: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly raw = new HttpClient(inject(HttpBackend));
  private readonly http = inject(HttpClient);
  private readonly token = signal<string | null>(null);
  private refreshing: Observable<Tokens> | null = null;
  private restorePromise: Promise<boolean> | null = null;
  private initialized = false;
  readonly isAuthenticated = computed(() => !!this.token());

  constructor() {
    // Remove legacy bearer credentials once; new credentials never enter storage.
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch {
      /* Storage can be disabled. */
    }
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.raw.get<{ csrfToken: string }>('/api/auth/csrf', { withCredentials: true }).pipe(
      switchMap(({ csrfToken }) =>
        this.raw.post<T>(`/api/auth/${path}`, body, {
          withCredentials: true,
          headers: { 'X-CSRF-Token': csrfToken },
        })
      )
    );
  }

  private exclusive<T>(work: () => Promise<T>): Observable<T> {
    return defer(async (): Promise<T> => {
      if (typeof navigator !== 'undefined' && navigator.locks)
        return await navigator.locks.request('money-tracker-auth', work);
      return await work();
    });
  }

  private accept(tokens: Tokens): void {
    this.token.set(tokens.access_token);
    this.initialized = true;
  }

  signup(dto: AuthDto): Observable<Tokens> {
    return this.exclusive(() => firstValueFrom(this.post<Tokens>('local/signup', dto))).pipe(
      tap((tokens) => this.accept(tokens))
    );
  }
  signin(dto: AuthDto): Observable<Tokens> {
    return this.exclusive(() => firstValueFrom(this.post<Tokens>('local/signin', dto))).pipe(
      tap((tokens) => this.accept(tokens))
    );
  }
  exchangeGoogle(code: string, password?: string): Observable<Tokens> {
    return this.exclusive(() =>
      firstValueFrom(
        this.post<Tokens>('google/exchange', { code, ...(password ? { password } : {}) })
      )
    ).pipe(tap((tokens) => this.accept(tokens)));
  }
  logout(): Observable<void> {
    return this.exclusive(() => firstValueFrom(this.post<void>('logout', {}))).pipe(
      tap(() => this.clearSession())
    );
  }

  refresh(): Observable<Tokens> {
    if (!this.refreshing) {
      this.refreshing = this.exclusive(() => firstValueFrom(this.post<Tokens>('refresh', {}))).pipe(
        tap((tokens) => this.accept(tokens)),
        catchError((error: unknown) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshing = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.refreshing;
  }

  restoreSession(): Promise<boolean> {
    if (this.initialized) return Promise.resolve(this.isAuthenticated());
    this.restorePromise ??= firstValueFrom(this.refresh())
      .then(
        () => true,
        () => false
      )
      .finally(() => {
        this.initialized = true;
      });
    return this.restorePromise;
  }

  me(): Observable<{ id: number; email: string }> {
    return this.http.get<{ id: number; email: string }>('/api/auth/me');
  }
  sessions(): Observable<AuthSession[]> {
    return this.http.get<AuthSession[]>('/api/auth/sessions');
  }

  private csrfHeaders(): Observable<HttpHeaders> {
    return this.raw
      .get<{ csrfToken: string }>('/api/auth/csrf', { withCredentials: true })
      .pipe(map(({ csrfToken }) => new HttpHeaders({ 'X-CSRF-Token': csrfToken })));
  }
  revokeSession(session: AuthSession): Observable<void> {
    return this.csrfHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`/api/auth/sessions/${encodeURIComponent(session.id)}`, {
          headers,
          withCredentials: true,
        })
      ),
      tap(() => {
        if (session.current) this.clearSession();
      })
    );
  }
  logoutAll(): Observable<void> {
    return this.csrfHeaders().pipe(
      switchMap((headers) =>
        this.http.post<void>('/api/auth/logout-all', {}, { headers, withCredentials: true })
      ),
      tap(() => this.clearSession())
    );
  }
  clearSession(): void {
    this.token.set(null);
    this.initialized = true;
  }
  getToken(): string | null {
    return this.token();
  }
}
