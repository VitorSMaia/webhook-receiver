/**
 * Extrai o ID de evento do corpo do webhook para idempotência.
 * Campos consultados (em ordem) vêm de EVENT_ID_FIELDS no .env
 * (padrão: id, event_id, eventId) ou caminhos com ponto (ex.: data.id).
 */
export function extractEventId(body, fieldsCsv = process.env.EVENT_ID_FIELDS) {
  if (!body || typeof body !== 'object') return null;

  const fields = (fieldsCsv || 'id,event_id,eventId')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const field of fields) {
    const value = field.includes('.') ? getNested(body, field) : body[field];
    if (value != null && value !== '') return String(value);
  }
  return null;
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}
