import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NEW_LISTING_PATH } from "@/lib/auth/routes";
import { getSessionOrNull } from "@/lib/auth/session";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  // Banco fora do ar: cabeçalho de visitante em vez de derrubar o layout
  const session = await getSessionOrNull();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          UniTeto
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {session ? (
            <>
              {/* Estudante e anunciante podem anunciar */}
              <Link
                href={NEW_LISTING_PATH}
                className={buttonVariants({ variant: "outline", size: "sm" })}
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
