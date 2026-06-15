import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpErrorResponse,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { catchError, from, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService, type Tokens } from '../services/auth.service';

let refreshRequest$: Observable<Tokens> | null = null;

function shouldSkipRefresh(req: HttpRequest<unknown>): boolean {
  return (
    !req.url.startsWith('/api') ||
    req.url.includes('/api/auth/local/signin') ||
    req.url.includes('/api/auth/local/signup') ||
    req.url.includes('/api/auth/refresh')
  );
}

function runRefresh(authService: AuthService): Observable<Tokens> {
  if (!refreshRequest$) {
    refreshRequest$ = authService.refresh().pipe(shareReplay(1));
    refreshRequest$.subscribe({
      next: () => {
        refreshRequest$ = null;
      },
      error: () => {
        refreshRequest$ = null;
      },
    });
  }

  return refreshRequest$;
}

export const refreshTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (shouldSkipRefresh(req)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (!authService.getRefreshToken()) {
        authService.clearSession();
        void router.navigateByUrl('/auth');
        return throwError(() => error);
      }

      return runRefresh(authService).pipe(
        switchMap(() => next(req)),
        catchError((refreshError) => {
          authService.clearSession();
          return from(router.navigateByUrl('/auth')).pipe(
            switchMap(() => throwError(() => refreshError))
          );
        })
      );
    })
  );
};
