import { describe, expect, it } from "vitest";
import { centsToPriceInput, formatPrice, parsePriceToCents } from "./price";

describe("parsePriceToCents", () => {
  it.each([
    ["650", 65_000],
    ["650,5", 65_050],
    ["650,05", 65_005],
    ["1.200,00", 120_000],
    ["1200", 120_000],
    ["R$ 800", 80_000],
    [" 800,00 ", 80_000],
  ])("converte %j", (input, cents) => {
    expect(parsePriceToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "650.5", "650,555", "1.20,00", "-100", "12,3,4"])(
    "recusa %j",
    (input) => {
      expect(parsePriceToCents(input)).toBeNull();
    },
  );
});

describe("formatPrice / centsToPriceInput", () => {
  // O Intl usa espaço não separável entre "R$" e o número
  it("formata em reais", () => {
    expect(formatPrice(120_000).replace(/\s/g, " ")).toBe("R$ 1.200,00");
  });

  it("volta ao valor do campo sem o símbolo", () => {
    expect(centsToPriceInput(65_050)).toBe("650,50");
    expect(parsePriceToCents(centsToPriceInput(120_000))).toBe(120_000);
  });
});
