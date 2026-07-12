/**
 * Ponto de extensão para lógica de negócio após validação da assinatura.
 *
 * Contrato:
 * - Recebe { sessionId, event, req, eventId, duplicate }
 * - Pode ser async; erros não tratados viram 500 no handler principal
 * - Não altere res.status/res.json aqui — use apenas para efeitos colaterais
 *   (banco, fila, APIs externas, logs estruturados)
 *
 * Exemplo mínimo:
 *
 *   export async function onWebhookReceived({ sessionId, event, eventId }) {
 *     console.log(`[${sessionId.slice(0, 8)}] evento ${eventId}:`, event.tipo);
 *     // await queue.publish('webhooks', { sessionId, eventId, event });
 *   }
 */
export async function onWebhookReceived(_ctx) {
  // Implemente sua lógica aqui ou substitua este arquivo no seu fork.
}
