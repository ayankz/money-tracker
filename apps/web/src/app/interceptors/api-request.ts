import { environment } from '../../environments/environment';

export function isApiRequest(url: string): boolean {
  const request = new URL(url, window.location.origin);
  return (
    (request.origin === window.location.origin || request.origin === environment.backendOrigin) &&
    request.pathname.startsWith('/api/')
  );
}
