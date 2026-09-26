import { describe, expect, it } from "vitest";
import {
  existingAccountEmail,
  resetPasswordEmail,
  verificationEmail,
} from "./templates";

const url =
  "http://localhost:3000/api/auth/verify-email?token=abc&callbackURL=%2F";

describe("verificationEmail", () => {
  it("inclui o nome, o link e a validade no texto", () => {
    const email = verificationEmail({ name: "Maria", url, expiresInHours: 24 });

    expect(email.subject).toBe("Confirme seu e-mail no UniTeto");
    expect(email.text).toContain("Olá, Maria!");
    expect(email.text).toContain(url);
    expect(email.text).toContain("24 horas");
  });

  it("coloca o link no HTML escapando o &", () => {
    const { html } = verificationEmail({
      name: "Maria",
      url,
      expiresInHours: 24,
    });
    expect(html).toContain(
      'href="http://localhost:3000/api/auth/verify-email?token=abc&amp;callbackURL=%2F"',
    );
  });

  it("escapa HTML no nome do usuário", () => {
    const { html } = verificationEmail({
      name: '<script>alert("x")</script>',
      url,
      expiresInHours: 24,
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });
});

describe("resetPasswordEmail", () => {
  const resetUrl =
    "http://localhost:3000/api/auth/reset-password/tok?callbackURL=%2Fredefinir-senha";

  it("inclui o nome, o link e a validade em minutos", () => {
    const email = resetPasswordEmail({
      name: "Maria",
      url: resetUrl,
      expiresInMinutes: 60,
    });

    expect(email.subject).toBe("Redefina sua senha no UniTeto");
    expect(email.text).toContain("Olá, Maria!");
    expect(email.text).toContain(resetUrl);
    expect(email.text).toContain("60 minutos");
    expect(email.html).toContain(`href="${resetUrl}"`);
  });

  it("escapa HTML no nome do usuário", () => {
    const { html } = resetPasswordEmail({
      name: "<b>x</b>",
      url: resetUrl,
      expiresInMinutes: 60,
    });
    expect(html).not.toContain("<b>x</b>");
  });
});

describe("existingAccountEmail", () => {
  it("leva para o login e para a recuperação de senha", () => {
    const email = existingAccountEmail({
      name: "Maria",
      signInUrl: "http://localhost:3000/login",
      forgotPasswordUrl: "http://localhost:3000/esqueci-senha",
    });

    expect(email.subject).toBe("Você já tem uma conta no UniTeto");
    expect(email.text).toContain("http://localhost:3000/login");
    expect(email.text).toContain("http://localhost:3000/esqueci-senha");
    expect(email.html).toContain('href="http://localhost:3000/esqueci-senha"');
  });
});
