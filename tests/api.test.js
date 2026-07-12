process.env.VERIFY_SIGNATURE = 'false';
process.env.WEBHOOK_SECRET = 'test-secret';

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const { default: app } = await import('../src/app.js');

describe('API de integração', () => {
  let agent;
  let webhookPath;

  beforeAll(async () => {
    agent = request.agent(app);
    const stateRes = await agent.get('/api/state').expect(200);
    webhookPath = stateRes.body.links[0]?.path;
    expect(webhookPath).toBeTruthy();
  });

  it('GET /api/state retorna sessão e storage', async () => {
    const res = await agent.get('/api/state').expect(200);
    expect(res.body.session).toMatch(/^[a-f0-9]{8}$/);
    expect(['memory', 'redis']).toContain(res.body.storage);
  });

  it('POST webhook grava evento na sessão', async () => {
    await agent
      .post(webhookPath)
      .set('Content-Type', 'application/json')
      .send({ evento: 'teste' })
      .expect(200);

    const hooks = await agent.get('/api/webhooks').expect(200);
    expect(hooks.body.length).toBeGreaterThan(0);
    expect(hooks.body[0].path).toBe(webhookPath);
  });

  it('POST em rota desconhecida retorna 404', async () => {
    await agent.post('/rota-inexistente-xyz').send({}).expect(404);
  });

  it('GET /css/app.css e /js/app.js retornam 200', async () => {
    await agent.get('/css/app.css').expect(200);
    await agent.get('/js/app.js').expect(200);
  });
});
