import { describe, expect, it } from "vitest";
import { displayName, firstName, initials } from "./name";

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

describe("displayName", () => {
  it("junta nome e sobrenome", () => {
    expect(displayName({ name: "Maria", surname: "Souza" })).toBe(
      "Maria Souza",
    );
  });

  it("usa o nome social quando houver", () => {
    expect(
      displayName({ name: "João", surname: "Souza", socialName: " Joana " }),
    ).toBe("Joana");
  });

  it("aceita contas antigas, sem sobrenome", () => {
    expect(
      displayName({ name: "Maria Clara Souza", surname: null, socialName: "" }),
    ).toBe("Maria Clara Souza");
  });
});
