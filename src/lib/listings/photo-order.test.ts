import { describe, expect, it } from "vitest";
import { withCoverFirst, withoutPhoto } from "./photo-order";

describe("withCoverFirst", () => {
  it("coloca a foto escolhida como capa e mantém a ordem das outras", () => {
    expect(withCoverFirst(["a", "b", "c", "d"], "c")).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
  });

  it("não muda nada se a foto já é a capa ou não existe", () => {
    expect(withCoverFirst(["a", "b"], "a")).toEqual(["a", "b"]);
    expect(withCoverFirst(["a", "b"], "z")).toEqual(["a", "b"]);
  });
});

describe("withoutPhoto", () => {
  it("tira a foto e as seguintes sobem", () => {
    expect(withoutPhoto(["a", "b", "c"], "a")).toEqual(["b", "c"]);
  });
});
