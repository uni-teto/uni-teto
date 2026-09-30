"use client";

import "./globals.css";
import { ErrorState } from "@/components/error-state";
import { fontVariables } from "./fonts";

// Erro no próprio layout raiz (raro: o cabeçalho já tolera o banco fora do ar).
// Substitui o layout inteiro, então precisa do próprio <html> e <body>.
export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ErrorState {...props} />
      </body>
    </html>
  );
}
