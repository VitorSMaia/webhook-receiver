import { describe, it, expect } from 'vitest';
import { sanitizeHeaders } from '../src/sanitizeHeaders.js';

describe('sanitizeHeaders', () => {
  it('mascara headers sensíveis', () => {
    const out = sanitizeHeaders({
      host: 'localhost',
      authorization: 'Bearer secret-token',
      cookie: 'session=abc',
      'x-signature': 'deadbeef',
    });
    expect(out.host).toBe('localhost');
    expect(out.authorization).toBe('[REDACTED]');
    expect(out.cookie).toBe('[REDACTED]');
    expect(out['x-signature']).toBe('deadbeef');
  });
});
