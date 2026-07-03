import crypto from 'node:crypto';

/**
 * Verifica a assinatura HMAC-SHA256 de um webhook.
 *
 * O servidor de origem calcula:
 *   HMAC-SHA256(corpo_bruto_da_requisicao, WEBHOOK_SECRET)
 * e envia o resultado (hex) no header de assinatura.
 *
 * Aqui recalculamos e comparamos em tempo constante para evitar
 * timing attacks.
 *
 * @param {Buffer} rawBody  Corpo bruto exato da requisição (não parseado).
 * @param {string} signatureHeader  Valor do header de assinatura recebido.
 * @param {string} secret  Segredo compartilhado com o servidor de origem.
 * @returns {boolean}
 */
export function verifySignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  // Alguns provedores prefixam a assinatura, ex: "sha256=abc123...".
  // Removemos o prefixo se existir.
  const received = signatureHeader.includes('=')
    ? signatureHeader.split('=').pop()
    : signatureHeader;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const receivedBuf = Buffer.from(received, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  // Comparação em tempo constante. timingSafeEqual exige buffers do
  // mesmo tamanho, por isso verificamos o comprimento primeiro.
  if (receivedBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(receivedBuf, expectedBuf);
}
