process.env.VERIFY_SIGNATURE = 'false';
process.env.WEBHOOK_SECRET = 'test-secret';

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const { default: app } = await import('../src/app.js');

describe('API de integração', () => {
  let agent;
  let webhookPath;
  let csrfToken;

  beforeAll(async () => {
    agent = request.agent(app);
    const stateRes = await agent.get('/api/state').expect(200);
    webhookPath = stateRes.body.links[0]?.path;
    csrfToken = stateRes.body.csrfToken;
    expect(webhookPath).toBeTruthy();
    expect(csrfToken).toBeTruthy();
  });

  function withCsrf(req) {
    return req.set('X-CSRF-Token', csrfToken);
  }

  it('GET /api/state retorna sessão e storage', async () => {
    const res = await agent.get('/api/state').expect(200);
    expect(res.body.session).toMatch(/^[a-f0-9]{8}$/);
    expect(res.body.csrfToken).toMatch(/^[a-f0-9]{64}$/);
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

  it('reenvio do mesmo evento é idempotente', async () => {
    await withCsrf(agent.delete('/api/webhooks')).expect(200);
    const payload = { id: 'evt-duplicate-test', evento: 'idempotencia' };

    await agent.post(webhookPath).set('Content-Type', 'application/json').send(payload).expect(200);
    const first = await agent.get('/api/webhooks').expect(200);
    expect(first.body[0].duplicate).toBeFalsy();

    const dupRes = await agent
      .post(webhookPath)
      .set('Content-Type', 'application/json')
      .send(payload)
      .expect(200);
    expect(dupRes.body).toEqual({ received: true, duplicate: true });

    const hooks = await agent.get('/api/webhooks').expect(200);
    expect(hooks.body).toHaveLength(2);
    expect(hooks.body[0].duplicate).toBe(true);
    expect(hooks.body[0].eventId).toBe('evt-duplicate-test');
    expect(hooks.body[1].duplicate).toBeFalsy();
  });

  it('POST em rota desconhecida retorna 404', async () => {
    await agent.post('/rota-inexistente-xyz').send({}).expect(404);
  });

  it('GET /css/app.css e /js/app.js retornam 200', async () => {
    await agent.get('/css/app.css').expect(200);
    await agent.get('/js/app.js').expect(200);
  });
});
