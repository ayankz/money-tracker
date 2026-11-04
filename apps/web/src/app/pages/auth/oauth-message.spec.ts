import { googleCode, googleError } from './oauth-message';

describe('Google popup messages', () => {
  const popup = {} as Window;
  const origin = 'https://api.example.invalid';
  const code = 'x'.repeat(43);
  function event(overrides: Partial<MessageEvent<unknown>> = {}) {
    return {
      source: popup,
      origin,
      data: { type: 'google-oauth-success', code },
      ...overrides,
    } as MessageEvent<unknown>;
  }
  it('accepts a one-time code only from the opened popup on the exact API origin', () => {
    expect(googleCode(event(), popup, origin)).toBe(code);
  });
  it('rejects a foreign origin', () => {
    expect(googleCode(event({ origin: 'https://attacker.invalid' }), popup, origin)).toBeNull();
  });
  it('rejects another window on the API origin', () => {
    expect(googleCode(event({ source: {} as Window }), popup, origin)).toBeNull();
  });
  it.each([
    null,
    {},
    { type: 'unrelated', code },
    { type: 'google-oauth-success', code: 'short' },
    { type: 'google-oauth-success', tokens: { access_token: 'old', refresh_token: 'old' } },
  ])('rejects malformed or legacy token messages', (data) => {
    expect(googleCode(event({ data }), popup, origin)).toBeNull();
  });
  it('accepts a generic OAuth failure only from the trusted popup', () => {
    expect(googleError(event({ data: { type: 'google-oauth-error' } }), popup, origin)).toBe(true);
  });
  it('ignores error signals from a foreign origin or another window', () => {
    expect(
      googleError(
        event({ origin: 'https://attacker.invalid', data: { type: 'google-oauth-error' } }),
        popup,
        origin
      )
    ).toBe(false);
    expect(
      googleError(
        event({ source: {} as Window, data: { type: 'google-oauth-error' } }),
        popup,
        origin
      )
    ).toBe(false);
  });
});
