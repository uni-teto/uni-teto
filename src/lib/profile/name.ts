type NamedUser = {
  name: string;
  surname?: string | null;
  socialName?: string | null;
};

/**
 * Nome mostrado no site: o nome social, se houver; senão nome + sobrenome.
 * Contas antigas não têm sobrenome (o nome completo está em `name`).
 */
export function displayName({ name, surname, socialName }: NamedUser) {
  if (socialName?.trim()) return socialName.trim();
  return [name, surname]
    .filter((part) => part?.trim())
    .join(" ")
    .trim();
}

/** Primeiro nome, para cumprimentos curtos: "Maria Clara Souza" → "Maria". */
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** Iniciais para o avatar sem foto: "Maria Clara Souza" → "MS". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
