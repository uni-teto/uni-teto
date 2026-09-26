import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/routes";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha | UniTeto",
};

// Destino do link do e-mail de redefinição (ver RESET_PASSWORD_PATH).
// Link válido: `?token=...`; inválido ou expirado: `?error=INVALID_TOKEN`.
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/redefinir-senha">) {
  const { token, error } = await searchParams;

  if (typeof token !== "string" || !token || error) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              <h1>Link inválido ou expirado</h1>
            </CardTitle>
            <CardDescription>
              O link para redefinir a senha vale por 1 hora e só pode ser usado
              uma vez. Peça um novo.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href={FORGOT_PASSWORD_PATH} className={buttonVariants()}>
              Pedir novo link
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>Escolha uma nova senha</h1>
          </CardTitle>
          <CardDescription>
            Depois de salvar, entre de novo com a senha nova.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
