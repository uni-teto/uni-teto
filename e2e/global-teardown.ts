import { execSync } from "node:child_process";

// Depois dos E2E, apaga as contas (e os anúncios) criadas pelos testes. Roda
// como script à parte (tsx) porque o Prisma Client é um módulo ES, que o
// Playwright não carrega aqui.
export default function globalTeardown() {
  execSync("npm run --silent db:clean-e2e", { stdio: "inherit" });
}
