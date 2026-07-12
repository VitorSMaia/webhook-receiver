# Webhook Receiver

Servidor Node.js + Express para receber webhooks do seu servidor, com verificação de assinatura **HMAC-SHA256**.

📖 **Documentação completa:** [DOCUMENTACAO.md](./DOCUMENTACAO.md)

## Como funciona a segurança

O servidor de origem calcula `HMAC-SHA256(corpo_da_requisição, WEBHOOK_SECRET)` e envia o resultado num header (por padrão `x-signature`). Este projeto recalcula a assinatura sobre o **corpo bruto** recebido e compara em tempo constante. Se não bater, responde `401`.

Isso garante que:
- O webhook veio de quem tem o segredo (autenticidade).
- O corpo não foi alterado no caminho (integridade).

## Setup

```bash
cd webhook-receiver
npm install
cp .env.example .env      # no Windows/PowerShell: copy .env.example .env
```

Edite o `.env` e defina um `WEBHOOK_SECRET` forte (o mesmo configurado no seu servidor). Para gerar um:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajuste `SIGNATURE_HEADER` para o nome do header que o **seu** servidor usa.

### Desativar a verificação de assinatura

Para aceitar webhooks sem verificar a assinatura (dev, ou provedores que não assinam), defina no `.env`:

```
VERIFY_SIGNATURE=false
```

Com isso o `WEBHOOK_SECRET` deixa de ser obrigatório e o endpoint aceita qualquer POST. ⚠️ Não use em produção exposta à internet sem outra camada de proteção.

## Rodar

```bash
npm run dev     # com auto-reload
# ou
npm start
```

Servidor sobe em `http://localhost:3000` com uma **rota aleatória única** (ex: `/xK9mP2qR7nLs`):

```bash
npm run dev
# Copie a URL exibida no terminal, ex:
# POST http://localhost:3000/xK9mP2qR7nLs
```

- `GET /` — **painel de administração**: explica o projeto, gera novos links aleatórios e mostra os webhooks recebidos em tempo real. Cada navegador tem uma **sessão isolada** (cookie `wr_session`): só vê os próprios links e webhooks
- `POST /<rota-aleatória>` — recebe os eventos
- `GET /api/state` — configuração + links ativos em JSON
- `POST /api/links` — gera um novo link aleatório
- `GET /api/webhooks` — lista os webhooks recebidos em JSON
- `GET /health` — healthcheck

Abra `http://localhost:3000/` no navegador para usar o painel. Para fixar a mesma rota inicial entre reinícios, defina `WEBHOOK_PATH` no `.env`.

## Testar localmente

Gere um payload assinado e um comando curl prontos (use a rota exibida ao iniciar o servidor):

```bash
npm run sign '{"evento":"pedido.criado","id":123}' /xK9mP2qR7nLs
```

Copie o `curl` impresso e rode em outro terminal — deve retornar `{"received":true}`.

## Expor para a internet

Seu servidor precisa alcançar essa máquina. Em desenvolvimento, use um túnel:

```bash
npx localtunnel --port 3000
# ou ngrok http 3000
```

Defina `PUBLIC_URL` no `.env` com a URL do túnel (sem barra no final) para ver a URL completa ao iniciar:

```
PUBLIC_URL=https://seu-subdominio.ngrok-free.dev
```

Aponte a URL do túnel + a rota aleatória (ex: `https://.../xK9mP2qR7nLs`) na configuração de webhooks do seu servidor.

## Próximos passos

- Implementar sua lógica em `src/onWebhook.js` (ver [DOCUMENTACAO.md](./DOCUMENTACAO.md#personalizar-a-lógica-de-negócio)).
- Responder `2xx` rápido e processar o trabalho pesado de forma assíncrona (fila) para evitar retries por timeout.
- Eventos duplicados (mesmo `id` no payload) já são ignorados automaticamente — veja `EVENT_ID_FIELDS` no `.env.example`.
