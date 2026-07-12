import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { generateWebhookPath, normalizeWebhookPath } from './generatePath.js';
import { verifySignature } from './verifySignature.js';
import { extractEventId } from './extractEventId.js';
import { onWebhookReceived } from './onWebhook.js';
import { sanitizeHeaders } from './sanitizeHeaders.js';
import * as store from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const PUBLIC_URL = process.env.PUBLIC_URL?.replace(/\/$/, '');
// Nome do header onde o servidor de origem envia a assinatura.
const SIGNATURE_HEADER = process.env.SIGNATURE_HEADER || 'x-signature';
// Verificação automática quando WEBHOOK_SECRET está definido.
const VERIFY_SIGNATURE = Boolean(WEBHOOK_SECRET);
// Se definido, é usado como link inicial da PRIMEIRA sessão criada (útil com
// ngrok/rota fixa). As demais sessões recebem rotas aleatórias.
const FIXED_INITIAL_PATH = normalizeWebhookPath(process.env.WEBHOOK_PATH);
let fixedPathUsed = false;

const SESSION_COOKIE = 'wr_session';
const BODY_LIMIT = process.env.BODY_LIMIT || '1mb';
const WEBHOOK_RATE_LIMIT = Number(process.env.WEBHOOK_RATE_LIMIT || 60);
const API_RATE_LIMIT = Number(process.env.API_RATE_LIMIT || 30);
const IS_PRODUCTION =
  process.env.VERCEL_ENV === 'production' ||
  (process.env.NODE_ENV === 'production' && !process.env.VERCEL);
const IS_HTTPS = Boolean(PUBLIC_URL?.startsWith('https://'));
const SECURE_COOKIE = IS_PRODUCTION || IS_HTTPS;
const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || IS_PRODUCTION;

if (TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: WEBHOOK_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'limite de requisições excedido' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: API_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'limite de requisições excedido' },
});

// Config exposta para o bootstrap local (logs de inicialização).
// NÃO renomeie para `config`: na Vercel esse é um export reservado que o
// builder tenta avaliar estaticamente (só aceita literais) e falha com
// "Unhandled type: CallExpression" ao ver Boolean(...) / store.usingRedis.
export const appConfig = {
  PORT,
  PUBLIC_URL,
  SIGNATURE_HEADER,
  VERIFY_SIGNATURE,
  FIXED_INITIAL_PATH,
  secretConfigured: Boolean(WEBHOOK_SECRET),
  usingRedis: store.usingRedis,
};

// Capturamos o corpo BRUTO (Buffer) porque a assinatura HMAC é calculada sobre
// os bytes exatos enviados. Parsear antes perderia a fidelidade byte-a-byte.
app.use(
  express.json({
    limit: BODY_LIMIT,
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

/** Envolve um handler assíncrono capturando erros (Express 4 não faz isso). */
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error('Erro no handler:', err);
    if (!res.headersSent) res.status(500).json({ error: 'erro interno' });
  });

/** Lê um cookie do cabeçalho da requisição (sem dependência externa). */
function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    const key = part.slice(0, idx).trim();
    if (key === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/** Rota inicial para uma sessão recém-criada. */
function initialPathForSession() {
  if (FIXED_INITIAL_PATH && !fixedPathUsed) {
    fixedPathUsed = true;
    return FIXED_INITIAL_PATH;
  }
  return generateWebhookPath();
}

/**
 * Garante uma sessão para a requisição do painel/API. Se não houver cookie
 * válido, cria uma nova sessão (com um link inicial) e envia o cookie.
 * Cada sessão é isolada: só enxerga os próprios links e webhooks.
 */
async function ensureSession(req, res) {
  const existing = readCookie(req, SESSION_COOKIE);
  if (existing && (await store.getSession(existing))) {
    await store.touchSession(existing);
    return existing;
  }
  const id = crypto.randomBytes(16).toString('hex');
  await store.createSession(id);
  await store.addLink(id, initialPathForSession());
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'strict',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  return id;
}

/** Rejeita mutações da API sem token CSRF válido. */
async function assertCsrf(req, res, sessionId) {
  const token = req.get('X-CSRF-Token');
  if (!(await store.validateCsrf(sessionId, token))) {
    res.status(403).json({ error: 'token CSRF inválido' });
    return false;
  }
  return true;
}

/** Monta as URLs (local e pública) de uma rota de webhook. */
function buildUrls(webhookPath) {
  return {
    path: webhookPath,
    localUrl: `http://localhost:${PORT}${webhookPath}`,
    publicUrl: PUBLIC_URL ? `${PUBLIC_URL}${webhookPath}` : null,
  };
}

// ---------------------------------------------------------------------------
// Painel (define o cookie de sessão já no carregamento da página)
// ---------------------------------------------------------------------------
app.get(
  '/',
  wrap(async (req, res) => {
    await ensureSession(req, res);
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  })
);

// ---------------------------------------------------------------------------
// API do painel — sempre escopada à sessão do cookie
// ---------------------------------------------------------------------------
app.use('/api', apiLimiter);

app.get(
  '/api/state',
  wrap(async (req, res) => {
    const sid = await ensureSession(req, res);
    const links = await store.listLinks(sid);
    res.json({
      session: sid.slice(0, 8),
      csrfToken: await store.getCsrfToken(sid),
      verifySignature: VERIFY_SIGNATURE,
      signatureHeader: SIGNATURE_HEADER,
      secretConfigured: Boolean(WEBHOOK_SECRET),
      publicUrl: PUBLIC_URL || null,
      port: Number(PORT),
      storage: store.usingRedis ? 'redis' : 'memory',
      links: links.map(buildUrls),
    });
  })
);

app.get(
  '/api/links',
  wrap(async (req, res) => {
    const sid = await ensureSession(req, res);
    const links = await store.listLinks(sid);
    res.json(links.map(buildUrls));
  })
);

app.post(
  '/api/links',
  wrap(async (req, res) => {
    const sid = await ensureSession(req, res);
    if (!(await assertCsrf(req, res, sid))) return;
    const newPath = await store.createLink(sid);
    console.log(`➕ [${sid.slice(0, 8)}] Novo link: ${newPath}`);
    res.status(201).json(buildUrls(newPath));
  })
);

app.delete(
  '/api/links/:token',
  wrap(async (req, res) => {
    const sid = await ensureSession(req, res);
    if (!(await assertCsrf(req, res, sid))) return;
    const target = normalizeWebhookPath(req.params.token);
    const removed = await store.removeLink(sid, target);
    res.json({ removed });
  })
);

app.get(
  '/api/webhooks',
  wrap(async (req, res) => {
    const sid = await ensureSession(req, res);
    res.json(await store.listWebhooks(sid));
  })
);

app.delete(
  '/api/webhooks',
  wrap(async (req, res) => {
    const sid = await ensureSession(req, res);
    if (!(await assertCsrf(req, res, sid))) return;
    await store.clearWebhooks(sid);
    res.json({ cleared: true });
  })
);

// SSE — notifica o painel quando um webhook é gravado na sessão.
app.get(
  '/api/events/stream',
  wrap(async (req, res) => {
    const sid = await ensureSession(req, res);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(': connected\n\n');
    store.subscribeSessionEvents(sid, res);
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);
    req.on('close', () => {
      clearInterval(heartbeat);
      store.unsubscribeSessionEvents(sid, res);
    });
  })
);

// Healthcheck simples (não cria sessão).
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), storage: store.usingRedis ? 'redis' : 'memory' });
});

// Demais arquivos estáticos do painel.
app.use(express.static(PUBLIC_DIR));

// ---------------------------------------------------------------------------
// Recebimento dos webhooks — roteado para a sessão dona da rota
// ---------------------------------------------------------------------------
async function handleWebhook(req, res) {
  const reqPath = req.path;
  const ownerId = await store.ownerOfPath(reqPath);

  // Só aceitamos POSTs em rotas que pertencem a alguma sessão.
  if (!ownerId) {
    return res.status(404).json({ error: 'rota não encontrada' });
  }

  // null = verificação desativada; true/false = resultado da checagem.
  let signatureValid = null;
  if (WEBHOOK_SECRET) {
    const signature = req.get(SIGNATURE_HEADER);
    signatureValid = verifySignature(req.rawBody, signature, WEBHOOK_SECRET);
  }

  if (signatureValid === false) {
    const responseBody = { error: 'assinatura inválida' };
    await store.recordWebhook(ownerId, {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      path: reqPath,
      originalUrl: req.originalUrl,
      method: req.method,
      ip: req.ip,
      query: req.query,
      contentType: req.get('content-type') || null,
      headers: sanitizeHeaders(req.headers),
      body: req.body ?? null,
      rawBody: req.rawBody ? req.rawBody.toString('utf8') : '',
      signatureValid,
      responseStatus: 401,
      responseBody,
    });
    console.warn(`⚠️  [${ownerId.slice(0, 8)}] Assinatura inválida de ${req.ip} em ${reqPath}`);
    return res.status(401).json(responseBody);
  }

  const eventId = extractEventId(req.body);
  const duplicate = await store.isDuplicateEvent(ownerId, eventId);
  const responseBody = duplicate ? { received: true, duplicate: true } : { received: true };

  if (!duplicate) {
    await store.rememberEventId(ownerId, eventId);
    await onWebhookReceived({
      sessionId: ownerId,
      event: req.body ?? null,
      req,
      eventId,
      duplicate: false,
    });
  }

  await store.recordWebhook(ownerId, {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    path: reqPath,
    originalUrl: req.originalUrl,
    method: req.method,
    ip: req.ip,
    query: req.query,
    contentType: req.get('content-type') || null,
    headers: sanitizeHeaders(req.headers),
    body: req.body ?? null,
    rawBody: req.rawBody ? req.rawBody.toString('utf8') : '',
    eventId,
    duplicate,
    signatureValid,
    responseStatus: 200,
    responseBody,
  });

  if (duplicate) {
    console.log(`↩️  [${ownerId.slice(0, 8)}] Evento duplicado (${eventId}) em ${reqPath}`);
  } else {
    console.log(`✅ [${ownerId.slice(0, 8)}] Webhook recebido em ${reqPath}`);
  }

  res.status(200).json(responseBody);
}

// Catch-all de POST: rotas /api/* já foram tratadas acima; o resto é webhook.
app.post('*', webhookLimiter, wrap(handleWebhook));

export default app;
