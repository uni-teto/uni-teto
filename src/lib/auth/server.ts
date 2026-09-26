import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { sendEmail } from "@/lib/email/send-email";
import {
  existingAccountEmail,
  resetPasswordEmail,
  verificationEmail,
  type EmailContent,
} from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { DomainNotAllowedError, resolveUniversityId } from "./email-domain";
import { FORGOT_PASSWORD_PATH, SIGN_IN_PATH } from "./routes";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./sign-up-schema";

const VERIFICATION_EXPIRES_IN_HOURS = 24;
const RESET_PASSWORD_EXPIRES_IN_MINUTES = 60;
const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Sem `await`, como recomenda o Better Auth: o tempo de resposta não revela
// se o e-mail existe. Falhas de envio só vão para o log.
function sendInBackground(to: string, content: EmailContent, kind: string) {
  void sendEmail(to, content).catch((error) => {
    console.error(`Falha ao enviar e-mail de ${kind}:`, error);
  });
}

/**
 * Configuração do Better Auth (lado do servidor).
 * Rotas HTTP em /api/auth/* (src/app/api/auth/[...all]/route.ts).
 * Lê BETTER_AUTH_SECRET e BETTER_AUTH_URL do ambiente.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    // Sem sessão até confirmar o e-mail: tudo que exige login fica bloqueado
    requireEmailVerification: true,
    autoSignIn: false,
    // "Esqueci minha senha": o link leva a RESET_PASSWORD_PATH com o token
    resetPasswordTokenExpiresIn: RESET_PASSWORD_EXPIRES_IN_MINUTES * 60,
    // Quem redefine a senha é desconectado de todos os aparelhos
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const content = resetPasswordEmail({
        name: user.name,
        url,
        expiresInMinutes: RESET_PASSWORD_EXPIRES_IN_MINUTES,
      });
      sendInBackground(user.email, content, "redefinição de senha");
    },
    // Cadastro com e-mail que já tem conta: o site responde igual a um
    // cadastro novo (não revela quais e-mails existem) e o dono é avisado aqui.
    onExistingUserSignUp: async ({ user }) => {
      const content = existingAccountEmail({
        name: user.name,
        signInUrl: new URL(SIGN_IN_PATH, BASE_URL).href,
        forgotPasswordUrl: new URL(FORGOT_PASSWORD_PATH, BASE_URL).href,
      });
      sendInBackground(user.email, content, "conta existente");
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    // Se tentar entrar sem ter confirmado, manda um link novo
    sendOnSignIn: true,
    // Ao clicar no link, já entra logado
    autoSignInAfterVerification: true,
    expiresIn: VERIFICATION_EXPIRES_IN_HOURS * 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      const content = verificationEmail({
        name: user.name,
        url,
        expiresInHours: VERIFICATION_EXPIRES_IN_HOURS,
      });
      sendInBackground(user.email, content, "verificação");
    },
  },
  session: {
    // Sessão persistente: dura 7 dias e é renovada (no máximo 1x por dia)
    // enquanto o usuário continua usando o site
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      // `input: false`: o cliente não pode enviar esses campos no cadastro
      universityId: { type: "string", required: false, input: false },
      whatsapp: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Só aceita e-mail de domínio institucional cadastrado e já vincula
        // o usuário à universidade. Vale para qualquer forma de cadastro.
        before: async (user) => {
          try {
            const universityId = await resolveUniversityId(
              user.email,
              (domain) =>
                prisma.university.findUnique({
                  where: { emailDomain: domain },
                  select: { id: true },
                }),
            );
            return { data: { ...user, universityId } };
          } catch (error) {
            if (error instanceof DomainNotAllowedError) {
              throw new APIError("BAD_REQUEST", {
                code: "EMAIL_DOMAIN_NOT_ALLOWED",
                message: error.message,
              });
            }
            throw error;
          }
        },
      },
    },
  },
  // Permite que Server Actions definam os cookies de sessão
  plugins: [nextCookies()],
});
