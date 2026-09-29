# Divisão de tarefas do MVP

A base do projeto está pronta (Next.js, Prisma + PostGIS, shadcn/ui, Vitest,
Playwright, Docker Compose e CI). As tarefas pendentes seguem as issues do
GitHub, organizadas por milestone (Fase 4, 5 e 6); os critérios de aceite de
cada uma estão na própria issue.

Marque `[x]` ao concluir. Como os dois trabalham direto na `dev`, façam
`git pull` antes de começar e commits pequenos e frequentes.

## Decisões de produto (28/09/2026)

Quem aluga imóvel geralmente não é estudante, então o cadastro passa a ter dois
papéis (#40):

| Papel          | E-mail aceito                              | Pode anunciar | Vê o contato dos anúncios |
| -------------- | ------------------------------------------ | ------------- | ------------------------- |
| **Estudante**  | Só institucional (universidade cadastrada) | Sim           | Sim (logado)              |
| **Anunciante** | Qualquer e-mail, confirmado                | Sim           | Não                       |
| Visitante      | —                                          | Não           | Não                       |

- **Estudante também anuncia** (ex: vaga que abriu na república onde mora).
- **Busca, mapa e endereço completo são públicos**, sem login.
- **O contato (WhatsApp e e-mail) só aparece para estudante logado**, e essa
  decisão é tomada no servidor (o telefone não vai no HTML para os demais).
  É o que dá sentido ao e-mail institucional: quem anuncia sabe que quem entra
  em contato é estudante.

## Concluído

- [x] Better Auth com e-mail e senha, confirmação por e-mail e "esqueci minha
      senha" (#17, #18, #19)
- [x] Validação do domínio institucional contra `University.emailDomain`,
      vinculando o usuário à universidade (#17)
- [x] Página de perfil com nome, WhatsApp e foto (Cloudinary) (#20)
- [x] Rotas protegidas (`src/proxy.ts`) e layout base com estado de login
- [x] Seed com universidades e campi reais de Teresina (#21)
- [x] Geocodificação com Nominatim, com plano B pelo bairro (#22)
- [x] Distância anúncio–campus com PostGIS, helper `geoPoint` e índice espacial
      (#23)
- [x] Docker (#33), Vitest (#34) e E2E de autenticação no CI

## Fase 4 — Anúncios

- [x] #40 Escolha de papel no cadastro (estudante ou anunciante). O
      anunciante já entra em "Meus anúncios"; falta levar o estudante para a
      busca quando ela existir (#28, `homeForRole` em `src/lib/auth/routes.ts`)
- [x] #24 Criar anúncio (`/anuncios/novo`). Depois de publicar mostra um
      resumo com "Adicionar fotos" e "Ver meus anúncios"
- [x] #25 Fotos do anúncio (`/anuncios/<id>/fotos`). E2E com Cloudinary falso
      e testado com a conta real (envio, capa, remoção e foto de perfil)
- [x] #42 Página "Meus anúncios" (`/meus-anuncios`). Falta o botão "Ver" o
      anúncio, que depende da página de detalhes (#27)
- [x] #26 Editar (`/anuncios/<id>/editar`), pausar/reativar e excluir o
      próprio anúncio
- [ ] #27 Página de detalhes do anúncio (pública)

## Fase 5 — Busca

- [ ] #41 Consulta de busca com PostGIS e testes de integração — **o
      diferencial do TCC**; base das demais tarefas da fase
- [ ] #28 Listagem pública com paginação
- [ ] #29 Filtro por distância até o campus (campus do estudante pré-selecionado)
- [ ] #30 Filtros de preço e tipo de vaga
- [ ] #31 Mapa com Leaflet + OpenStreetMap
- [ ] #32 Botão de contato (só para estudante logado)

## Fase 6 — Qualidade e entrega

- [ ] #35 E2E dos fluxos principais: anunciante cria anúncio, visitante busca
      sem ver o contato, estudante busca e vê o contato
- [ ] #36 Deploy (banco com PostGIS, SMTP real, variáveis de ambiente)
