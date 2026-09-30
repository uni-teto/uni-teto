import { createRateLimiter } from "@/lib/rate-limit";

// Limites de anúncio. Cada envio pode consultar o Nominatim, e a fila é de
// 1 pedido por segundo para o site inteiro: sem limite, uma pessoa enviando
// sem parar travaria a localização de todo mundo (e o Nominatim poderia
// bloquear o servidor).

/** Anúncios por conta (ativos e pausados). */
export const MAX_LISTINGS_PER_USER = 20;

/** Envios (criar ou salvar edição) por pessoa numa janela de 10 minutos. */
export const MAX_SUBMITS_PER_WINDOW = 10;
const SUBMIT_WINDOW_MS = 10 * 60_000;

const submitLimiter = createRateLimiter({
  limit: MAX_SUBMITS_PER_WINDOW,
  windowMs: SUBMIT_WINDOW_MS,
});

/**
 * Registra um envio de anúncio da pessoa. Devolve a mensagem para mostrar se
 * ela passou do limite (`null` se pode seguir).
 */
export function listingSubmitBlocked(userId: string): string | null {
  const result = submitLimiter.hit(userId);
  if (result.ok) return null;
  const minutes = Math.max(1, Math.ceil(result.retryAfterMs / 60_000));
  return `Você enviou muitos anúncios em pouco tempo. Tente de novo em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`;
}

export const TOO_MANY_LISTINGS = `Cada conta pode ter até ${MAX_LISTINGS_PER_USER} anúncios. Exclua um anúncio antigo para criar outro.`;
