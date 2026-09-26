import { expect } from "@playwright/test";

// API do Mailpit (docker-compose), onde caem os e-mails em desenvolvimento/CI
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

type MailpitSummary = { ID: string; Subject: string };

/**
 * Espera chegar um e-mail para `to` com `subject` e devolve o primeiro link
 * do texto. Os e-mails são enviados em segundo plano, então pode demorar.
 */
export async function waitForEmailLink(to: string, subject: string) {
  let messageId: string | undefined;

  await expect
    .poll(
      async () => {
        const query = encodeURIComponent(`to:"${to}" subject:"${subject}"`);
        const response = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${query}`,
        );
        const { messages } = (await response.json()) as {
          messages: MailpitSummary[];
        };
        messageId = messages[0]?.ID;
        return messageId;
      },
      { message: `e-mail "${subject}" para ${to}`, timeout: 15_000 },
    )
    .toBeTruthy();

  const response = await fetch(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  const { Text } = (await response.json()) as { Text: string };
  const link = Text.match(/https?:\/\/\S+/)?.[0];
  if (!link) throw new Error(`Sem link no e-mail "${subject}"`);
  return link;
}
