// CEP guardado só com os 8 dígitos (`zipCode Char(8)`); na tela, "64049-550".

import type { StateCode } from "@/lib/geo/states";

/** Máscara enquanto a pessoa digita: "64049550" → "64049-550". */
export function maskZipCodeInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

/** "64049-550" → "64049550"; `null` se não tiver 8 dígitos. */
export function normalizeZipCode(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

// Faixas de CEP de cada estado (Correios), pelos 5 primeiros dígitos.
// Alguns estados têm duas faixas (AM, DF e GO).
const STATE_ZIP_RANGES: [from: number, to: number, state: StateCode][] = [
  [1000, 19999, "SP"],
  [20000, 28999, "RJ"],
  [29000, 29999, "ES"],
  [30000, 39999, "MG"],
  [40000, 48999, "BA"],
  [49000, 49999, "SE"],
  [50000, 56999, "PE"],
  [57000, 57999, "AL"],
  [58000, 58999, "PB"],
  [59000, 59999, "RN"],
  [60000, 63999, "CE"],
  [64000, 64999, "PI"],
  [65000, 65999, "MA"],
  [66000, 68899, "PA"],
  [68900, 68999, "AP"],
  [69000, 69299, "AM"],
  [69300, 69399, "RR"],
  [69400, 69899, "AM"],
  [69900, 69999, "AC"],
  [70000, 72799, "DF"],
  [72800, 72999, "GO"],
  [73000, 73699, "DF"],
  [73700, 76799, "GO"],
  [76800, 76999, "RO"],
  [77000, 77999, "TO"],
  [78000, 78899, "MT"],
  [79000, 79999, "MS"],
  [80000, 87999, "PR"],
  [88000, 89999, "SC"],
  [90000, 99999, "RS"],
];

/**
 * Estado de um CEP (8 dígitos) pela faixa dos Correios; `null` se não cair
 * em nenhuma. Não depende de serviço externo: é a checagem do servidor.
 *
 * @example stateForZipCode("65633330") // "MA" (Timon)
 */
export function stateForZipCode(zipCode: string): StateCode | null {
  if (!/^\d{8}$/.test(zipCode)) return null;
  const prefix = Number(zipCode.slice(0, 5));
  const range = STATE_ZIP_RANGES.find(
    ([from, to]) => prefix >= from && prefix <= to,
  );
  return range?.[2] ?? null;
}
