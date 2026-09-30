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
- Preços em centavos (`priceCents`); na tela, reais ("650,00") com
  `parsePriceToCents`/`formatPrice` de `src/lib/listings/price.ts`.
- Anúncios: regras em `src/lib/listings/` (schema Zod compartilhado entre
  formulário e Server Action, `createListing` valida, geocodifica e salva).
  Sem coordenadas o anúncio não é salvo. CEP guardado só com dígitos.
- Endereço pelo CEP: o formulário consulta o ViaCEP no navegador
  (`lookupZipCode` de `src/lib/listings/via-cep.ts`) e preenche rua, bairro,
  cidade e estado; cidade e estado começam vazios. O schema confere se o CEP
  é do estado escolhido (`stateForZipCode`, faixas dos Correios), sem depender
  do ViaCEP. Nos E2E o ViaCEP é interceptado (`e2e/support/via-cep.ts`).
- WhatsApp guardado só com dígitos e DDI (`5586999998888`):
  `normalizeWhatsapp`/`formatWhatsapp` em `src/lib/profile/whatsapp.ts`.
- Fotos: `src/lib/cloudinary/`. O servidor assina o upload fixando o
  `public_id` (`signImageUpload`); o navegador envia direto ao Cloudinary
  (`uploadImage`, que valida formato e tamanho); ao salvar, confira a URL
  (`isOwnAvatarUrl`, `isListingPhotoUrl`). Fotos de anúncio ficam em
  `uniteto/listings/<id>/`, até `MAX_LISTING_PHOTOS`, com `position` 0 = capa.
  Sem as variáveis `CLOUDINARY_*` o upload fica desativado e o resto funciona.
  Nos E2E o envio é interceptado no navegador (`e2e/support/cloudinary.ts`).
- Formulário do anúncio compartilhado entre criar e editar
  (`src/app/anuncios/listing-form.tsx`); editar usa `updateListing`, que só
  geocodifica de novo se o endereço mudou (`addressChanged`). Caminhos das
  páginas em `src/lib/auth/routes.ts` (`editListingPath`, `listingPhotosPath`,
  `MY_LISTINGS_PATH`).
- Precisão da localização guardada em `Listing.locationPrecision` (mesmos
  valores de `geocodeAddress`). A página do anúncio avisa quando é aproximada
  (`publicLocationNotice`) e o mapa desenha uma área
  (`APPROXIMATE_RADIUS_METERS`) em vez do ponto.
- Anúncio sem fotos aparece na busca; ao terminar sem fotos, o aviso
  `NoPhotosConfirm` (`src/app/anuncios/no-photos-confirm.tsx`) pergunta se
  quer continuar (menos confiança). As fotos só entram depois de publicar.
- Limites de anúncio em `src/lib/listings/limits.ts`: até
  `MAX_LISTINGS_PER_USER` por conta e `listingSubmitBlocked` (envios por
  pessoa em 10 min, em memória via `src/lib/rate-limit.ts`), checados nas
  Server Actions de criar e editar. Protegem a fila do Nominatim.
- Página pública do anúncio: `src/app/anuncios/[id]/page.tsx` (`listingPath`).
  Pausado só aparece para o dono (outros: 404). Contato: `contactBlockFor` e
  `listingContact` de `src/lib/listings/contact.ts`; sem permissão, o e-mail e
  o WhatsApp do dono nem são buscados no banco. Distância aos campi com
  `getCampusDistancesToListing`.
- Mapa: `src/components/map/` (react-leaflet, só no navegador via
  `LazyListingMap` e `LazySearchMap`, com `ssr: false`). Cores, tiles e
  enquadramento comuns em `map-parts.tsx`. O mapa da busca (`search-map.tsx`,
  usado por `src/app/busca/results-map.tsx`) mostra só os anúncios da página
  atual; nos E2E os marcadores são `path.search-map-listing`. Marcadores em `CircleMarker`, sem o
  ícone padrão do Leaflet (as imagens dele não vêm com o bundler). Nos E2E os
  tiles do OSM são bloqueados com `context.route`.
- Ações sobre um anúncio (fotos, editar, pausar, excluir): começar com
  `requireOwnedListing(id)` de `src/lib/listings/ownership.ts`; páginas do dono
  usam `findFirst({ where: { id, ownerId } })` e `notFound()` para os outros.
- Server Actions: sempre conferir a sessão (`getSession()`) e validar com Zod
  dentro da action; podem ser chamadas direto por POST.
- Seed: dados em `src/lib/seed/universities.ts` (com fonte de cada domínio e
  coordenada), script em `prisma/seed.ts`, `npm run db:seed`. Só adicionar
  universidade com domínio de e-mail de aluno confirmado em fonte oficial.
- Busca: `src/lib/search/`. `parseSearchFilters` lê os filtros da URL
  (`campus`, `raio` em km, `precoMin`/`precoMax` em reais, `tipo`, `pagina`;
  valor inválido é ignorado) e `searchQueryString` monta os links.
  `searchListings` devolve só anúncios ativos: com campus, filtra por
  `ST_DWithin` e ordena por distância; sem campus, por mais recentes e sem
  distância. Decisões em `docs/TAREFAS.md`. Página pública em `/busca`
  (`SEARCH_PATH`, `src/app/busca/`; links com `searchUrl`): campus que não
  existe vira busca sem campus e página além da última redireciona para a
  última. Estudante sem `?campus=` é redirecionado para o campus da
  universidade dele; `campus=todos` (`NO_CAMPUS`) marca que ele escolheu ver
  todos. A página inicial mostra 6 destaques com a mesma consulta e o mesmo
  card (`ListingCard`). Filtros em `src/app/busca/search-form.tsx`: os seletores aplicam na
  hora e o preço ao enviar; a página troca a `key` do formulário quando a URL
  muda. Nos E2E, ache o anúncio do teste por um preço exclusivo
  (`publishListing(page, { price })` e `?precoMin=&precoMax=`), porque os
  títulos se repetem. Os testes de integração isolam os
  dados deles por uma faixa de preço exclusiva (o banco pode ter o seed de
  demonstração).
- Anúncios de demonstração: `npm run db:seed-demo` (`-- --remove` apaga),
  dados em `src/lib/seed/demo-listings.ts` (ruas e CEPs reais, imóveis
  fictícios, donos sem senha em `uniteto.example`). Grava direto no banco, sem
  Nominatim; para acrescentar, geocodifique a rua antes e copie o resultado.
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
- Erros inesperados: `src/app/error.tsx` (dentro do layout) e
  `global-error.tsx`, ambos com `ErrorState`. O cabeçalho usa
  `getSessionOrNull()` para não derrubar o layout com o banco fora do ar.
  Nunca envolver `headers()`/`cookies()`/`redirect()`/`notFound()` num
  `try/catch` que engole o erro: o Next usa erros internos para saber que a
  página é dinâmica (ou chame `headers()` fora do `try`, como em
  `getSessionOrNull`). `loading.tsx` (esqueleto com `Skeleton`) só em páginas sem
  `notFound()`: com ele a resposta começa a ser enviada como 200 e o 404 vira
  200 (por isso as páginas de anúncio não têm).
- Login exige e-mail confirmado (`requireEmailVerification`): sem isso não há
  sessão. E-mails em `src/lib/email/` (nodemailer; em dev caem no Mailpit).
- Páginas que exigem login: acrescentar no `matcher` de `src/proxy.ts` (checagem
  rápida pelo cookie, manda para `/login?next=...`) **e** conferir
  `getSession()` na página. Caminhos e `safeRedirectPath` em
  `src/lib/auth/routes.ts` (nunca redirecionar para `next` sem validar).
- Excluir conta (LGPD): Server Action `deleteMyAccount` (perfil) com
  `deleteAccount` de `src/lib/account/delete-account.ts`: senha obrigatória,
  limite de tentativas, apaga as imagens no Cloudinary depois. A rota HTTP
  `/api/auth/delete-user` fica em `disabledPaths` (sem senha ela aceitaria
  sessão recente). Anúncios, fotos e sessões saem em cascata no banco.
- Política de privacidade em `/privacidade` (`PRIVACY_PATH`): descreve o que
  o sistema faz de fato. Ao guardar um dado novo, mudar quem vê algo ou usar
  outro serviço externo, atualize a página.
- Respostas de auth não revelam se um e-mail existe (cadastro repetido e
  "esqueci minha senha" mostram a mesma mensagem; o aviso vai por e-mail).
- Feedback de ações (salvou, enviou, saiu): toast do `sonner`
  (`import { toast } from "sonner"`); erros de campo ficam no formulário.
- Depois de mudar o schema, `npm run db:migrate` (já roda o `prisma generate`;
  no Prisma 7 o `migrate dev` sozinho não regenera o client) e **reinicie o
  `npm run dev`**: ele guarda o client antigo na memória ("Unknown argument").
  Se o `next dev` reclamar de um arquivo que foi movido ("Can't resolve"),
  apague o cache `.next/dev` e suba de novo.
- Componentes de UI: `npx shadcn@latest add <nome>` (vão para `src/components/ui`).
- Testes unitários ao lado do código (`*.test.ts`); E2E em `e2e/` (precisam do
  banco com seed e do Mailpit; links dos e-mails via `e2e/support/mailpit.ts`).
  O Playwright sobe um Nominatim falso (`e2e/support/nominatim-mock.mjs`);
  com um `npm run dev` já aberto ele é reaproveitado e usa o Nominatim real,
  então os endereços dos testes funcionam nos dois.
- Os E2E apagam as contas que criaram no fim (`e2e/global-teardown.ts` →
  `npm run db:clean-e2e`, só e-mails no padrão `E2E_EMAIL` de
  `e2e/support/e2e-email.ts`). Crie contas de teste sempre com `uniqueEmail`.
- Fotos sem uso no Cloudinary: `npm run cloudinary:cleanup` (só lista; apaga
  com `-- --apply`). Só rodar com o banco dono daquela conta do Cloudinary.
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
