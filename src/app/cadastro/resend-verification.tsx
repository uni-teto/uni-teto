"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { EMAIL_VERIFIED_PATH } from "@/lib/auth/routes";

// Espera entre um reenvio e outro, para não lotar a caixa de entrada
const COOLDOWN_SECONDS = 60;

/** Botão "Reenviar e-mail" da tela de sucesso do cadastro. */
export function ResendVerification({ email }: { email: string }) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: EMAIL_VERIFIED_PATH,
    });
    setSending(false);

    if (error) {
      toast.error(
        "Não foi possível reenviar agora. Tente de novo em instantes.",
      );
      return;
    }
    toast.success("Enviamos um novo link de confirmação.");
    setSecondsLeft(COOLDOWN_SECONDS);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={sending || secondsLeft > 0}
      onClick={resend}
    >
      {sending
        ? "Reenviando..."
        : secondsLeft > 0
          ? `Reenviar e-mail (${secondsLeft}s)`
          : "Reenviar e-mail"}
    </Button>
  );
}
