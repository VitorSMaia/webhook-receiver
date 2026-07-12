process.env.WEBHOOK_SECRET = '';

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const { default: app } = await import('../src/app.js');

describe('Segurança da API', () => {
  let agent;
  let csrfToken;

  beforeAll(async () => {
    agent = request.agent(app);
    const stateRes = await agent.get('/api/state').expect(200);
    csrfToken = stateRes.body.csrfToken;
  });

  it('rejeita DELETE /api/webhooks sem CSRF', async () => {
    await agent.delete('/api/webhooks').expect(403);
  });

  it('rejeita POST /api/links sem CSRF', async () => {
    await agent.post('/api/links').expect(403);
  });

  it('aceita mutação com CSRF válido', async () => {
    await agent
      .delete('/api/webhooks')
      .set('X-CSRF-Token', csrfToken)
      .expect(200);
  });

  it('expõe headers de segurança via helmet', async () => {
    const res = await agent.get('/').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeTruthy();
  });

  it('redige authorization em webhooks gravados', async () => {
    const state = await agent.get('/api/state').expect(200);
    const path = state.body.links[0].path;

    await agent
      .post(path)
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer top-secret')
      .send({ id: 'sec-header-test', ok: true })
      .expect(200);

    const hooks = await agent.get('/api/webhooks').expect(200);
    expect(hooks.body[0].headers.authorization).toBe('[REDACTED]');
  });
});
