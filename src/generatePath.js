import crypto from 'node:crypto';

/** Gera uma rota aleatória e difícil de adivinhar (ex: /xK9mP2qR7nLs). */
export function generateWebhookPath() {
  const token = crypto.randomBytes(12).toString('base64url');
  return `/${token}`;
}

/** Garante que a rota começa com `/`. */
export function normalizeWebhookPath(path) {
  if (!path) return null;
  const trimmed = path.trim();
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
