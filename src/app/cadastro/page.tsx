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
import { getSession } from "@/lib/auth/session";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta | UniTeto",
};

export default async function SignUpPage() {
  if (await getSession()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>Criar conta</h1>
          </CardTitle>
          <CardDescription>
            Cadastre-se com o e-mail institucional da sua universidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
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
