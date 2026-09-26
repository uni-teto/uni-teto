import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          UniTeto
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          {session ? (
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
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
