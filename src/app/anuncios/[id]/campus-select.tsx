"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export type CampusOption = { id: string; label: string };

/** Escolhe o campus da distância; guarda em `?campus=` para o link ser compartilhável. */
export function CampusSelect({
  campuses,
  value,
}: {
  campuses: CampusOption[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <NativeSelect
      id="campus"
      aria-label="Escolher campus"
      value={value}
      onChange={(event) => {
        const campus = event.target.value;
        const query = campus ? `?campus=${encodeURIComponent(campus)}` : "";
        router.replace(`${pathname}${query}`, { scroll: false });
      }}
      className="w-full"
    >
      <NativeSelectOption value="">Escolha um campus</NativeSelectOption>
      {campuses.map((campus) => (
        <NativeSelectOption key={campus.id} value={campus.id}>
          {campus.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
