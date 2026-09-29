import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

function setup() {
  let time = 0;
  const limiter = createRateLimiter({
    limit: 2,
    windowMs: 60_000,
    now: () => time,
  });
  return { limiter, advance: (ms: number) => (time += ms) };
}

describe("createRateLimiter", () => {
  it("deixa passar até o limite e barra a seguinte", () => {
    const { limiter, advance } = setup();
    expect(limiter.hit("ana").ok).toBe(true);
    advance(10_000);
    expect(limiter.hit("ana").ok).toBe(true);
    advance(5_000);
    // A primeira tentativa (t=0) libera a vaga em t=60s: faltam 45s
    expect(limiter.hit("ana")).toEqual({ ok: false, retryAfterMs: 45_000 });
  });

  it("libera quando as tentativas antigas saem da janela", () => {
    const { limiter, advance } = setup();
    limiter.hit("ana");
    limiter.hit("ana");
    advance(60_000);
    expect(limiter.hit("ana").ok).toBe(true);
  });

  it("conta cada pessoa separado", () => {
    const { limiter } = setup();
    limiter.hit("ana");
    limiter.hit("ana");
    expect(limiter.hit("ana").ok).toBe(false);
    expect(limiter.hit("bia").ok).toBe(true);
  });
});
