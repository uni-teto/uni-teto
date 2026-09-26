import type { FieldError as FormError } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

/** Rótulo + campo + descrição + erro do React Hook Form, no padrão do shadcn. */
export function FormField({
  id,
  label,
  description,
  error,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: FormError;
  children: React.ReactNode;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  );
}
