/**
 * Limite de tentativas por chave (ex: id do usuário) numa janela deslizante.
 *
 * Fica na memória do servidor: basta para uma instância só (o deploy do TCC).
 * Com várias instâncias, cada uma teria o seu contador; aí seria preciso
 * guardar no banco ou num Redis.
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const hits = new Map<string, number[]>();

  return {
    /** Registra uma tentativa; `ok: false` se passou do limite. */
    hit(key: string): { ok: true } | { ok: false; retryAfterMs: number } {
      const time = now();
      const recent = (hits.get(key) ?? []).filter((t) => time - t < windowMs);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: recent[0] + windowMs - time };
      }
      recent.push(time);
      hits.set(key, recent);
      return { ok: true };
    },
  };
}
