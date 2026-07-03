import { Redis } from '@upstash/redis';
import { generateWebhookPath } from './generatePath.js';

// Store particionado por SESSÃO. Cada sessão (um navegador, identificado por
// cookie) é um "usuário" isolado: vê apenas os próprios links e webhooks.
//
// Dois backends com a MESMA API assíncrona:
//  - Redis (Upstash) quando as variáveis de ambiente estão definidas
//    (obrigatório em serverless/Vercel, onde a memória não é compartilhada).
//  - Memória, como fallback para desenvolvimento local sem Redis.
const MAX_WEBHOOKS = 200;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = REDIS_URL && REDIS_TOKEN ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

/** Indica se o backend ativo é o Redis (senão, memória). */
export const usingRedis = Boolean(redis);

// ---- chaves Redis ----
const kSess = (id) => `wr:sess:${id}`;
const kLinks = (id) => `wr:sess:${id}:links`;
const kHooks = (id) => `wr:sess:${id}:hooks`;
const kOwner = (path) => `wr:owner:${path}`;

// ---- backend em memória ----
const sessions = new Map(); // id -> { links:Set, webhooks:[], lastSeen }
const pathOwner = new Map(); // path -> sessionId

/** Cria uma sessão vazia. */
export async function createSession(id) {
  if (redis) {
    await redis.set(kSess(id), Date.now(), { ex: TTL_SECONDS });
    return id;
  }
  sessions.set(id, { links: new Set(), webhooks: [], lastSeen: Date.now() });
  return id;
}

/** Retorna a sessão (valor truthy) ou null. */
export async function getSession(id) {
  if (redis) return (await redis.get(kSess(id))) ?? null;
  return sessions.get(id) || null;
}

/** Renova o TTL / marca a sessão como ativa. */
export async function touchSession(id) {
  if (redis) {
    await Promise.all([
      redis.expire(kSess(id), TTL_SECONDS),
      redis.expire(kLinks(id), TTL_SECONDS),
      redis.expire(kHooks(id), TTL_SECONDS),
    ]);
    return;
  }
  const s = sessions.get(id);
  if (s) s.lastSeen = Date.now();
}

/** Registra uma rota específica para uma sessão. */
export async function addLink(id, path) {
  if (redis) {
    await Promise.all([
      redis.sadd(kLinks(id), path),
      redis.set(kOwner(path), id, { ex: TTL_SECONDS }),
      redis.expire(kLinks(id), TTL_SECONDS),
    ]);
    return path;
  }
  const s = sessions.get(id);
  if (!s) return null;
  s.links.add(path);
  pathOwner.set(path, id);
  return path;
}

/** Cria e registra uma nova rota aleatória para a sessão. */
export async function createLink(id) {
  return addLink(id, generateWebhookPath());
}

/** Remove uma rota da sessão. Retorna true se existia e pertencia a ela. */
export async function removeLink(id, path) {
  if (redis) {
    const isMember = await redis.sismember(kLinks(id), path);
    if (!isMember) return false;
    await Promise.all([redis.srem(kLinks(id), path), redis.del(kOwner(path))]);
    return true;
  }
  const s = sessions.get(id);
  if (!s || !s.links.has(path)) return false;
  s.links.delete(path);
  pathOwner.delete(path);
  return true;
}

/** Lista as rotas ativas da sessão. */
export async function listLinks(id) {
  if (redis) return (await redis.smembers(kLinks(id))) || [];
  return [...(sessions.get(id)?.links ?? [])];
}

/** Retorna o id da sessão dona de uma rota (ou null). */
export async function ownerOfPath(path) {
  if (redis) return (await redis.get(kOwner(path))) ?? null;
  return pathOwner.get(path) ?? null;
}

/** Guarda um webhook recebido na sessão dona, mantendo só os mais recentes. */
export async function recordWebhook(id, entry) {
  if (redis) {
    await redis.lpush(kHooks(id), entry);
    await redis.ltrim(kHooks(id), 0, MAX_WEBHOOKS - 1);
    await redis.expire(kHooks(id), TTL_SECONDS);
    return entry;
  }
  const s = sessions.get(id);
  if (!s) return null;
  s.webhooks.unshift(entry);
  if (s.webhooks.length > MAX_WEBHOOKS) s.webhooks.length = MAX_WEBHOOKS;
  return entry;
}

/** Lista os webhooks da sessão (mais recente primeiro). */
export async function listWebhooks(id) {
  if (redis) {
    const arr = (await redis.lrange(kHooks(id), 0, -1)) || [];
    return arr.map((x) => (typeof x === 'string' ? JSON.parse(x) : x));
  }
  return sessions.get(id)?.webhooks ?? [];
}

/** Limpa os webhooks recebidos da sessão. */
export async function clearWebhooks(id) {
  if (redis) {
    await redis.del(kHooks(id));
    return;
  }
  const s = sessions.get(id);
  if (s) s.webhooks.length = 0;
}

/** Remove sessões ociosas (no Redis o TTL já cuida disso). */
export async function pruneSessions(now = Date.now()) {
  if (redis) return;
  for (const [id, s] of sessions) {
    if (now - s.lastSeen > TTL_SECONDS * 1000) {
      for (const path of s.links) pathOwner.delete(path);
      sessions.delete(id);
    }
  }
}
