process.env.WEBHOOK_SECRET = 'test-secret';

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const { default: app } = await import('../src/app.js');

describe('API com verificação de assinatura', () => {
  let agent;
  let webhookPath;

  beforeAll(async () => {
    agent = request.agent(app);
    const stateRes = await agent.get('/api/state').expect(200);
    webhookPath = stateRes.body.links[0]?.path;
    expect(webhookPath).toBeTruthy();
  });

  it('retorna 401 com assinatura inválida', async () => {
    await agent
      .post(webhookPath)
      .set('Content-Type', 'application/json')
      .set('x-signature', 'deadbeef')
      .send({ id: 1 })
      .expect(401);

    const hooks = await agent.get('/api/webhooks').expect(200);
    const last = hooks.body[0];
    expect(last.signatureValid).toBe(false);
    expect(last.responseStatus).toBe(401);
  });
});
