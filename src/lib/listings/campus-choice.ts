/**
 * Campi cuja distância aparece na página do anúncio: o escolhido na página
 * (`?campus=<id>`, se existir) ou, sem escolha, os da universidade do
 * estudante logado. Visitante sem escolha não vê distância até escolher.
 */
export function chooseCampusIds(
  requested: string | string[] | undefined,
  existingIds: ReadonlySet<string>,
  studentCampusIds: string[],
): string[] {
  if (typeof requested === "string" && existingIds.has(requested)) {
    return [requested];
  }
  return studentCampusIds;
}
