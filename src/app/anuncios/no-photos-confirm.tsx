"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Aviso ao terminar um anúncio sem fotos (depois de publicar ou em
 * "Concluir" na página de fotos). O anúncio continua publicado de qualquer
 * jeito; o aviso só incentiva a adicionar fotos.
 */
export function NoPhotosConfirm({
  open,
  onOpenChange,
  onAddPhotos,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPhotos: () => void;
  onContinue: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Continuar sem fotos?</AlertDialogTitle>
          <AlertDialogDescription>
            Anúncios sem fotos passam menos confiança para os estudantes e
            costumam receber menos contatos. O anúncio continua publicado, e
            você pode adicionar fotos depois em Meus anúncios.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={onContinue}>
            Continuar sem fotos
          </Button>
          <Button type="button" onClick={onAddPhotos}>
            Adicionar fotos
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
