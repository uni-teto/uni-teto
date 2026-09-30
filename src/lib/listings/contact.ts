// Contato do anúncio (#27, regra da #32): só estudante logado vê o WhatsApp e
// o e-mail de quem anunciou. A decisão é tomada no servidor, antes de montar a
// página: para os outros, os dados nem chegam ao HTML.

import { formatWhatsapp } from "@/lib/profile/whatsapp";

type Viewer = { id: string; role: "ESTUDANTE" | "ANUNCIANTE" } | null;

/** Por que o contato não aparece (ou `null` se aparece). */
export type ContactBlock = "visitante" | "anunciante" | "dono";

export function contactBlockFor(
  viewer: Viewer,
  ownerId: string,
): ContactBlock | null {
  if (!viewer) return "visitante";
  if (viewer.id === ownerId) return "dono";
  if (viewer.role !== "ESTUDANTE") return "anunciante";
  return null;
}

export type ListingContact = {
  ownerName: string;
  email: { address: string; href: string };
  /** `null` quando o anunciante não cadastrou WhatsApp no perfil */
  whatsapp: { label: string; href: string } | null;
};

/** Mensagem inicial do WhatsApp e assunto do e-mail, citando o anúncio. */
export function contactMessage(listingTitle: string) {
  return `Olá! Vi o anúncio "${listingTitle}" no UniTeto e tenho interesse.`;
}

/** Links de contato; o WhatsApp já vem guardado com DDI (`5586999998888`). */
export function listingContact(
  owner: { name: string; email: string; whatsapp: string | null },
  listingTitle: string,
): ListingContact {
  const message = encodeURIComponent(contactMessage(listingTitle));
  const subject = encodeURIComponent(`Anúncio no UniTeto: ${listingTitle}`);
  return {
    ownerName: owner.name,
    email: {
      address: owner.email,
      href: `mailto:${owner.email}?subject=${subject}&body=${message}`,
    },
    whatsapp: owner.whatsapp
      ? {
          label: formatWhatsapp(owner.whatsapp),
          href: `https://wa.me/${owner.whatsapp}?text=${message}`,
        }
      : null,
  };
}
