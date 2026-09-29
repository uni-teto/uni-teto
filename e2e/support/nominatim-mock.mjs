// Nominatim falso para os testes E2E: o CI não depende do serviço público
// (rede, limite de 1 req/s). Sobe junto com o servidor do Playwright
// (playwright.config.ts), que aponta NOMINATIM_URL para cá.
//
// As respostas imitam as do Nominatim real para os endereços dos testes, então
// os testes também passam contra o serviço de verdade (ex: rodando local com um
// `npm run dev` já aberto, que o Playwright reaproveita):
// - rua que contém "Inexistente" → não encontrada (lista vazia)
// - qualquer outra rua → trecho da rua, sem o número (precisão "rua"), como
//   acontece com a maioria dos endereços de Teresina no OSM
import { createServer } from "node:http";

const PORT = Number(process.env.NOMINATIM_MOCK_PORT ?? 8089);

function respond(url) {
  const street = url.searchParams.get("street") ?? "";
  const q = url.searchParams.get("q") ?? "";
  if (/inexistente/i.test(street + q)) return [];

  // Busca por bairro (plano B) não é usada nos testes: devolve vazio
  if (!street) return [];

  const name = street.replace(/^\S*\d\S*\s+/, "");
  return [
    {
      lat: "-5.0914901",
      lon: "-42.8039737",
      name,
      addresstype: "road",
      display_name: `${name}, Centro, Teresina, Piauí, Brasil`,
      address: {
        road: name,
        suburb: "Centro",
        city: "Teresina",
        postcode: "64001-390",
        "ISO3166-2-lvl4": "BR-PI",
      },
    },
  ];
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${PORT}`);
  if (url.pathname !== "/search") {
    response.writeHead(url.pathname === "/" ? 200 : 404).end("ok");
    return;
  }
  response
    .writeHead(200, { "Content-Type": "application/json" })
    .end(JSON.stringify(respond(url)));
}).listen(PORT, () => {
  console.log(`Nominatim falso em http://localhost:${PORT}`);
});
