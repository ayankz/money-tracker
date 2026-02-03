import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  observe?: 'body';
  responseType?: 'json';
}

@Injectable({
  providedIn: 'root',
})
export class BaseHttp {
  protected http = inject(HttpClient);
  protected baseUrl = '';

  get<T>(url: string, options?: HttpOptions): Observable<T> {
    return this.http.get<T>(this.getFullUrl(url), options);
  }

  post<T>(url: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.post<T>(this.getFullUrl(url), body, options);
  }

  put<T>(url: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.put<T>(this.getFullUrl(url), body, options);
  }

  patch<T>(url: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http.patch<T>(this.getFullUrl(url), body, options);
  }

  delete<T>(url: string, options?: HttpOptions): Observable<T> {
    return this.http.delete<T>(this.getFullUrl(url), options);
  }

  private getFullUrl(url: string): string {
    return this.baseUrl ? `${this.baseUrl}${url}` : url;
  }
}
