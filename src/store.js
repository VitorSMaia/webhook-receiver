import { generateWebhookPath } from './generatePath.js';

// Armazenamento EM MEMÓRIA particionado por SESSÃO. Cada sessão (um navegador,
// identificado por cookie) funciona como um "usuário" isolado: vê apenas os
// próprios links e webhooks. Tudo some ao reiniciar o servidor — intencional,
// pois esta ferramenta é voltada a desenvolvimento/inspeção.
const MAX_WEBHOOKS = 200;
// Sessões ociosas por mais tempo que isto são descartadas.
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

// sessionId -> { links: Set<path>, webhooks: [], createdAt, lastSeen }
const sessions = new Map();
// path -> sessionId (índice reverso para achar o dono de uma rota rapidamente)
const pathOwner = new Map();

/** Cria uma sessão vazia. */
export function createSession(sessionId) {
  sessions.set(sessionId, {
    links: new Set(),
    webhooks: [],
    createdAt: Date.now(),
    lastSeen: Date.now(),
  });
  return sessionId;
}

/** Retorna a sessão (ou undefined). */
export function getSession(sessionId) {
  return sessions.get(sessionId);
}

/** Marca a sessão como ativa agora. */
export function touchSession(sessionId) {
  const s = sessions.get(sessionId);
  if (s) s.lastSeen = Date.now();
}

/** Registra uma rota específica para uma sessão. */
export function addLink(sessionId, path) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  s.links.add(path);
  pathOwner.set(path, sessionId);
  return path;
}

/** Cria e registra uma nova rota aleatória para a sessão. */
export function createLink(sessionId) {
  return addLink(sessionId, generateWebhookPath());
}

/** Remove uma rota da sessão. Retorna true se existia e pertencia a ela. */
export function removeLink(sessionId, path) {
  const s = sessions.get(sessionId);
  if (!s || !s.links.has(path)) return false;
  s.links.delete(path);
  pathOwner.delete(path);
  return true;
}

/** Lista as rotas ativas da sessão. */
export function listLinks(sessionId) {
  return [...(sessions.get(sessionId)?.links ?? [])];
}

/** Retorna o id da sessão dona de uma rota (ou undefined). */
export function ownerOfPath(path) {
  return pathOwner.get(path);
}

/** Guarda um webhook recebido na sessão dona, mantendo só os mais recentes. */
export function recordWebhook(sessionId, entry) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  s.webhooks.unshift(entry);
  if (s.webhooks.length > MAX_WEBHOOKS) s.webhooks.length = MAX_WEBHOOKS;
  return entry;
}

/** Lista os webhooks da sessão (mais recente primeiro). */
export function listWebhooks(sessionId) {
  return sessions.get(sessionId)?.webhooks ?? [];
}

/** Limpa os webhooks recebidos da sessão. */
export function clearWebhooks(sessionId) {
  const s = sessions.get(sessionId);
  if (s) s.webhooks.length = 0;
}

/** Remove sessões ociosas e libera as rotas associadas. */
export function pruneSessions(now = Date.now()) {
  for (const [id, s] of sessions) {
    if (now - s.lastSeen > SESSION_TTL_MS) {
      for (const path of s.links) pathOwner.delete(path);
      sessions.delete(id);
    }
  }
}
