import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NEW_LISTING_PATH, SEARCH_PATH } from "@/lib/auth/routes";
import { getSessionOrNull } from "@/lib/auth/session";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  // Banco fora do ar: cabeçalho de visitante em vez de derrubar o layout
  const session = await getSessionOrNull();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="shrink-0 rounded-md">
          {/* No celular só o símbolo, para sobrar espaço para os botões */}
          <Logo className="hidden h-8 sm:block" />
          <Logo variant="symbol" className="h-9 sm:hidden" />
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href={SEARCH_PATH}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Buscar
          </Link>
          {session ? (
            <>
              {/* Estudante e anunciante podem anunciar */}
              <Link
                href={NEW_LISTING_PATH}
                className={buttonVariants({ size: "sm" })}
              >
                Anunciar
              </Link>
              <UserMenu
                name={session.user.name}
                email={session.user.email}
                image={session.user.image}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Entrar
              </Link>
              <Link href="/cadastro" className={buttonVariants({ size: "sm" })}>
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
