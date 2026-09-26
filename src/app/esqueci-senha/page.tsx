import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha | UniTeto",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>Esqueci minha senha</h1>
          </CardTitle>
          <CardDescription>
            Informe seu e-mail institucional e enviaremos um link para você
            escolher uma nova senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Lembrou a senha?&nbsp;
          <Link href={SIGN_IN_PATH} className="font-medium underline">
            Entrar
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
