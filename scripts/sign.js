import 'dotenv/config';
import crypto from 'node:crypto';
import { normalizeWebhookPath } from '../src/generatePath.js';

/**
 * Utilitário para testar localmente: gera um payload assinado e imprime
 * um comando curl pronto para disparar contra o seu endpoint.
 *
 * Uso:
 *   npm run sign '{"evento":"pedido.criado","id":123}'
 *   npm run sign '{"evento":"teste"}' /xK9mP2qR7nLs
 *
 * A rota é exibida ao iniciar o servidor ou em GET http://localhost:3000/
 */
const secret = process.env.WEBHOOK_SECRET;
const header = process.env.SIGNATURE_HEADER || 'x-signature';
const port = process.env.PORT || 3000;
const webhookPath =
  normalizeWebhookPath(process.argv[3]) ||
  normalizeWebhookPath(process.env.WEBHOOK_PATH);

if (!secret) {
  console.error('WEBHOOK_SECRET não definido no .env');
  process.exit(1);
}

if (!webhookPath) {
  console.error('Rota do webhook não definida.');
  console.error('Defina WEBHOOK_PATH no .env ou passe a rota como 2º argumento:');
  console.error('  npm run sign \'{"evento":"teste"}\' /sua-rota-aleatoria');
  console.error('');
  console.error('A rota atual aparece ao iniciar o servidor ou em GET http://localhost:' + port + '/');
  process.exit(1);
}

const payload = process.argv[2] || '{"evento":"teste","id":1}';
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log('Payload:  ', payload);
console.log('Assinatura:', signature);
console.log('Rota:     ', webhookPath);
console.log('\nComando curl para testar:\n');
console.log(
  `curl -X POST http://localhost:${port}${webhookPath} \\\n` +
    `  -H "Content-Type: application/json" \\\n` +
    `  -H "${header}: ${signature}" \\\n` +
    `  -d '${payload}'`
);
