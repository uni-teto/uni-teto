import { describe, expect, it } from "vitest";
import { MAX_LISTINGS_PER_USER } from "@/lib/listings/limits";
import { listingSchema } from "@/lib/listings/listing-schema";
import { LISTING_TYPES } from "@/lib/listings/listing-types";
import { formatPrice } from "@/lib/listings/price";
import { stateForZipCode } from "@/lib/listings/zip-code";
import { DEMO_EMAIL_DOMAIN, demoListings, demoOwners } from "./demo-listings";
import { universities } from "./universities";

describe("dados do seed de demonstração", () => {
  it("não repete ids nem e-mails", () => {
    const listingIds = demoListings.map((l) => l.id);
    const ownerIds = demoOwners.map((o) => o.id);
    const emails = demoOwners.map((o) => o.email);

    expect(new Set(listingIds).size).toBe(listingIds.length);
    expect(new Set(ownerIds).size).toBe(ownerIds.length);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("usa donos com e-mail do domínio de exemplo", () => {
    for (const owner of demoOwners) {
      expect(owner.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)).toBe(true);
    }
  });

  it("vincula estudante a uma universidade do seed e anunciante a nenhuma", () => {
    const universityIds = new Set(universities.map((u) => u.id));
    for (const owner of demoOwners) {
      if (owner.role === "ESTUDANTE") {
        expect(universityIds.has(owner.universityId!)).toBe(true);
      } else {
        expect(owner.universityId).toBeNull();
      }
    }
  });

  it("respeita o limite de anúncios por conta", () => {
    const ownerIds = new Set(demoOwners.map((o) => o.id));
    const perOwner = new Map<string, number>();
    for (const { ownerId } of demoListings) {
      expect(ownerIds.has(ownerId)).toBe(true);
      perOwner.set(ownerId, (perOwner.get(ownerId) ?? 0) + 1);
    }
    for (const count of perOwner.values()) {
      expect(count).toBeLessThanOrEqual(MAX_LISTINGS_PER_USER);
    }
  });

  // O seed grava direto no banco: confere que o formulário aceitaria o mesmo
  it("passa na validação do formulário de anúncio", () => {
    for (const listing of demoListings) {
      const result = listingSchema.safeParse({
        ...listing,
        price: formatPrice(listing.priceCents),
        availableSpots: String(listing.availableSpots),
        complement: "",
      });
      expect(result.error?.issues, listing.id).toBeUndefined();
      expect(stateForZipCode(listing.zipCode)).toBe(listing.state);
    }
  });

  // Pega coordenadas trocadas (lat/lon) ou com sinal errado
  it("fica na região de Teresina e Timon", () => {
    for (const { id, latitude, longitude } of demoListings) {
      expect(latitude, id).toBeGreaterThan(-5.2);
      expect(latitude, id).toBeLessThan(-4.95);
      expect(longitude, id).toBeGreaterThan(-42.9);
      expect(longitude, id).toBeLessThan(-42.7);
    }
  });

  it("cobre todos os tipos, as precisões aproximadas e o status pausado", () => {
    const active = demoListings.filter((l) => l.status === "ATIVO");
    for (const type of LISTING_TYPES) {
      expect(active.some((l) => l.type === type)).toBe(true);
    }
    expect(active.some((l) => l.locationPrecision === "rua")).toBe(true);
    expect(active.some((l) => l.locationPrecision === "bairro")).toBe(true);
    expect(demoListings.some((l) => l.status === "PAUSADO")).toBe(true);
  });
});
