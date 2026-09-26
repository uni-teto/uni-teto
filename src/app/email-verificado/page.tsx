import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Confirmação de e-mail | UniTeto",
};

// Destino do link do e-mail de confirmação (ver EMAIL_VERIFIED_PATH).
// Com sucesso, o usuário já chega logado; com erro, vem `?error=CODIGO`.
export default async function EmailVerifiedPage({
  searchParams,
}: PageProps<"/email-verificado">) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        {error ? (
          <>
            <CardHeader>
              <CardTitle>
                <h1>
                  {error === "TOKEN_EXPIRED"
                    ? "O link expirou"
                    : "Link inválido"}
                </h1>
              </CardTitle>
              <CardDescription>
                Não foi possível confirmar seu e-mail com esse link. Tente
                entrar na sua conta: enviaremos um link novo.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className={buttonVariants()}>
                Entrar
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>
                <h1>E-mail confirmado</h1>
              </CardTitle>
              <CardDescription>
                Sua conta está ativa e você já está conectado.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/" className={buttonVariants()}>
                Ir para o início
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </main>
  );
}
