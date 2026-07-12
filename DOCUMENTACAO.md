# Documentação — Webhook Receiver

Guia completo para instalar, configurar, testar e expor o **Webhook Receiver**: um servidor Node.js + Express que recebe webhooks com verificação opcional de assinatura **HMAC-SHA256**.

---

## Índice

1. [O que é esta ferramenta](#o-que-é-esta-ferramenta)
2. [Requisitos](#requisitos)
3. [Instalação](#instalação)
4. [Configuração](#configuração)
5. [Executar o servidor](#executar-o-servidor)
6. [Endpoints disponíveis](#endpoints-disponíveis)
7. [Testar localmente](#testar-localmente)
8. [Expor para a internet (ngrok)](#expor-para-a-internet-ngrok)
9. [Como ver as requisições recebidas](#como-ver-as-requisições-recebidas)
10. [Como funciona a verificação de assinatura](#como-funciona-a-verificação-de-assinatura)
11. [Integrar com o seu servidor de origem](#integrar-com-o-seu-servidor-de-origem)
12. [Personalizar a lógica de negócio](#personalizar-a-lógica-de-negócio)
13. [Solução de problemas](#solução-de-problemas)
14. [Boas práticas em produção](#boas-práticas-em-produção)

---

## O que é esta ferramenta

O Webhook Receiver é um servidor HTTP leve que:

- Gera uma **rota aleatória única** ao iniciar (ex: `POST /xK9mP2qR7nLs`) para receber eventos.
- Oferece um **painel de administração** em `GET /` para explicar o projeto, **gerar novos links aleatórios** em tempo de execução e **visualizar os webhooks recebidos** (corpo, headers, IP e status da assinatura).
- **Isola por sessão**: cada navegador vira um "usuário" com cookie próprio (`wr_session`), enxergando apenas os próprios links e webhooks — o que aparece para um não aparece para o outro.
- Valida (opcionalmente) que cada requisição foi assinada com um segredo compartilhado.
- Registra o payload recebido no terminal e em memória para inspeção em desenvolvimento.
- Responde rapidamente com `200` para confirmar o recebimento.

É ideal para desenvolvimento local, testes de integração e como ponto de partida antes de conectar a filas, bancos de dados ou outras APIs.

---

## Requisitos

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js   | 18 ou superior |
| npm       | Incluído com o Node |

Opcional, para expor localmente na internet:

- [ngrok](https://ngrok.com/) ou [localtunnel](https://localtunnel.github.io/www/)

---

## Instalação

Clone ou acesse o diretório do projeto e instale as dependências:

```bash
cd webhook-receiver
npm install
```

Copie o arquivo de exemplo de variáveis de ambiente:

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
copy .env.example .env
```

---

## Configuração

Todas as configurações ficam no arquivo `.env`. Use o `.env.example` como referência.

### Variáveis disponíveis

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta em que o servidor sobe |
| `WEBHOOK_PATH` | *(gerada automaticamente)* | Rota fixa para o webhook (ex: `/minha-rota`). Se omitida, uma rota aleatória é criada a cada inicialização |
| `PUBLIC_URL` | — | URL pública do túnel (ngrok), sem barra no final. Exibe a URL completa do webhook ao iniciar |
| `WEBHOOK_SECRET` | — | Segredo compartilhado com o servidor que envia os webhooks. Se omitido, webhooks são aceitos sem verificação HMAC |
| `SIGNATURE_HEADER` | `x-signature` | Nome do header HTTP onde a assinatura é enviada |

### Rota aleatória do webhook

Ao iniciar sem `WEBHOOK_PATH` no `.env`, o servidor gera uma rota difícil de adivinhar, por exemplo:

```
POST http://localhost:3000/xK9mP2qR7nLs
```

Essa URL é exibida no terminal e também em `GET http://localhost:3000/`.

Para manter a **mesma rota** entre reinícios (útil com ngrok ou testes repetidos):

```env
WEBHOOK_PATH=/xK9mP2qR7nLs
```

### Gerar um segredo forte

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o valor gerado para `WEBHOOK_SECRET` no `.env`. O **mesmo valor** deve estar configurado no servidor que dispara os webhooks.

### Exemplo de `.env` (com verificação ativa)

```env
PORT=3000
WEBHOOK_SECRET=a1b2c3d4e5f6...seu_segredo_aqui
SIGNATURE_HEADER=x-signature
```

### Exemplo de `.env` (sem verificação — apenas dev)

Omita `WEBHOOK_SECRET` ou deixe vazio:

```env
PORT=3000
```

> **Atenção:** sem `WEBHOOK_SECRET`, qualquer pessoa que souber a URL pode enviar POSTs. Use somente em ambiente local ou com outra camada de proteção (firewall, VPN, etc.).

### Ajustar o header de assinatura

Se o seu provedor usa outro nome de header, altere `SIGNATURE_HEADER`. Exemplos comuns:

| Provedor / padrão | Header típico |
|-------------------|---------------|
| Este projeto (padrão) | `x-signature` |
| GitHub | `x-hub-signature-256` |
| Outros | `x-webhook-signature` |

O valor do header pode ser o hash em hex puro ou com prefixo, por exemplo `sha256=abc123...` — o receptor remove o prefixo automaticamente.

---

## Executar o servidor

### Modo desenvolvimento (com auto-reload)

```bash
npm run dev
```

O Node reinicia automaticamente quando você altera arquivos em `src/`.

### Modo produção

```bash
npm start
```

### Saída esperada no terminal

```
🚀 Webhook receiver rodando em http://localhost:3000

   🖥️  Painel de administração: http://localhost:3000/

   URL do webhook (use esta rota no serviço de origem):
   POST http://localhost:3000/xK9mP2qR7nLs
   POST https://seu-subdominio.ngrok-free.dev/xK9mP2qR7nLs   # se PUBLIC_URL estiver definida

   Verificação de assinatura: ON (header: x-signature)
   Gere novos links e veja os webhooks recebidos no painel.
```

Abra o **painel de administração** em `http://localhost:3000/` para acompanhar tudo pela interface. Se a verificação estiver desativada, o painel e o terminal indicam que a assinatura não é verificada.

---

## Endpoints disponíveis

### `POST /<rota-aleatória>`

Rota única gerada ao iniciar (ou fixada via `WEBHOOK_PATH`). Recebe o corpo JSON do evento.

**Com `WEBHOOK_SECRET` definido:**

| Situação | Status | Resposta |
|----------|--------|----------|
| Assinatura válida | `200` | `{"received":true}` |
| Assinatura ausente ou inválida | `401` | `{"error":"assinatura inválida"}` |

**Com verificação desativada:**

| Situação | Status | Resposta |
|----------|--------|----------|
| Qualquer POST com JSON | `200` | `{"received":true}` |

### `GET /`

Serve o **painel de administração** (HTML). Nele você vê a explicação do projeto, os links ativos, um botão para gerar novos links aleatórios e a lista de webhooks recebidos em tempo real.

Para obter os mesmos dados em JSON (útil para scripts), use `GET /api/state`.

### `GET /api/state`

Retorna a configuração atual e os links ativos.

**Resposta `200`:**

```json
{
  "verifySignature": true,
  "signatureHeader": "x-signature",
  "secretConfigured": true,
  "publicUrl": "https://seu-subdominio.ngrok-free.dev",
  "port": 3000,
  "links": [
    {
      "path": "/xK9mP2qR7nLs",
      "localUrl": "http://localhost:3000/xK9mP2qR7nLs",
      "publicUrl": "https://seu-subdominio.ngrok-free.dev/xK9mP2qR7nLs"
    }
  ]
}
```

### `GET /api/links`

Lista as rotas de webhook ativas (mesmo formato do campo `links` acima).

### `POST /api/links`

Gera uma **nova rota aleatória** e a registra. Passa a aceitar POSTs imediatamente.

**Resposta `201`:**

```json
{
  "path": "/NX_MyHEJd-ZsP45j",
  "localUrl": "http://localhost:3000/NX_MyHEJd-ZsP45j",
  "publicUrl": null
}
```

### `DELETE /api/links/:token`

Remove uma rota (o `:token` é a rota sem a barra inicial, ex: `NX_MyHEJd-ZsP45j`). POSTs para ela deixam de ser aceitos.

### `GET /api/webhooks`

Retorna os webhooks recebidos (mais recente primeiro), incluindo inválidos. Cada item traz `id`, `receivedAt`, `path`, `method`, `ip`, `headers`, `body`, `rawBody` e `signatureValid` (`true`/`false`/`null` quando a verificação está desativada).

### `DELETE /api/webhooks`

Limpa o histórico de webhooks recebidos.

### `GET /health`

Healthcheck para monitoramento ou load balancers.

**Resposta `200`:**

```json
{
  "status": "ok",
  "uptime": 123.456
}
```

---

## Testar localmente

### Opção 1 — Script `npm run sign` (recomendado)

Com o servidor rodando e `WEBHOOK_SECRET` definido no `.env`, use a rota exibida no terminal ou em `GET /`:

```bash
npm run sign '{"evento":"pedido.criado","id":123}' /xK9mP2qR7nLs
```

Ou defina `WEBHOOK_PATH=/xK9mP2qR7nLs` no `.env` e rode apenas:

```bash
npm run sign '{"evento":"pedido.criado","id":123}'
```

O script imprime:

- O payload
- A assinatura HMAC calculada
- Um comando `curl` pronto para copiar e colar

Execute o `curl` em **outro terminal**. A resposta esperada é:

```json
{"received":true}
```

No terminal do servidor, você verá algo como:

```
✅ Webhook recebido: {
  "evento": "pedido.criado",
  "id": 123
}
```

### Opção 2 — curl manual

1. Calcule `HMAC-SHA256(corpo_json, WEBHOOK_SECRET)` em hex.
2. Envie o POST:

```bash
curl -X POST http://localhost:3000/xK9mP2qR7nLs \
  -H "Content-Type: application/json" \
  -H "x-signature: SUA_ASSINATURA_HEX" \
  -d '{"evento":"teste","id":1}'
```

### Opção 3 — Sem assinatura (dev)

Remova ou omita `WEBHOOK_SECRET` no `.env`, reinicie o servidor e envie:

```bash
curl -X POST http://localhost:3000/xK9mP2qR7nLs \
  -H "Content-Type: application/json" \
  -d '{"evento":"teste","id":1}'
```

---

## Expor para a internet (ngrok)

Para que um serviço externo (Stripe, seu backend em nuvem, etc.) alcance sua máquina local, use um túnel HTTP.

### 1. Suba o servidor

```bash
npm run dev
```

### 2. Inicie o ngrok na mesma porta

```bash
ngrok http 3000
```

Ou, se tiver um domínio reservado no ngrok:

```bash
ngrok http --url=seu-subdominio.ngrok-free.dev 3000
```

### 3. Configure a URL do webhook no serviço de origem

Copie a URL exibida ao iniciar o servidor. Com ngrok e `PUBLIC_URL` no `.env`:

```env
PUBLIC_URL=https://seu-subdominio.ngrok-free.dev
```

A URL completa será algo como:

```
https://seu-subdominio.ngrok-free.dev/xK9mP2qR7nLs
```

> Use a **rota aleatória** exibida no terminal — cada inicialização gera uma nova, a menos que `WEBHOOK_PATH` esteja definido no `.env`.

### Alternativa: localtunnel

```bash
npx localtunnel --port 3000
```

O comando exibirá uma URL temporária. Adicione a rota do webhook ao final (ex: `https://....loca.lt/xK9mP2qR7nLs`).

---

## Como ver as requisições recebidas

### Painel de administração (recomendado)

Abra `http://localhost:3000/` no navegador. O painel:

- Explica o projeto e mostra o estado da verificação de assinatura.
- Lista os **links ativos**, com botão para **copiar** e para **gerar um novo link aleatório**.
- Exibe os **webhooks recebidos** em tempo real (atualização automática a cada 2s), com corpo, headers, IP de origem, horário e um selo indicando se a assinatura era válida, inválida ou não verificada.
- Permite **limpar** o histórico.

> Os dados ficam em memória: reiniciar o servidor apaga os links gerados e o histórico.

### Isolamento por sessão

Cada navegador que abre o painel recebe um cookie de sessão (`wr_session`, `HttpOnly`, `SameSite=Lax`) e passa a funcionar como um **usuário independente**:

- Os **links** gerados pertencem à sessão que os criou.
- Os **webhooks** recebidos são gravados na sessão **dona da rota** e só aparecem para ela.
- Abrir em outro navegador, outro dispositivo ou uma aba anônima cria uma **nova sessão** com histórico limpo.
- Um webhook enviado ao link da sessão A **nunca** aparece para a sessão B.

O identificador curto da sessão aparece na sidebar do painel e em **Settings**. As sessões ficam em memória (somem ao reiniciar) e são descartadas após 7 dias de inatividade. Se `WEBHOOK_PATH` estiver definido no `.env`, ele é usado como link inicial apenas da **primeira** sessão criada.

### Terminal do servidor

Cada webhook aceito é logado:

```
✅ Webhook recebido: { ... payload JSON ... }
```

Requisições com assinatura inválida:

```
⚠️  Assinatura inválida de ::1
```

### Painel do ngrok (recomendado em dev)

Com o ngrok rodando, abra no navegador:

```
http://127.0.0.1:4040
```

Nessa interface você vê **todas** as requisições HTTP que passaram pelo túnel:

- IP de origem
- Headers completos (`User-Agent`, `x-signature`, etc.)
- Corpo do POST
- Status e corpo da resposta

É a forma mais prática de inspecionar quem chamou o endpoint e o que foi enviado.

### O que identificar como "quem enviou"

Webhooks não trazem um "usuário logado". Use:

| Fonte | O que indica |
|-------|----------------|
| Assinatura HMAC válida | Requisição de quem possui o `WEBHOOK_SECRET` |
| IP / headers no ngrok | Origem da chamada HTTP |
| Campos do payload JSON | Tipo de evento, IDs, dados do negócio |

---

## Como funciona a verificação de assinatura

```
┌─────────────────┐    POST /xK9mP2qR7nLs (rota única)    ┌──────────────────┐
│ Servidor origem │  ───────────────────────────────────► │ Webhook Receiver │
│                 │   Body (JSON bruto)              │                  │
│                 │   Header: x-signature = HMAC   │                  │
└─────────────────┘                                └──────────────────┘
```

1. O servidor de origem calcula:

   ```
   assinatura = HMAC-SHA256(corpo_bruto_da_requisição, WEBHOOK_SECRET)
   ```

2. Envia o resultado (hex) no header configurado em `SIGNATURE_HEADER`.

3. O Webhook Receiver:
   - Guarda o corpo **bruto** (bytes exatos) antes do parse JSON.
   - Recalcula o HMAC com o mesmo segredo.
   - Compara em tempo constante (`timingSafeEqual`) para evitar timing attacks.

4. Se não coincidir → responde `401` e não processa o evento.

Isso garante **autenticidade** (só quem tem o segredo assina corretamente) e **integridade** (qualquer alteração no corpo invalida a assinatura).

---

## Integrar com o seu servidor de origem

No sistema que **envia** os webhooks, implemente algo equivalente a:

### Node.js

```javascript
import crypto from 'node:crypto';

const secret = process.env.WEBHOOK_SECRET;
const payload = JSON.stringify({ evento: 'pedido.criado', id: 123 });

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

await fetch('https://sua-url/xK9mP2qR7nLs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-signature': signature,
  },
  body: payload,
});
```

### Pontos importantes

- Assine o **mesmo string/bytes** que vai no body — sem espaços extras ou reordenação de chaves JSON diferente da original.
- Use o **mesmo** `WEBHOOK_SECRET` nos dois lados.
- Envie a assinatura no header definido em `SIGNATURE_HEADER`.

---

## Personalizar a lógica de negócio

O ponto de extensão fica em `src/onWebhook.js`, chamado por `handleWebhook` em `src/app.js` **após** a validação da assinatura e **antes** de gravar o evento no histórico (somente para eventos novos, não duplicados).

### Contrato

```javascript
// src/onWebhook.js
export async function onWebhookReceived({ sessionId, event, req, eventId, duplicate }) {
  // sessionId — dono da rota (sessão isolada do painel)
  // event     — corpo JSON já parseado (req.body)
  // req       — objeto Express (headers, ip, path...)
  // eventId   — ID extraído para idempotência (ou null)
  // duplicate — sempre false aqui (duplicatas não reprocessam o hook)
}
```

### Exemplo mínimo

```javascript
export async function onWebhookReceived({ sessionId, event, eventId }) {
  console.log(`[${sessionId.slice(0, 8)}] novo evento ${eventId}:`, event?.tipo);
  // await fila.publish('webhooks', { sessionId, eventId, event });
}
```

### Idempotência

Eventos com o mesmo ID (campos `id`, `event_id` ou `eventId` por padrão; configure `EVENT_ID_FIELDS` no `.env`) são aceitos com `200` e `{ received: true, duplicate: true }`, aparecem no painel como **duplicado** e **não** disparam `onWebhookReceived` de novo.

### Boas práticas

- Responda `2xx` **rápido** no handler HTTP; processe trabalho pesado de forma assíncrona (fila, worker).
- Trate erros no hook sem derrubar o servidor — use try/catch interno se necessário.
- Não altere `res.status` / `res.json` dentro do hook; o `handleWebhook` já responde ao cliente.

---

## Solução de problemas

### `WEBHOOK_SECRET não definido` ao iniciar

- Defina `WEBHOOK_SECRET` no `.env` para ativar a verificação, **ou**
- Omita `WEBHOOK_SECRET` para aceitar webhooks sem verificação (somente dev).

### Sempre retorna `401 assinatura inválida`

| Causa provável | Solução |
|----------------|---------|
| Segredo diferente entre origem e receptor | Confira `WEBHOOK_SECRET` nos dois lados |
| Header errado | Ajuste `SIGNATURE_HEADER` ou o header enviado |
| Corpo alterado antes da assinatura | Assine os bytes exatos do body enviado |
| JSON com formatação diferente | Use `JSON.stringify` consistente na origem |

### Servidor não recebe nada via ngrok

- Confirme que o Node está rodando na porta `3000` (ou a do `PORT`).
- Confirme que o ngrok aponta para a mesma porta.
- Use a URL completa com a rota aleatória (copie de `GET /` ou do terminal).
- Verifique o painel em `http://127.0.0.1:4040` se a requisição chegou ao túnel.

### ngrok: `authentication failed`

- Gere um novo authtoken em [dashboard.ngrok.com](https://dashboard.ngrok.com/) e configure:

  ```bash
  ngrok config add-authtoken SEU_TOKEN
  ```

### Payload vazio ou `undefined` no log

- Envie `Content-Type: application/json`.
- O body deve ser JSON válido.

---

## Boas práticas em produção

1. **Defina `WEBHOOK_SECRET`** em produção e use um segredo longo e aleatório.
2. **Nunca commite** o arquivo `.env` — ele contém o segredo.
3. **Responda rápido** (`< 5s`) para evitar retries desnecessários do provedor.
4. **Processe de forma assíncrona** o que for pesado (e-mail, PDF, integrações lentas).
5. **Registre e monitore** falhas de assinatura — podem indicar tentativas de abuso.
6. **Use HTTPS** em produção (ngrok já fornece HTTPS; em deploy real, configure TLS no reverse proxy).

---

## Deploy

### Onde hospedar

| Plataforma | Tipo | Observação |
|-----------|------|------------|
| Render, Railway, Fly.io, VPS | Processo persistente | Roda `npm start` como está. Funciona com memória, mas prefira Redis para não perder dados em restart/deploy. |
| **Vercel** | Serverless | **Exige Redis (Upstash)** — a memória não é compartilhada entre invocações; sem Redis o histórico fica vazio/instável. |

### Deploy na Vercel (com Upstash Redis)

1. **Suba o repositório no GitHub** e importe o projeto na Vercel (Application Preset: `Express`, Root `./`, sem Build Command).
2. **Crie um Redis Upstash** (grátis): em [upstash.com](https://upstash.com) ou pela própria Vercel em **Storage → Marketplace → Upstash for Redis**. A integração da Vercel injeta as variáveis automaticamente no projeto.
3. **Defina as variáveis de ambiente** do projeto na Vercel (Settings → Environment Variables):
   - `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_URL` / `KV_REST_API_TOKEN` da integração).
   - `WEBHOOK_SECRET` e `SIGNATURE_HEADER` (recomendado em produção).
   - `PUBLIC_URL` = a URL do seu deploy (ex: `https://webhook-receiver.vercel.app`), para o painel exibir as URLs completas.
4. **Deploy.** O `vercel.json` roteia todas as requisições para `api/index.js` (a app Express); o painel, a API e as rotas de webhook são resolvidos pelo Express.

> O `.env` **não** é versionado (está no `.gitignore`). Configure os segredos nas variáveis de ambiente da Vercel.

### Como funciona o entrypoint serverless

- `src/app.js` cria e exporta a app Express (sem `app.listen`).
- `api/index.js` apenas reexporta a app como handler da função serverless.
- `src/server.js` é o bootstrap para hosts com processo persistente (`app.listen` + limpeza de sessões).
- O `src/store.js` usa **Redis** quando há credenciais e cai para **memória** quando não há.

---

## Estrutura do projeto

```
webhook-receiver/
├── api/
│   └── index.js            # Entrypoint serverless da Vercel (exporta a app)
├── src/
│   ├── app.js              # App Express (painel, API e rotas de webhook)
│   ├── onWebhook.js        # Hook de lógica de negócio (customize aqui)
│   ├── extractEventId.js   # Extração de ID para idempotência
│   ├── server.js           # Bootstrap local (app.listen) para host persistente
│   ├── store.js            # Store por sessão: Redis (Upstash) ou memória
│   ├── generatePath.js     # Geração da rota aleatória
│   └── verifySignature.js  # Validação HMAC-SHA256
├── public/
│   └── index.html          # Painel de administração (GET /)
├── scripts/
│   └── sign.js             # Utilitário para gerar curl de teste
├── vercel.json             # Roteamento serverless (rewrites + includeFiles)
├── .env.example            # Modelo de configuração
├── package.json
├── README.md               # Visão geral rápida
└── DOCUMENTACAO.md         # Este guia
```

---

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe o servidor com auto-reload |
| `npm start` | Sobe o servidor em modo normal |
| `npm run sign '<json>' [rota]` | Gera assinatura e comando curl de teste |

---

## Referência rápida

```bash
# Setup
npm install && copy .env.example .env   # Windows
# editar .env com WEBHOOK_SECRET

# Rodar (copie a rota exibida no terminal)
npm run dev

# Testar
npm run sign '{"evento":"teste","id":1}' /xK9mP2qR7nLs

# Expor
ngrok http 3000
# PUBLIC_URL=https://XXXX.ngrok-free.dev no .env
# URL do webhook: https://XXXX.ngrok-free.dev/xK9mP2qR7nLs

# Inspecionar requisições
# http://127.0.0.1:4040
```
