# Divisão de tarefas do MVP

A base do projeto está pronta (Next.js, Prisma + PostGIS, shadcn/ui, Vitest,
Playwright, Docker Compose e CI). As tarefas abaixo estão divididas em duas
frentes que podem andar em paralelo com pouco conflito de arquivos.

Marque `[x]` ao concluir. Como os dois trabalham direto na `dev`, façam
`git pull` antes de começar e commits pequenos e frequentes.

## Frente A — Usuários, autenticação e campi

- [x] Escolher a biblioteca de auth (Auth.js ou Better Auth) e registrar a decisão
      no `CLAUDE.md`
- [x] Adicionar as tabelas de auth ao `prisma/schema.prisma` e gerar a migration
- [x] Cadastro/login com verificação por e-mail (usando o Mailpit em dev)
- [x] Validar o domínio do e-mail contra `University.emailDomain` e vincular o
      usuário à universidade
- [x] Página de perfil (nome, WhatsApp e foto)
- [ ] Proteger as rotas que exigem login (criar/editar anúncio)
- [x] Seed (`prisma/seed.ts`) com universidades e campi reais, com coordenadas
- [ ] Layout base: cabeçalho, navegação e estado logado/deslogado

## Frente B — Anúncios, busca por distância e mapa

- [ ] Serviço de geocodificação com Nominatim (`src/lib/geo/`), com testes e
      respeitando a política de uso (User-Agent e 1 requisição/s)
- [ ] Formulário de criar/editar anúncio (React Hook Form + Zod), com
      geocodificação do endereço ao salvar
- [ ] Upload de fotos dos anúncios (Cloudinary já escolhido e configurado na
      foto de perfil: reaproveitar `src/lib/cloudinary/`)
- [ ] Consulta de busca com PostGIS: filtro por raio até o campus, preço e tipo,
      ordenada por distância (`ST_DWithin` / `ST_Distance` sobre `geography`)
- [ ] Testes de integração da busca por distância (o diferencial do TCC)
- [ ] Página de listagem com filtros
- [ ] Mapa com Leaflet + OpenStreetMap mostrando o campus e os anúncios
- [ ] Página de detalhe do anúncio com links de contato (WhatsApp / e-mail)

Enquanto a Frente A não termina o login, a Frente B pode usar um usuário de
teste criado direto no banco (Prisma Studio: `npm run db:studio`).

## Compartilhadas / finais

- [ ] Rodar os testes E2E (Playwright) no CI
- [x] Dockerfile da aplicação e serviço `app` no `docker-compose.yml`
- [ ] Testes E2E dos fluxos principais: cadastro → criar anúncio → buscar
- [ ] Deploy (definir onde)
