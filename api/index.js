// Entrypoint serverless da Vercel. A app Express (sem app.listen) é exportada
// como handler; a Vercel a invoca a cada requisição. Todo o roteamento (painel,
// API e webhooks) é resolvido internamente pelo Express.
import app from '../src/app.js';

export default app;
