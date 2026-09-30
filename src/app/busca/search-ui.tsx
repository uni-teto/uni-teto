"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Estado da tela de busca que é só do navegador e é dividido entre o
// formulário, a lista e o mapa: a troca de filtros em andamento e o anúncio
// sob o mouse (para destacar o card e o marcador juntos).

type SearchUi = {
  /** Uma troca de filtro ou de página está carregando */
  pending: boolean;
  /** Vai para outra busca mostrando o "carregando" sobre os resultados */
  navigate: (url: string) => void;
  /** Anúncio sob o mouse (no card ou no marcador do mapa) */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

// Fora da busca (ex: destaques da página inicial) nada disso existe
const SearchUiContext = createContext<SearchUi>({
  pending: false,
  navigate: () => {},
  activeId: null,
  setActiveId: () => {},
});

export const useSearchUi = () => useContext(SearchUiContext);

export function SearchUiProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      pending,
      navigate: (url: string) => startTransition(() => router.push(url)),
      activeId,
      setActiveId,
    }),
    [pending, router, activeId],
  );

  return (
    <SearchUiContext.Provider value={value}>
      {children}
    </SearchUiContext.Provider>
  );
}

/** Link para outra busca (paginação, "Limpar") que mostra o "carregando". */
export function SearchLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { navigate } = useSearchUi();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        // Abrir em outra aba (Ctrl/Cmd/Shift + clique) segue como link normal
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}

/**
 * Bloco dos filtros. Em tela larga fica sempre aberto; no celular fica atrás
 * do botão "Filtros", para o primeiro anúncio não ficar uma tela abaixo.
 * Começa aberto quando ainda não há campus escolhido (é o primeiro passo).
 */
export function FiltersPanel({
  activeCount,
  startOpen,
  children,
}: {
  /** Quantos filtros estão aplicados (aparece no botão) */
  activeCount: number;
  startOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);

  return (
    <section
      aria-label="Filtros"
      className="mt-6 rounded-xl border bg-muted/40 p-4"
    >
      <Button
        type="button"
        variant="outline"
        className="w-full sm:hidden"
        aria-expanded={open}
        aria-controls="filtros"
        onClick={() => setOpen(!open)}
      >
        <SlidersHorizontalIcon aria-hidden />
        {open ? "Esconder filtros" : "Filtros"}
        {activeCount > 0 && ` (${activeCount})`}
      </Button>
      <div
        id="filtros"
        className={cn("sm:mt-0 sm:block", open ? "mt-4" : "hidden")}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Lista e mapa dos resultados. Enquanto a busca nova carrega, os resultados
 * antigos ficam esmaecidos, com um aviso, em vez de a tela parecer travada.
 */
export function ResultsRegion({ children }: { children: React.ReactNode }) {
  const { pending } = useSearchUi();

  return (
    <div className="relative" aria-busy={pending}>
      <div
        className={cn(
          "transition-opacity",
          pending && "pointer-events-none opacity-50",
        )}
      >
        {children}
      </div>
      {pending && (
        // Sem role="status": o total de anúncios já é o status da página
        <p
          aria-live="polite"
          className="absolute top-10 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background px-4 py-2 text-sm shadow-sm"
        >
          Atualizando os resultados...
        </p>
      )}
    </div>
  );
}
