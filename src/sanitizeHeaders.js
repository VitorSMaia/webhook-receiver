const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'proxy-authorization',
  'x-csrf-token',
]);

const REDACTED = '[REDACTED]';

/** Remove ou mascara headers sensíveis antes de persistir/exibir webhooks. */
export function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      out[key] = REDACTED;
    } else {
      out[key] = value;
    }
  }
  return out;
}
