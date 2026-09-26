import { describe, expect, it } from "vitest";
import { firstName, initials } from "./name";

describe("firstName", () => {
  it("pega só o primeiro nome", () => {
    expect(firstName("Maria Clara Souza")).toBe("Maria");
    expect(firstName("  Ana  ")).toBe("Ana");
  });
});

describe("initials", () => {
  it("usa a primeira letra do primeiro e do último nome", () => {
    expect(initials("Maria Clara Souza")).toBe("MS");
    expect(initials("ana")).toBe("A");
  });
});
