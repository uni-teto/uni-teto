// Gera as variações da logo a partir do arquivo original
// (public/brand/uniteto-logo.svg): `node scripts/build-logo.mjs`.
//
// O original é um traçado só (símbolo em cima, nome e slogan embaixo). Para o
// site saem três arquivos:
//   - public/brand/uniteto-symbol.svg      só o símbolo (casa com capelo)
//   - public/brand/uniteto-horizontal.svg  símbolo + nome lado a lado (cabeçalho)
//   - src/app/icon.svg                     favicon (símbolo num quadrado)
//
// Só precisa rodar de novo se a logo original mudar. As caixas abaixo foram
// medidas no navegador (getBBox de cada <path>), em pixels do original.
import { readFileSync, writeFileSync } from "node:fs";

const source = readFileSync("public/brand/uniteto-logo.svg", "utf8");
const paths = [...source.matchAll(/<path d="([^"]+)"\/>/g)].map((m) =>
  m[1].replace(/\s+/g, " ").trim(),
);
if (paths.length !== 49) {
  throw new Error(`Esperava 49 traçados na logo, achei ${paths.length}.`);
}

// Os traçados 0 e 1 são o símbolo; de 2 a 9, as letras de "uniteto"; o resto
// é o slogan, que fica ilegível em tamanho pequeno e não é usado
const SYMBOL = { paths: paths.slice(0, 2), x: 364, y: 220, w: 529, h: 415 };
const WORDMARK = { paths: paths.slice(2, 10), x: 143, y: 682, w: 983, h: 235 };

// O original desenha de baixo para cima, em décimos de pixel
const ORIGINAL = "translate(0 1254) scale(0.1 -0.1)";

const group = (part, transform) =>
  `<g transform="${transform}"><g transform="${ORIGINAL}">${part.paths
    .map((d) => `<path d="${d}"/>`)
    .join("")}</g></g>`;

const svg = (width, height, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="#000">` +
  `<title>${title}</title>${body}</svg>\n`;

// Só o símbolo, recortado na caixa dele
writeFileSync(
  "public/brand/uniteto-symbol.svg",
  svg(
    SYMBOL.w,
    SYMBOL.h,
    group(SYMBOL, `translate(${-SYMBOL.x} ${-SYMBOL.y})`),
    "UniTeto",
  ),
);

// Símbolo à esquerda e nome à direita, alinhados pelo meio
const HEIGHT = 300;
const GAP = 44;
const scale = HEIGHT / SYMBOL.h;
const symbolWidth = Math.round(SYMBOL.w * scale);
const wordmarkX = symbolWidth + GAP;
// As letras ficam um pouco abaixo do meio, para pesar igual ao símbolo
const wordmarkY = Math.round((HEIGHT - WORDMARK.h) / 2) + 12;
writeFileSync(
  "public/brand/uniteto-horizontal.svg",
  svg(
    wordmarkX + WORDMARK.w,
    HEIGHT,
    group(
      SYMBOL,
      `scale(${scale.toFixed(4)}) translate(${-SYMBOL.x} ${-SYMBOL.y})`,
    ) +
      group(
        WORDMARK,
        `translate(${wordmarkX - WORDMARK.x} ${wordmarkY - WORDMARK.y})`,
      ),
    "UniTeto",
  ),
);

// Favicon: símbolo centralizado num quadrado, com fundo branco arredondado
// (a aba do navegador pode ser escura e o símbolo é preto)
const SIDE = 640;
const iconX = (SIDE - SYMBOL.w) / 2 - SYMBOL.x;
const iconY = (SIDE - SYMBOL.h) / 2 - SYMBOL.y;
writeFileSync(
  "src/app/icon.svg",
  svg(
    SIDE,
    SIDE,
    `<rect width="${SIDE}" height="${SIDE}" rx="120" fill="#fff"/>` +
      group(SYMBOL, `translate(${iconX} ${iconY})`),
    "UniTeto",
  ),
);

console.log("Logo: símbolo, versão horizontal e favicon gerados.");
