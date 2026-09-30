"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { PasswordInput } from "@/components/password-input";
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
import { FieldError } from "@/components/ui/field";
import { deleteAccountSchema } from "@/lib/account/delete-account";
import { deleteMyAccount } from "./actions";

type Input = { password: string };

/** "Excluir minha conta": confirma com a senha numa janela. */
export function DeleteAccount({ listingCount }: { listingCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Input>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: Input) {
    const result = await deleteMyAccount(values).catch(() => ({
      ok: false as const,
      message: "Não foi possível excluir a conta. Tente de novo.",
    }));
    if (result.ok) {
      toast.success("Sua conta foi excluída.");
      router.push("/");
      router.refresh();
      return;
    }
    if ("fieldErrors" in result && result.fieldErrors?.password) {
      setError("password", { message: result.fieldErrors.password[0] });
    }
    if (result.message) setError("root", { message: result.message });
  }

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        Excluir minha conta
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (isSubmitting) return;
          setOpen(next);
          if (!next) reset();
        }}
      >
        <AlertDialogContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid gap-4"
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Seus dados, sua foto
                {listingCount > 0 &&
                  ` e ${listingCount === 1 ? "seu anúncio" : `seus ${listingCount} anúncios`} (com as fotos)`}{" "}
                serão apagados. Não dá para desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <FormField
              id="delete-password"
              label="Sua senha"
              error={errors.password}
            >
              <PasswordInput
                id="delete-password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
            </FormField>
            <FieldError errors={[errors.root]} />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancelar
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Excluindo..." : "Excluir conta"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
