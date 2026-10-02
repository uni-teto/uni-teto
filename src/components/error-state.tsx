"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "./logo";

/**
 * Tela de "Algo deu errado", usada por `app/error.tsx` e
 * `app/global-error.tsx`. Em produção o Next não repassa a mensagem do erro
 * do servidor (pode ter dado sensível), só o `digest`, que aparece aqui para
 * achar o erro no log.
 */
export function ErrorState({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      {/* O React leva o <title> para o <head> (error.tsx não tem metadata) */}
      <title>Algo deu errado | UniTeto</title>
      <Logo variant="symbol" className="mb-2 h-16 opacity-20" />
      <p className="text-sm font-medium text-muted-foreground">Erro</p>
      <h1 className="text-3xl font-semibold">Algo deu errado</h1>
      <p className="max-w-sm text-muted-foreground">
        Não foi possível carregar esta página. Pode ser uma falha passageira:
        tente de novo em alguns instantes.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => retry()}>
          Tentar de novo
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar para o início
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Código do erro: {error.digest}
        </p>
      )}
    </main>
  );
}
