import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página não encontrada | UniTeto",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Logo variant="symbol" className="mb-2 h-16 opacity-20" />
      <p className="text-sm font-medium text-muted-foreground">Erro 404</p>
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <p className="max-w-sm text-muted-foreground">
        O endereço pode estar errado ou a página foi removida.
      </p>
      <Link href="/" className={buttonVariants()}>
        Voltar para o início
      </Link>
    </main>
  );
}
