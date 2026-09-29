"use client";

import { ErrorState } from "@/components/error-state";

// Erro inesperado em qualquer página (banco fora do ar, bug): mostra a tela
// em português dentro do layout, com cabeçalho e rodapé
export default function Error(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState {...props} />;
}
