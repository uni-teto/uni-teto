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
import { roleFromParam } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta | UniTeto",
};

// `/cadastro?papel=anunciante` (ou `estudante`) já deixa o papel escolhido
export default async function SignUpPage({
  searchParams,
}: PageProps<"/cadastro">) {
  if (await getSession()) redirect("/");
  const { papel } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1>Criar conta</h1>
          </CardTitle>
          <CardDescription>
            Estudantes usam o e-mail institucional; quem anuncia pode usar
            qualquer e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm defaultRole={roleFromParam(papel)} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Já tem conta?&nbsp;
          <Link href="/login" className="font-medium underline">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
