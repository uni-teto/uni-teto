"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteListing, setListingPaused } from "./actions";

/** Botões "Pausar/Reativar" e "Excluir" de um anúncio em Meus anúncios. */
export function ListingActions({
  listingId,
  title,
  paused,
}: {
  listingId: string;
  title: string;
  paused: boolean;
}) {
  const [busy, setBusy] = useState<"status" | "delete" | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function togglePaused() {
    setBusy("status");
    const result = await setListingPaused(listingId, !paused).catch(() => ({
      ok: false as const,
    }));
    setBusy(null);
    if (result.ok) {
      toast.success(
        paused
          ? "Anúncio reativado: voltou a aparecer na busca."
          : "Anúncio pausado: não aparece mais na busca.",
      );
    } else {
      toast.error("Não foi possível mudar o anúncio. Tente de novo.");
    }
  }

  async function remove() {
    setBusy("delete");
    const result = await deleteListing(listingId).catch(() => ({
      ok: false as const,
    }));
    setBusy(null);
    setConfirming(false);
    if (result.ok) toast.success("Anúncio excluído.");
    else toast.error("Não foi possível excluir o anúncio. Tente de novo.");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={togglePaused}
      >
        {busy === "status" ? "Aguarde..." : paused ? "Reativar" : "Pausar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={busy !== null}
        onClick={() => setConfirming(true)}
      >
        Excluir
      </Button>
      <AlertDialog
        open={confirming}
        // Não fecha no meio da exclusão
        onOpenChange={(open) => busy !== "delete" && setConfirming(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{title}&rdquo; e as fotos dele serão apagados. Não dá para
              desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "delete"}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={busy === "delete"}
              onClick={remove}
            >
              {busy === "delete" ? "Excluindo..." : "Excluir anúncio"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
