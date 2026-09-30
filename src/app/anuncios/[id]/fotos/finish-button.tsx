"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MY_LISTINGS_PATH } from "@/lib/auth/routes";
import { NoPhotosConfirm } from "../../no-photos-confirm";

/** "Concluir" da página de fotos; sem nenhuma foto, pergunta antes. */
export function FinishButton({ hasPhotos }: { hasPhotos: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (hasPhotos) {
    return (
      <Link
        href={MY_LISTINGS_PATH}
        className={buttonVariants({ variant: "outline" })}
      >
        Concluir
      </Link>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setConfirming(true)}
      >
        Concluir
      </Button>
      <NoPhotosConfirm
        open={confirming}
        onOpenChange={setConfirming}
        // Já está na página de fotos: só fecha o aviso
        onAddPhotos={() => setConfirming(false)}
        onContinue={() => router.push(MY_LISTINGS_PATH)}
      />
    </>
  );
}
