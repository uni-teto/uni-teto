import nodemailer from "nodemailer";
import type { EmailContent } from "./templates";

// SMTP lido do ambiente. Em desenvolvimento é o Mailpit (http://localhost:8025),
// que não exige usuário/senha; em produção, configure SMTP_USER e SMTP_PASSWORD.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    : undefined,
});

const from = process.env.SMTP_FROM ?? "UniTeto <nao-responda@uniteto.local>";

export async function sendEmail(to: string, content: EmailContent) {
  await transporter.sendMail({ from, to, ...content });
}
