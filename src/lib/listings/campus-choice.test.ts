import { describe, expect, it } from "vitest";
import { chooseCampusIds } from "./campus-choice";

const existing = new Set(["ufpi-a", "ufpi-b", "uespi-a"]);

describe("chooseCampusIds", () => {
  it("usa o campus escolhido na página", () => {
    expect(chooseCampusIds("uespi-a", existing, ["ufpi-a", "ufpi-b"])).toEqual([
      "uespi-a",
    ]);
  });

  it("sem escolha, usa os campi da universidade do estudante", () => {
    expect(chooseCampusIds(undefined, existing, ["ufpi-a", "ufpi-b"])).toEqual([
      "ufpi-a",
      "ufpi-b",
    ]);
  });

  it("ignora campus inexistente ou repetido na URL", () => {
    expect(chooseCampusIds("nao-existe", existing, ["ufpi-a"])).toEqual([
      "ufpi-a",
    ]);
    expect(chooseCampusIds(["ufpi-a", "ufpi-b"], existing, [])).toEqual([]);
  });

  it("visitante sem escolha não vê distância", () => {
    expect(chooseCampusIds(undefined, existing, [])).toEqual([]);
  });
});
