import { describe, it, expect } from '@jest/globals';
import { parseCookies, GUEST_SESSION_COOKIE } from '../utils/guestSession.js';

describe('guestSession', () => {
  it('parseCookies handles empty and malformed input', () => {
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });

  it('parseCookies decodes values and splits multiple cookies', () => {
    const raw = `foo=bar; ${GUEST_SESSION_COOKIE}=${encodeURIComponent('550e8400-e29b-41d4-a716-446655440000')}; baz=1`;
    const parsed = parseCookies(raw);
    expect(parsed.foo).toBe('bar');
    expect(parsed[GUEST_SESSION_COOKIE]).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(parsed.baz).toBe('1');
  });
});
