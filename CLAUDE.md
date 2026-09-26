@AGENTS.md

# UniTeto

Plataforma web de busca de moradia estudantil (quartos, vagas em repúblicas,
quitinetes) por **proximidade real ao campus**. TCC de Sistemas para Internet,
feito por uma dupla, com prazo curto: priorize simplicidade, código limpo e bem
testado em vez de muitas funcionalidades.

O diferencial técnico é a busca por distância geográfica real até o campus (não
apenas filtro por cidade/bairro). Essa parte deve ser bem implementada e testada.

## Escopo do MVP

- Cadastro e autenticação com validação de e-mail institucional (domínio)
- Cadastro de campi (nome, latitude/longitude)
- Cadastro de anúncios (endereço, preço, tipo, fotos, descrição)
- Geocodificação automática do endereço do anúncio (Nominatim)
- Busca/listagem com filtros: preço, tipo de vaga, distância até o campus
- Mapa interativo com anúncios e localização do campus
- Contato via link direto (WhatsApp ou e-mail), sem chat interno

**Fora do escopo** (não implementar sem pedido explícito): chat em tempo real,
avaliações/reputação, painel admin completo, notificações, score de
compatibilidade.

## Stack

- TypeScript em tudo; Next.js (App Router) + React
- PostgreSQL + PostGIS para distância (fallback: Haversine); ORM Prisma
- Better Auth (e-mail e senha), com validação de domínio institucional
- Zod para validação; React Hook Form nos formulários
- Tailwind CSS + shadcn/ui
- Leaflet + OpenStreetMap; geocodificação via Nominatim
- Imagens: Cloudinary (upload direto do navegador com assinatura do servidor)
- Testes: Vitest (unitários), Playwright (E2E)
- Docker + Docker Compose (app, Postgres, Mailpit); app opcional via `--profile app`
- CI: GitHub Actions (`.github/workflows/ci.yml`): lint, Prettier, `tsc --noEmit`, testes e
  build

Prefira soluções simples e bem documentadas; o time (2 pessoas) mantém tudo
sozinho.

## Convenções do código

- Setup, scripts e estrutura de pastas: ver `README.md`. Tarefas: `docs/TAREFAS.md`.
- Antes de commitar: `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test`.
- Prisma 7: config em `prisma.config.ts`, client gerado em `src/generated/prisma`
  (importar de `@/generated/prisma/client`), instância única em `src/lib/prisma.ts`.
- Coordenadas em colunas `latitude`/`longitude`; distância via PostGIS em SQL.
  `src/lib/geo/distance.ts` tem Haversine para exibição/fallback.
- Preços em centavos (`priceCents`).
- WhatsApp guardado só com dígitos e DDI (`5586999998888`):
  `normalizeWhatsapp`/`formatWhatsapp` em `src/lib/profile/whatsapp.ts`.
- Fotos: `src/lib/cloudinary/`. O servidor assina o upload fixando o
  `public_id`; o navegador envia direto ao Cloudinary; ao salvar, confira a URL
  (ex: `isOwnAvatarUrl`). Sem as variáveis `CLOUDINARY_*` o upload fica
  desativado e o resto funciona.
- Server Actions: sempre conferir a sessão (`getSession()`) e validar com Zod
  dentro da action; podem ser chamadas direto por POST.
- Seed: dados em `src/lib/seed/universities.ts` (com fonte de cada domínio e
  coordenada), script em `prisma/seed.ts`, `npm run db:seed`. Só adicionar
  universidade com domínio de e-mail de aluno confirmado em fonte oficial.
- Auth: config em `src/lib/auth/server.ts`, cliente em `src/lib/auth/client.ts`,
  rotas em `/api/auth/*`. Domínios permitidos = `University.emailDomain`; a
  checagem roda no hook `databaseHooks.user.create.before` (servidor).
- Sessão no servidor: `getSession()` de `src/lib/auth/session.ts`; no navegador,
  `authClient.useSession()`. Após login/logout, `router.refresh()`.
- Login exige e-mail confirmado (`requireEmailVerification`): sem isso não há
  sessão. E-mails em `src/lib/email/` (nodemailer; em dev caem no Mailpit).
- Páginas que exigem login: acrescentar no `matcher` de `src/proxy.ts` (checagem
  rápida pelo cookie, manda para `/login?next=...`) **e** conferir
  `getSession()` na página. Caminhos e `safeRedirectPath` em
  `src/lib/auth/routes.ts` (nunca redirecionar para `next` sem validar).
- Respostas de auth não revelam se um e-mail existe (cadastro repetido e
  "esqueci minha senha" mostram a mesma mensagem; o aviso vai por e-mail).
- Feedback de ações (salvou, enviou, saiu): toast do `sonner`
  (`import { toast } from "sonner"`); erros de campo ficam no formulário.
- Depois de mudar o schema, `npm run db:migrate` (já roda o `prisma generate`;
  no Prisma 7 o `migrate dev` sozinho não regenera o client).
- Componentes de UI: `npx shadcn@latest add <nome>` (vão para `src/components/ui`).
- Testes unitários ao lado do código (`*.test.ts`); E2E em `e2e/` (precisam do
  banco com seed e do Mailpit; links dos e-mails via `e2e/support/mailpit.ts`).

## Fluxo Git

- Apenas duas branches: `main` (estável) e `dev` (integração). **Sem branches de
  feature.**
- Commits e push direto na `dev`.
- A `main` só recebe mudanças via PR `dev → main`, com CI passando. Nunca fazer
  push direto na `main`.
- Commits e PRs sem atribuição ao Claude (configurado em `.claude/settings.json`).
- PRs usam o template em `.github/pull_request_template.md`.

## Idioma

Comunicação, documentação, mensagens de commit e textos da interface em
português (pt-BR).
