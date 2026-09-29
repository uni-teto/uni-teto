import { describe, expect, it } from "vitest";
import { contactBlockFor, contactMessage, listingContact } from "./contact";

describe("contactBlockFor", () => {
  const ownerId = "dono";

  it("mostra o contato só para estudante logado que não é o dono", () => {
    expect(contactBlockFor({ id: "aluno", role: "ESTUDANTE" }, ownerId)).toBe(
      null,
    );
  });

  it("esconde de visitante, anunciante e do próprio dono", () => {
    expect(contactBlockFor(null, ownerId)).toBe("visitante");
    expect(contactBlockFor({ id: "outro", role: "ANUNCIANTE" }, ownerId)).toBe(
      "anunciante",
    );
    expect(contactBlockFor({ id: ownerId, role: "ESTUDANTE" }, ownerId)).toBe(
      "dono",
    );
  });
});

describe("listingContact", () => {
  const title = "Quarto & sala perto da UFPI";

  it("monta o link do WhatsApp com a mensagem citando o anúncio", () => {
    const contact = listingContact(
      { name: "Ana", email: "ana@example.com", whatsapp: "5586999998888" },
      title,
    );
    expect(contact.whatsapp?.label).toBe("(86) 99999-8888");
    const url = new URL(contact.whatsapp!.href);
    expect(url.origin + url.pathname).toBe("https://wa.me/5586999998888");
    expect(url.searchParams.get("text")).toBe(contactMessage(title));
  });

  it("monta o mailto com assunto e mensagem", () => {
    const contact = listingContact(
      { name: "Ana", email: "ana@example.com", whatsapp: null },
      title,
    );
    expect(contact.email.address).toBe("ana@example.com");
    const url = new URL(contact.email.href);
    expect(url.protocol).toBe("mailto:");
    expect(url.searchParams.get("subject")).toBe(
      `Anúncio no UniTeto: ${title}`,
    );
    expect(url.searchParams.get("body")).toBe(contactMessage(title));
  });

  it("sem WhatsApp no perfil, fica só o e-mail", () => {
    const contact = listingContact(
      { name: "Ana", email: "ana@example.com", whatsapp: null },
      title,
    );
    expect(contact.whatsapp).toBeNull();
  });
});
