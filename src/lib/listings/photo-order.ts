// Ordem das fotos de um anúncio (`ListingPhoto.position`, 0 = capa).
// Funções puras: recebem os ids na ordem atual e devolvem a nova ordem, e a
// Server Action grava `position` = índice de cada id.

/** Coloca a foto escolhida como capa e mantém a ordem das demais. */
export function withCoverFirst(orderedIds: string[], coverId: string) {
  if (!orderedIds.includes(coverId)) return orderedIds;
  return [coverId, ...orderedIds.filter((id) => id !== coverId)];
}

/** Tira a foto removida; as seguintes sobem uma posição. */
export function withoutPhoto(orderedIds: string[], removedId: string) {
  return orderedIds.filter((id) => id !== removedId);
}
