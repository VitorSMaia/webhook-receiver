import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifySignature } from '../src/verifySignature.js';

const secret = 'test-secret';
const body = Buffer.from('{"id":1}');

function sign(raw, key) {
  return crypto.createHmac('sha256', key).update(raw).digest('hex');
}

describe('verifySignature', () => {
  it('aceita assinatura HMAC válida', () => {
    const sig = sign(body, secret);
    expect(verifySignature(body, sig, secret)).toBe(true);
  });

  it('aceita prefixo sha256=', () => {
    const sig = 'sha256=' + sign(body, secret);
    expect(verifySignature(body, sig, secret)).toBe(true);
  });

  it('rejeita assinatura inválida', () => {
    expect(verifySignature(body, 'deadbeef', secret)).toBe(false);
  });

  it('rejeita quando header ou secret ausente', () => {
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, sign(body, secret), null)).toBe(false);
  });
});
