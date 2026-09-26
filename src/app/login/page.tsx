import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { safeRedirectPath } from "@/lib/auth/routes";
import { getSession } from "@/lib/auth/session";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Entrar | UniTeto",
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/login">) {
  // Página de onde a pessoa veio (ex: /perfil), validada contra open redirect
  const next = safeRedirectPath((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>Entrar</h1>
          </CardTitle>
          <CardDescription>
            Acesse sua conta com o e-mail institucional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm next={next} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Ainda não tem conta?&nbsp;
          <Link href="/cadastro" className="font-medium underline">
            Criar conta
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
