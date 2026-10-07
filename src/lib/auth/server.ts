import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { sendEmail } from "@/lib/email/send-email";
import {
  existingAccountEmail,
  resetPasswordEmail,
  verificationEmail,
  type EmailContent,
} from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/profile/name";
import {
  PERSONAL_DATA_FIELDS,
  personalDataSchema,
  SEXES,
} from "@/lib/profile/personal-data";
import { DomainNotAllowedError } from "./email-domain";
import {
  assertRoleUnchanged,
  InvalidRoleError,
  RoleChangeNotAllowedError,
  universityIdForNewUser,
  USER_ROLES,
} from "./roles";
import { FORGOT_PASSWORD_PATH, SIGN_IN_PATH } from "./routes";
import {
  EMAIL_ALREADY_REGISTERED_MESSAGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./sign-up-schema";

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
        name: displayName(user),
        url,
        expiresInMinutes: RESET_PASSWORD_EXPIRES_IN_MINUTES,
      });
      sendInBackground(user.email, content, "redefinição de senha");
    },
    // Cadastro com e-mail que já tem conta é barrado antes, em `hooks.before`.
    // Isto só roda se dois cadastros com o mesmo e-mail chegarem juntos: o
    // site responde como cadastro novo e o dono é avisado por e-mail.
    onExistingUserSignUp: async ({ user }) => {
      const content = existingAccountEmail({
        name: displayName(user),
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
        name: displayName(user),
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
    // "Excluir minha conta" (src/lib/account/delete-account.ts), chamado só
    // pelo servidor, que exige a senha. A rota HTTP fica desligada abaixo.
    deleteUser: { enabled: true },
    additionalFields: {
      // Escolhido no cadastro (ESTUDANTE ou ANUNCIANTE). O Better Auth também
      // aceitaria na rota de atualizar usuário: o hook `update.before` barra.
      role: { type: [...USER_ROLES], required: true, input: true },
      // `input: false`: o cliente não pode enviar esses campos no cadastro
      universityId: { type: "string", required: false, input: false },
      // Pedidos no cadastro e validados por `create.before` (abaixo). Depois
      // só mudam pelo perfil (Server Action): `update.before` barra a rota
      // de atualizar usuário do Better Auth.
      whatsapp: { type: "string", required: false, input: true },
      surname: { type: "string", required: false, input: true },
      socialName: { type: "string", required: false, input: true },
      sex: { type: [...SEXES], required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Estudante: só e-mail de universidade cadastrada, já vinculado a ela.
        // Anunciante: qualquer e-mail, sem universidade. Vale para qualquer
        // forma de cadastro.
        before: async (user, ctx) => {
          // Cadastro pelo site: sobrenome, nome social, sexo e WhatsApp vêm
          // no corpo da requisição e são validados aqui, como no formulário
          let personalData = {};
          if (ctx?.path === "/sign-up/email") {
            const parsed = personalDataSchema.safeParse(ctx.body);
            if (!parsed.success) {
              throw new APIError("BAD_REQUEST", {
                code: "INVALID_PERSONAL_DATA",
                message: parsed.error.issues[0].message,
              });
            }
            personalData = parsed.data;
          }
          try {
            const universityId = await universityIdForNewUser(
              user.role,
              user.email,
              (domain) =>
                prisma.university.findUnique({
                  where: { emailDomain: domain },
                  select: { id: true },
                }),
            );
            return { data: { ...user, ...personalData, universityId } };
          } catch (error) {
            if (error instanceof DomainNotAllowedError) {
              throw new APIError("BAD_REQUEST", {
                code: "EMAIL_DOMAIN_NOT_ALLOWED",
                message: error.message,
              });
            }
            if (error instanceof InvalidRoleError) {
              throw new APIError("BAD_REQUEST", {
                code: "INVALID_ROLE",
                message: error.message,
              });
            }
            throw error;
          }
        },
      },
      update: {
        // O papel não muda depois do cadastro (senão um anunciante poderia
        // virar estudante para ver os contatos). Os dados pessoais mudam só
        // pelo perfil, que valida e normaliza (src/app/perfil/actions.ts).
        before: async (changes) => {
          try {
            assertRoleUnchanged(changes);
          } catch (error) {
            if (error instanceof RoleChangeNotAllowedError) {
              throw new APIError("FORBIDDEN", {
                code: "ROLE_CHANGE_NOT_ALLOWED",
                message: error.message,
              });
            }
            throw error;
          }
          if (PERSONAL_DATA_FIELDS.some((field) => field in changes)) {
            throw new APIError("FORBIDDEN", {
              code: "PERSONAL_DATA_CHANGE_NOT_ALLOWED",
              message: "Altere esses dados pela página do perfil.",
            });
          }
        },
      },
    },
  },
  hooks: {
    // Cadastro com e-mail que já tem conta: avisa no formulário, embaixo do
    // campo. Escolha de produto (mais claro para quem esqueceu que já tinha
    // conta), mesmo revelando que o e-mail está cadastrado. Sem isto, o Better
    // Auth responde igual a um cadastro novo.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const email: unknown = ctx.body?.email;
      if (typeof email !== "string") return;
      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });
      if (existing) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          code: "EMAIL_ALREADY_REGISTERED",
          message: EMAIL_ALREADY_REGISTERED_MESSAGE,
        });
      }
    }),
  },
  // Permite que Server Actions definam os cookies de sessão
  // Sem senha, /delete-user aceitaria excluir quem entrou há menos de 1 dia.
  // `auth.api.deleteUser` (chamado pelo servidor) continua funcionando.
  disabledPaths: ["/delete-user", "/delete-user/callback"],
  plugins: [nextCookies()],
});
