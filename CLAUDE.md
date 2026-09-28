@AGENTS.md

# UniTeto

Plataforma web de busca de moradia estudantil (quartos, vagas em repúblicas,
quitinetes) por **proximidade real ao campus**. TCC de Sistemas para Internet,
feito por uma dupla, com prazo curto: priorize simplicidade, código limpo e bem
testado em vez de muitas funcionalidades.

O diferencial técnico é a busca por distância geográfica real até o campus (não
apenas filtro por cidade/bairro). Essa parte deve ser bem implementada e testada.

## Escopo do MVP

- Cadastro e autenticação com dois papéis (decisão de 28/09/2026, #40):
  - **Estudante**: só e-mail institucional (domínio de universidade
    cadastrada), vinculado à universidade
  - **Anunciante**: qualquer e-mail confirmado, sem universidade
- Cadastro de campi (nome, latitude/longitude)
- Cadastro de anúncios (endereço, preço, tipo, fotos, descrição) pelos **dois
  papéis** (estudante anuncia vaga em república)
- Geocodificação automática do endereço do anúncio (Nominatim)
- Busca/listagem com filtros: preço, tipo de vaga, distância até o campus
- Mapa interativo com anúncios e localização do campus
- **Busca, mapa e endereço completo são públicos** (sem login)
- Contato via link direto (WhatsApp ou e-mail), sem chat interno, **só para
  estudante logado**; decidido no servidor (telefone e e-mail não vão no
  HTML/JSON para visitante nem anunciante)

Tarefas e decisões de produto: `docs/TAREFAS.md` (espelha as issues do GitHub).

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
- Coordenadas em colunas `latitude`/`longitude`; distância via PostGIS em SQL,
  montando o ponto **sempre** com `geoPoint("alias")` de `src/lib/geo/sql.ts`
  (ex: `src/lib/geo/campus-distance.ts`). É a mesma expressão do índice GIST
  `Listing_location_idx`: escrita diferente, o índice deixa de ser usado. `src/lib/geo/distance.ts` tem Haversine,
  `metersToKm` e `formatDistance` para exibição/fallback.
- Geocodificação: `geocodeAddress` de `src/lib/geo/geocode.ts` (Nominatim, fila
  de 1 req/s, cache em memória). Passe bairro e CEP: o número costuma não
  estar no OSM e eles escolhem o trecho certo da rua; o bairro também é o plano
  B quando a rua não existe no OSM. Retorna `null` se não achar e lança
  `GeocodingError` se o serviço falhar. `precision`: `"numero"` (exato),
  `"rua"` (número não encontrado) ou `"bairro"` (centro do bairro); avise o
  usuário nos dois últimos. Não há plano B por CEP: o Nominatim devolve o
  centro da cidade para CEPs de Teresina. UFs em `src/lib/geo/states.ts`.
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
- Papéis: `role` (`ESTUDANTE` | `ANUNCIANTE`) no `User`, regras em
  `src/lib/auth/roles.ts`. Escolhido no cadastro e **não muda depois** (o hook
  `databaseHooks.user.update.before` barra, senão um anunciante viraria
  estudante pela rota `/api/auth/update-user`). Checar permissões pelo papel
  da sessão (`session.user.role`), nunca por dado vindo do navegador.
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
- Testes de integração com o banco (ex: consultas PostGIS): `*.int.test.ts`,
  rodam com `npm run test:integration` (fora do `npm run test`; no CI, no job
  `e2e`). Criam dados com prefixo único e apagam no `afterAll`.

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
