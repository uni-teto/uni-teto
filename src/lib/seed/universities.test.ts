import { describe, expect, it } from "vitest";
import { getEmailDomain } from "@/lib/auth/email-domain";
import { universities } from "./universities";

const campuses = universities.flatMap((university) => university.campuses);

describe("dados do seed de universidades", () => {
  it("não repete ids nem domínios", () => {
    const universityIds = universities.map((u) => u.id);
    const campusIds = campuses.map((c) => c.id);
    const domains = universities.map((u) => u.emailDomain);

    expect(new Set(universityIds).size).toBe(universityIds.length);
    expect(new Set(campusIds).size).toBe(campusIds.length);
    expect(new Set(domains).size).toBe(domains.length);
  });

  it("usa domínios no mesmo formato que o cadastro compara", () => {
    for (const { emailDomain } of universities) {
      expect(getEmailDomain(`aluno@${emailDomain}`)).toBe(emailDomain);
    }
  });

  it("tem pelo menos um campus por universidade", () => {
    for (const university of universities) {
      expect(university.campuses.length).toBeGreaterThan(0);
    }
  });

  // Pega coordenadas trocadas (lat/lon) ou com sinal errado
  it("tem coordenadas dentro do Piauí", () => {
    for (const campus of campuses) {
      expect(campus.state).toBe("PI");
      expect(campus.latitude).toBeGreaterThan(-11);
      expect(campus.latitude).toBeLessThan(-2.7);
      expect(campus.longitude).toBeGreaterThan(-46);
      expect(campus.longitude).toBeLessThan(-40.3);
    }
  });
});
