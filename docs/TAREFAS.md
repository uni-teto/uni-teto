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

## Decisões da busca (30/09/2026)

- **Sem campus escolhido** (visitante ou anunciante): lista os anúncios ativos
  do mais recente para o mais antigo, sem distância, com o seletor de campus
  em destaque. A página pública nunca fica vazia por falta de campus.
- **Localização aproximada** (precisão "bairro"): o anúncio entra na busca por
  raio normalmente, e o card marca a distância como aproximada ("≈ 1,2 km").
- **Paginação** por número de página na URL (`?pagina=2`), ordenada por
  distância e, no empate, pelo id.
- **Raios**: 1, 2, 5 e 10 km, mais "qualquer distância" (senão os anúncios de
  Timon nunca apareceriam para quem busca pela UFPI).

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
      anunciante já entra em "Meus anúncios" e o estudante na busca
      (`homeForRole` em `src/lib/auth/routes.ts`)
- [x] #24 Criar anúncio (`/anuncios/novo`). Depois de publicar mostra um
      resumo com "Adicionar fotos" e "Ver meus anúncios"
- [x] #25 Fotos do anúncio (`/anuncios/<id>/fotos`). E2E com Cloudinary falso
      e testado com a conta real (envio, capa, remoção e foto de perfil)
- [x] #42 Página "Meus anúncios" (`/meus-anuncios`), com "Ver", "Editar",
      "Fotos", "Pausar" e "Excluir"
- [x] #26 Editar (`/anuncios/<id>/editar`), pausar/reativar e excluir o
      próprio anúncio
- [x] #27 Página de detalhes do anúncio (`/anuncios/<id>`, pública): fotos,
      endereço, mapa, distância até o campus (`?campus=` ou os da universidade
      do estudante) e contato. Pausado só o dono vê; os outros recebem 404

### Melhorias da Fase 4

- [x] Endereço preenchido pelo CEP (ViaCEP) e checagem de CEP × estado no
      servidor. Motivo: um endereço de Timon (MA) foi salvo como Teresina (PI),
      que vinha pré-preenchida, e caiu num bairro homônimo de Teresina
- [x] Os E2E apagam as contas e anúncios que criaram (`npm run db:clean-e2e`)
- [x] Precisão da localização guardada (`locationPrecision`); a página do
      anúncio avisa e o mapa mostra uma área quando é aproximada
- [x] Limite de 20 anúncios por conta e de 10 envios a cada 10 minutos
      (protege a fila do Nominatim)
- [x] Prévia do link (Open Graph), preço/contato antes do mapa no celular,
      confirmação com `AlertDialog` ao excluir e `npm run cloudinary:cleanup`
- [x] Anúncio sem fotos continua aparecendo na busca, mas terminar sem fotos
      (sair do resumo depois de publicar ou "Concluir" na página de fotos)
      pede confirmação avisando que passa menos confiança (decisão de
      29/09/2026)
- [x] Páginas de erro em português (`error.tsx`, `global-error.tsx`) e
      esqueleto de carregamento em Meus anúncios
- [x] LGPD: "Excluir minha conta" no perfil (com senha; apaga anúncios,
      fotos no Cloudinary e sessões) e política de privacidade (`/privacidade`)
- Fora do MVP (decisão de 29/09/2026): pedir ao dono, de tempos em tempos,
  que confirme que a vaga continua disponível

## Fase 5 — Busca

- [x] Anúncios de demonstração (`npm run db:seed-demo`): 40 anúncios em ruas
      reais de Teresina e Timon, em volta da UFPI e da UESPI, para ver a busca,
      os filtros e o mapa com dados

- [x] #41 Consulta de busca com PostGIS e testes de integração — **o
      diferencial do TCC**; base das demais tarefas da fase. `searchListings` e
      os filtros da URL (`parseSearchFilters`) em `src/lib/search/`
- [x] #28 Listagem pública com paginação (`/busca`): cards com capa, preço,
      tipo e distância, campus escolhido por links (o seletor com raio é a
      #29), estado vazio e filtros na URL. O estudante cai nela ao entrar
- [x] #29 Filtro por distância até o campus: seletores de campus e raio
      (`src/app/busca/search-form.tsx`). O estudante entra com o campus da
      universidade dele; se escolher "todos os campi", a URL guarda
      `campus=todos` para o campus não voltar sozinho
- [x] #30 Filtros de preço e tipo de vaga, no mesmo formulário do campus e do
      raio (`src/app/busca/search-form.tsx`), com "Limpar"
- [x] #31 Mapa dos resultados (`src/components/map/search-map.tsx`): campus,
      raio e um marcador por anúncio da página atual, com resumo e link ao
      clicar. No celular fica atrás do botão "Ver no mapa"
- [x] #32 Botão de contato (só para estudante logado). Entrou com a página do
      anúncio (#27): regra e links em `src/lib/listings/contact.ts`, E2E em
      `e2e/listing-details.spec.ts`. O card da busca (#28) não repete o
      contato: leva à página do anúncio

### Melhorias da Fase 5

- [x] Anúncios na página inicial: os 6 mais recentes; para o estudante
      logado, os 6 mais perto do campus da universidade dele
- [x] Ordenar por menor preço (`?ordem=preco`); no empate vale a distância
      (com campus) ou a data (sem)
- [x] Aviso "Atualizando os resultados..." com a lista esmaecida enquanto a
      busca nova carrega (troca de filtro, de página ou "Limpar")
- [x] O card sob o mouse destaca o marcador no mapa, e o marcador destaca o
      card
- [x] No celular os filtros ficam atrás do botão "Filtros" (aberto quando
      ainda não há campus escolhido)

### Identidade visual (30/09/2026)

Decisões: site em **preto e branco**, como a logo; **só tema claro** (a logo é
preta e some em fundo escuro); repaginada em todas as telas.

- [x] Logo no cabeçalho, no rodapé e no favicon (`public/brand/`, variações
      geradas por `node scripts/build-logo.mjs`)
- [x] Títulos em Poppins, botões em pílula, campos mais altos, cantos mais
      arredondados, fundo cinza claro com cartões brancos
- [x] Página inicial nova: topo com os campi atendidos, destaques, "Como
      funciona" numerado e faixa para quem quer anunciar
- [x] Cards de anúncio, busca, página do anúncio, formulários, perfil, Meus
      anúncios e páginas de erro no mesmo padrão
- [x] Layout inspirado no Airbnb e na referência da dupla (01/10/2026):
      topo com foto e busca em pílula, categorias de tipo de vaga, busca com
      lista e mapa lado a lado e marcadores com o preço, cards sem moldura,
      seção "É sobre a sua jornada" e página do anúncio com mosaico de fotos
      e cartão de contato fixo. Fora (não existe no sistema): favoritos,
      mensagens, reservas, aplicativo e depoimentos
- [x] Fotos nos anúncios de demonstração: 18 imagens geradas por IA, três por
      anúncio, no Cloudinary (`uniteto/demo/`). Funcionam em qualquer máquina
      com `npm run db:seed-demo`

## Fase 6 — Qualidade e entrega

- [ ] #35 E2E dos fluxos principais: anunciante cria anúncio, visitante busca
      sem ver o contato, estudante busca e vê o contato
- [ ] #36 Deploy (banco com PostGIS, SMTP real, variáveis de ambiente)
