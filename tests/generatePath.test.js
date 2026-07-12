import { describe, it, expect } from 'vitest';
import { generateWebhookPath, normalizeWebhookPath } from '../src/generatePath.js';

describe('generatePath', () => {
  it('gera rota com barra inicial', () => {
    const p = generateWebhookPath();
    expect(p.startsWith('/')).toBe(true);
    expect(p.length).toBeGreaterThan(2);
  });

  it('normaliza rota sem barra', () => {
    expect(normalizeWebhookPath('abc')).toBe('/abc');
    expect(normalizeWebhookPath('/abc')).toBe('/abc');
    expect(normalizeWebhookPath(null)).toBeNull();
  });
});
