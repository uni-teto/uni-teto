import { describe, expect, it } from "vitest";
import {
  editListingPath,
  homeForRole,
  listingPath,
  listingPhotosPath,
  safeRedirectPath,
  signInUrl,
} from "./routes";

describe("safeRedirectPath", () => {
  it("mantém caminhos internos, com query", () => {
    expect(safeRedirectPath("/perfil")).toBe("/perfil");
    expect(safeRedirectPath("/anuncios?campus=1")).toBe("/anuncios?campus=1");
  });

  it("volta para a home sem `next`", () => {
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });

  it("bloqueia URLs de outros sites", () => {
    expect(safeRedirectPath("https://malicioso.com")).toBe("/");
    expect(safeRedirectPath("//malicioso.com")).toBe("/");
    expect(safeRedirectPath("/\\malicioso.com")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("ignora `next` repetido na URL", () => {
    expect(safeRedirectPath(["/perfil", "/outro"])).toBe("/");
  });
});

describe("signInUrl", () => {
  it("guarda o caminho de volta codificado", () => {
    expect(signInUrl("/perfil")).toBe("/login?next=%2Fperfil");
    expect(signInUrl("/a?b=1")).toBe("/login?next=%2Fa%3Fb%3D1");
  });

  it("não acrescenta `next` para a home", () => {
    expect(signInUrl("/")).toBe("/login");
  });
});

describe("homeForRole", () => {
  it("leva o anunciante para Meus anúncios e o estudante para a busca", () => {
    expect(homeForRole("ANUNCIANTE")).toBe("/meus-anuncios");
    expect(homeForRole("ESTUDANTE")).toBe("/busca");
  });
});

describe("caminhos do anúncio", () => {
  it("codifica o id na URL", () => {
    expect(listingPath("abc")).toBe("/anuncios/abc");
    expect(listingPath("abc", null)).toBe("/anuncios/abc");
    expect(listingPath("abc", "ufpi 1")).toBe("/anuncios/abc?campus=ufpi%201");
    expect(editListingPath("abc")).toBe("/anuncios/abc/editar");
    expect(listingPhotosPath("a/b")).toBe("/anuncios/a%2Fb/fotos");
  });
});
