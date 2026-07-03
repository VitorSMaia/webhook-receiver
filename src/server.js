import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { generateWebhookPath, normalizeWebhookPath } from './generatePath.js';
import { verifySignature } from './verifySignature.js';
import * as store from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const PUBLIC_URL = process.env.PUBLIC_URL?.replace(/\/$/, '');
// Nome do header onde o servidor de origem envia a assinatura.
const SIGNATURE_HEADER = process.env.SIGNATURE_HEADER || 'x-signature';
// Verificação de assinatura ligada por padrão (VERIFY_SIGNATURE=false desativa).
const VERIFY_SIGNATURE = process.env.VERIFY_SIGNATURE !== 'false';
// Se definido, é usado como link inicial da PRIMEIRA sessão criada (útil com
// ngrok/rota fixa). As demais sessões recebem rotas aleatórias.
const FIXED_INITIAL_PATH = normalizeWebhookPath(process.env.WEBHOOK_PATH);
let fixedPathUsed = false;

const SESSION_COOKIE = 'wr_session';

if (VERIFY_SIGNATURE && !WEBHOOK_SECRET) {
  console.error('❌ WEBHOOK_SECRET não definido. Copie .env.example para .env e preencha,');
  console.error('   ou defina VERIFY_SIGNATURE=false para desativar a verificação.');
  process.exit(1);
}

// Capturamos o corpo BRUTO (Buffer) porque a assinatura HMAC é calculada sobre
// os bytes exatos enviados. Parsear antes perderia a fidelidade byte-a-byte.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

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
function ensureSession(req, res) {
  const existing = readCookie(req, SESSION_COOKIE);
  if (existing && store.getSession(existing)) {
    store.touchSession(existing);
    return existing;
  }
  const id = crypto.randomBytes(16).toString('hex');
  store.createSession(id);
  store.addLink(id, initialPathForSession());
  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  return id;
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
app.get('/', (req, res) => {
  ensureSession(req, res);
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ---------------------------------------------------------------------------
// API do painel — sempre escopada à sessão do cookie
// ---------------------------------------------------------------------------
app.get('/api/state', (req, res) => {
  const sid = ensureSession(req, res);
  res.json({
    session: sid.slice(0, 8),
    verifySignature: VERIFY_SIGNATURE,
    signatureHeader: SIGNATURE_HEADER,
    secretConfigured: Boolean(WEBHOOK_SECRET),
    publicUrl: PUBLIC_URL || null,
    port: Number(PORT),
    links: store.listLinks(sid).map(buildUrls),
  });
});

app.get('/api/links', (req, res) => {
  const sid = ensureSession(req, res);
  res.json(store.listLinks(sid).map(buildUrls));
});

app.post('/api/links', (req, res) => {
  const sid = ensureSession(req, res);
  const newPath = store.createLink(sid);
  console.log(`➕ [${sid.slice(0, 8)}] Novo link: ${newPath}`);
  res.status(201).json(buildUrls(newPath));
});

app.delete('/api/links/:token', (req, res) => {
  const sid = ensureSession(req, res);
  const target = normalizeWebhookPath(req.params.token);
  const removed = store.removeLink(sid, target);
  res.json({ removed });
});

app.get('/api/webhooks', (req, res) => {
  const sid = ensureSession(req, res);
  res.json(store.listWebhooks(sid));
});

app.delete('/api/webhooks', (req, res) => {
  const sid = ensureSession(req, res);
  store.clearWebhooks(sid);
  res.json({ cleared: true });
});

// Healthcheck simples (não cria sessão).
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Demais arquivos estáticos do painel.
app.use(express.static(PUBLIC_DIR));

// ---------------------------------------------------------------------------
// Recebimento dos webhooks — roteado para a sessão dona da rota
// ---------------------------------------------------------------------------
function handleWebhook(req, res) {
  const reqPath = req.path;
  const ownerId = store.ownerOfPath(reqPath);

  // Só aceitamos POSTs em rotas que pertencem a alguma sessão.
  if (!ownerId) {
    return res.status(404).json({ error: 'rota não encontrada' });
  }

  // null = verificação desativada; true/false = resultado da checagem.
  let signatureValid = null;
  if (VERIFY_SIGNATURE) {
    const signature = req.get(SIGNATURE_HEADER);
    signatureValid = verifySignature(req.rawBody, signature, WEBHOOK_SECRET);
  }

  const responseStatus = signatureValid === false ? 401 : 200;
  const responseBody =
    signatureValid === false ? { error: 'assinatura inválida' } : { received: true };

  // Registramos na sessão DONA da rota — só ela verá este webhook no painel.
  store.recordWebhook(ownerId, {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    path: reqPath,
    originalUrl: req.originalUrl,
    method: req.method,
    ip: req.ip,
    query: req.query,
    contentType: req.get('content-type') || null,
    headers: req.headers,
    body: req.body ?? null,
    rawBody: req.rawBody ? req.rawBody.toString('utf8') : '',
    signatureValid,
    responseStatus,
    responseBody,
  });

  if (signatureValid === false) {
    console.warn(`⚠️  [${ownerId.slice(0, 8)}] Assinatura inválida de ${req.ip} em ${reqPath}`);
    return res.status(responseStatus).json(responseBody);
  }

  console.log(`✅ [${ownerId.slice(0, 8)}] Webhook recebido em ${reqPath}`);
  res.status(responseStatus).json(responseBody);
}

// Catch-all de POST: rotas /api/* já foram tratadas acima; o resto é webhook.
app.post('*', handleWebhook);

// Limpeza periódica de sessões ociosas.
setInterval(() => store.pruneSessions(), 1000 * 60 * 60).unref();

app.listen(PORT, () => {
  console.log(`🚀 Webhook receiver rodando em http://localhost:${PORT}`);
  console.log('');
  console.log(`   🖥️  Painel de administração: http://localhost:${PORT}/`);
  console.log('');
  console.log('   Cada sessão (navegador) é isolada: gera os próprios links e');
  console.log('   vê apenas os próprios webhooks. Abra o painel para começar.');
  console.log('');
  if (VERIFY_SIGNATURE) {
    console.log(`   Verificação de assinatura: ON (header: ${SIGNATURE_HEADER})`);
  } else {
    console.log('   Verificação de assinatura: DESATIVADA');
  }
  if (FIXED_INITIAL_PATH) {
    const { localUrl, publicUrl } = buildUrls(FIXED_INITIAL_PATH);
    console.log('');
    console.log('   WEBHOOK_PATH definido — será o link inicial da 1ª sessão:');
    console.log(`   POST ${publicUrl || localUrl}`);
  }
});
