import app, { appConfig as config } from './app.js';
import * as store from './store.js';

// Bootstrap para desenvolvimento local / hosts com processo persistente
// (Render, Railway, Fly.io, VPS...). Em serverless (Vercel) o entrypoint é
// api/index.js, que apenas exporta o app — sem app.listen.

// Limpeza periódica de sessões ociosas (só relevante no backend em memória;
// no Redis o TTL cuida disso).
setInterval(() => store.pruneSessions().catch(() => {}), 1000 * 60 * 60).unref();

app.listen(config.PORT, () => {
  const { PORT, VERIFY_SIGNATURE, SIGNATURE_HEADER, FIXED_INITIAL_PATH, PUBLIC_URL, usingRedis } = config;

  console.log(`🚀 Webhook receiver rodando em http://localhost:${PORT}`);
  console.log('');
  console.log(`   🖥️  Painel de administração: http://localhost:${PORT}/`);
  console.log('');
  console.log('   Cada sessão (navegador) é isolada: gera os próprios links e');
  console.log('   vê apenas os próprios webhooks. Abra o painel para começar.');
  console.log('');
  console.log(`   Armazenamento: ${usingRedis ? 'Redis (Upstash)' : 'memória (volátil)'}`);
  if (VERIFY_SIGNATURE) {
    console.log(`   Verificação de assinatura: ON (header: ${SIGNATURE_HEADER})`);
  } else {
    console.log('   Verificação de assinatura: DESATIVADA');
  }
  if (FIXED_INITIAL_PATH) {
    const url = PUBLIC_URL ? `${PUBLIC_URL}${FIXED_INITIAL_PATH}` : `http://localhost:${PORT}${FIXED_INITIAL_PATH}`;
    console.log('');
    console.log('   WEBHOOK_PATH definido — será o link inicial da 1ª sessão:');
    console.log(`   POST ${url}`);
  }
});
