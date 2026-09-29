import { describe, expect, it } from "vitest";
import { maskZipCodeInput, normalizeZipCode } from "./zip-code";

describe("maskZipCodeInput", () => {
  it("formata aos poucos enquanto digita", () => {
    expect(maskZipCodeInput("")).toBe("");
    expect(maskZipCodeInput("64049")).toBe("64049");
    expect(maskZipCodeInput("640495")).toBe("64049-5");
    expect(maskZipCodeInput("64049550")).toBe("64049-550");
  });

  it("ignora letras e dígitos a mais", () => {
    expect(maskZipCodeInput("64a049-5509999")).toBe("64049-550");
  });
});

describe("normalizeZipCode", () => {
  it("guarda só os dígitos", () => {
    expect(normalizeZipCode("64049-550")).toBe("64049550");
  });

  it.each(["", "6404955", "640495501"])("recusa %j", (input) => {
    expect(normalizeZipCode(input)).toBeNull();
  });
});
