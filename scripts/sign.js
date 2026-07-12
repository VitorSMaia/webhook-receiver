#!/usr/bin/env node
/**
 * Gera assinatura HMAC-SHA256 e um comando curl pronto para testar webhooks.
 *
 * Uso:
 *   npm run sign '{"evento":"pedido.criado","id":123}' /xK9mP2qR7nLs
 *   npm run sign '{"evento":"pedido.criado","id":123}'
 *
 * Lê WEBHOOK_SECRET, SIGNATURE_HEADER, PORT e WEBHOOK_PATH do .env (via dotenv).
 */
import 'dotenv/config';
import crypto from 'node:crypto';

const [, , payloadArg, routeArg] = process.argv;

if (!payloadArg) {
  console.error('Uso: npm run sign \'<json>\' [rota]');
  console.error('Ex.: npm run sign \'{"evento":"pedido.criado","id":123}\' /xK9mP2qR7nLs');
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(payloadArg);
} catch {
  console.error('Payload inválido: informe JSON válido entre aspas simples.');
  process.exit(1);
}

const secret = process.env.WEBHOOK_SECRET;
if (!secret) {
  console.error('WEBHOOK_SECRET não definido no .env');
  process.exit(1);
}

const headerName = process.env.SIGNATURE_HEADER || 'x-signature';
const port = process.env.PORT || 3000;
const path = routeArg || process.env.WEBHOOK_PATH || '/webhook';

const body = JSON.stringify(payload);
const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
const url = `http://localhost:${port}${path}`;

console.log('Payload:');
console.log(body);
console.log('');
console.log(`Assinatura (${headerName}):`);
console.log(signature);
console.log('');
console.log('curl (copie e cole em outro terminal):');
console.log(
  `curl -s -X POST "${url}" -H "Content-Type: application/json" -H "${headerName}: ${signature}" -d '${body}'`
);
