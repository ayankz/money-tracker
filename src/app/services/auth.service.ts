import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { BaseHttp } from './base-http/base-http';

const TOKEN_KEY = 'access_token';

export interface AuthDto {
  name?: string;
  email: string;
  password: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(BaseHttp);
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly isAuthenticated = computed(() => !!this._token());

  signup(dto: AuthDto): Observable<Tokens> {
    return this.http.post<Tokens>('/api/auth/local/signup', dto).pipe(
      tap((tokens) => this.setTokens(tokens))
    );
  }

  signin(dto: AuthDto): Observable<Tokens> {
    return this.http.post<Tokens>('/api/auth/local/signin', dto).pipe(
      tap((tokens) => this.setTokens(tokens))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => this.clearTokens())
    );
  }

  refresh(): Observable<Tokens> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<Tokens>(
      '/api/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    ).pipe(
      tap((tokens) => this.setTokens(tokens))
    );
  }

  saveTokens(tokens: Tokens): void {
    this.setTokens(tokens);
  }

  clearSession(): void {
    this.clearTokens();
  }

  private setTokens({ access_token, refresh_token }: Tokens): void {
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    this._token.set(access_token);
  }

  private clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._token.set(null);
  }

  getToken(): string | null {
    return this._token();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
}
