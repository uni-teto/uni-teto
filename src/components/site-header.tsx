import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NEW_LISTING_PATH, SEARCH_PATH } from "@/lib/auth/routes";
import { getSessionOrNull } from "@/lib/auth/session";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { displayName } from "@/lib/profile/name";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  // Banco fora do ar: cabeçalho de visitante em vez de derrubar o layout
  const session = await getSessionOrNull();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="shrink-0 rounded-md">
            {/* No celular só o símbolo, para sobrar espaço para os botões */}
            <Logo className="hidden h-8 sm:block" />
            <Logo variant="symbol" className="h-9 sm:hidden" />
          </Link>
          <MainNav className="hidden md:flex" />
        </div>

        <div className="flex items-center gap-1 text-sm sm:gap-2">
          {/* Em tela larga a busca já está nos links principais */}
          <Link
            href={SEARCH_PATH}
            aria-label="Buscar"
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "md:hidden",
            })}
          >
            <SearchIcon aria-hidden />
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
                name={displayName(session.user)}
                email={session.user.email}
                image={session.user.image}
              />
            </>
          ) : (
            <>
              <Link
                href="/cadastro"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Criar conta
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ size: "sm", className: "px-5" })}
              >
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
