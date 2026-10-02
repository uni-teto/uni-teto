import { cn } from "@/lib/utils";

// Arquivos gerados por scripts/build-logo.mjs a partir da logo original
// (public/brand/uniteto-logo.svg). Proporções iguais às do `viewBox` deles.
const VARIANTS = {
  /** Símbolo + nome lado a lado (cabeçalho) */
  horizontal: {
    src: "/brand/uniteto-horizontal.svg",
    width: 1409,
    height: 300,
  },
  /** Só o símbolo: a casa com o capelo */
  symbol: { src: "/brand/uniteto-symbol.svg", width: 529, height: 415 },
};

/**
 * Logo do UniTeto. O tamanho vem da altura em `className` (ex: `h-8`); a
 * largura acompanha. A logo é preta: em fundo escuro, passe `inverted`.
 */
export function Logo({
  variant = "horizontal",
  inverted = false,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  inverted?: boolean;
  className?: string;
}) {
  const { src, width, height } = VARIANTS[variant];
  return (
    // SVG pequeno e estático: não passa pelo otimizador de imagens
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="UniTeto"
      width={width}
      height={height}
      className={cn("w-auto", inverted && "invert", className)}
    />
  );
}
