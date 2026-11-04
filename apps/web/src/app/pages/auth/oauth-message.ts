export function googleCode(
  event: MessageEvent<unknown>,
  popup: Window,
  backendOrigin: string
): string | null {
  if (
    event.source !== popup ||
    event.origin !== backendOrigin ||
    !event.data ||
    typeof event.data !== 'object'
  )
    return null;
  const data = event.data as Record<string, unknown>;
  return data['type'] === 'google-oauth-success' &&
    typeof data['code'] === 'string' &&
    /^[A-Za-z0-9_-]{43}$/.test(data['code'])
    ? data['code']
    : null;
}

export function googleError(
  event: MessageEvent<unknown>,
  popup: Window,
  backendOrigin: string
): boolean {
  if (
    event.source !== popup ||
    event.origin !== backendOrigin ||
    !event.data ||
    typeof event.data !== 'object'
  )
    return false;
  return (event.data as Record<string, unknown>)['type'] === 'google-oauth-error';
}
