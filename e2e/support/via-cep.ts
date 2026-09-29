import type { Page } from "@playwright/test";

// ViaCEP falso: o formulário consulta o CEP direto do navegador, então a
// resposta é interceptada na página (o CI não depende do serviço público).
// As ruas batem com as do Nominatim falso (nominatim-mock.mjs).

const ADDRESSES: Record<string, object> = {
  "64001390": {
    cep: "64001-390",
    logradouro: "Rua Desembargador Pires de Castro",
    bairro: "Centro",
    localidade: "Teresina",
    uf: "PI",
  },
  // Timon (MA), do outro lado do rio: o caso que motivou a checagem CEP × UF
  "65633330": {
    cep: "65633-330",
    logradouro: "Rua Firmino José da Silva",
    bairro: "Parque Alvorada",
    localidade: "Timon",
    uf: "MA",
  },
};

/** CEPs conhecidos respondem; os outros, "CEP não encontrado". */
export async function mockViaCep(page: Page) {
  await page.route("https://viacep.com.br/ws/**", (route) => {
    const zipCode = new URL(route.request().url()).pathname.split("/")[2];
    return route.fulfill({ json: ADDRESSES[zipCode] ?? { erro: "true" } });
  });
}
