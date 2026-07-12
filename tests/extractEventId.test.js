import { describe, it, expect } from 'vitest';
import { extractEventId } from '../src/extractEventId.js';

describe('extractEventId', () => {
  it('extrai id do campo padrão', () => {
    expect(extractEventId({ id: 42, tipo: 'x' })).toBe('42');
  });

  it('extrai event_id e eventId', () => {
    expect(extractEventId({ event_id: 'abc' })).toBe('abc');
    expect(extractEventId({ eventId: 'xyz' })).toBe('xyz');
  });

  it('suporta caminho aninhado via EVENT_ID_FIELDS', () => {
    expect(extractEventId({ data: { id: 9 } }, 'data.id')).toBe('9');
  });

  it('retorna null sem ID reconhecível', () => {
    expect(extractEventId({ foo: 'bar' })).toBeNull();
    expect(extractEventId(null)).toBeNull();
  });
});
