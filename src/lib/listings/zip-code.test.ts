import { describe, expect, it } from "vitest";
import {
  maskZipCodeInput,
  normalizeZipCode,
  stateForZipCode,
} from "./zip-code";

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

describe("stateForZipCode", () => {
  it("acha o estado pela faixa dos Correios", () => {
    expect(stateForZipCode("64049550")).toBe("PI"); // Teresina (UFPI)
    expect(stateForZipCode("65633330")).toBe("MA"); // Timon
    expect(stateForZipCode("01310100")).toBe("SP");
    expect(stateForZipCode("90010000")).toBe("RS");
  });

  it("confere as bordas e os estados com duas faixas", () => {
    expect(stateForZipCode("64000000")).toBe("PI");
    expect(stateForZipCode("64999999")).toBe("PI");
    expect(stateForZipCode("65000000")).toBe("MA");
    expect(stateForZipCode("69350000")).toBe("RR"); // entre as faixas do AM
    expect(stateForZipCode("69500000")).toBe("AM");
    expect(stateForZipCode("72900000")).toBe("GO"); // entre as faixas do DF
    expect(stateForZipCode("73100000")).toBe("DF");
    expect(stateForZipCode("76900000")).toBe("RO");
  });

  it("retorna null para CEP inválido ou fora das faixas", () => {
    expect(stateForZipCode("00000000")).toBeNull();
    expect(stateForZipCode("6404955")).toBeNull();
    expect(stateForZipCode("64049-550")).toBeNull();
  });
});
