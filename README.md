# UniTeto

Plataforma web para estudantes universitários encontrarem moradia (quartos, vagas
em repúblicas, quitinetes) pela **distância real até o campus**. Projeto de TCC
de Sistemas para Internet.

## Stack

Next.js (App Router) · TypeScript · PostgreSQL + PostGIS · Prisma · Tailwind CSS
· shadcn/ui · Zod · React Hook Form · Vitest · Playwright · Prettier · Docker
Compose

## Pré-requisitos

- Node.js 24 (versão em `.nvmrc`)
- Docker Desktop (para o banco e o Mailpit; opcionalmente, também a aplicação)

## Como rodar

```bash
# 1. Instalar dependências (também gera o Prisma Client)
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env

# 3. Subir Postgres/PostGIS e Mailpit
docker compose up -d

# 4. Aplicar as migrations no banco
npm run db:migrate

# 5. Cadastrar universidades e campi iniciais (pode rodar de novo sem duplicar)
npm run db:seed

# 6. Rodar a aplicação em http://localhost:3000
npm run dev
```

E-mails enviados em desenvolvimento aparecem no Mailpit: http://localhost:8025

### Tudo no Docker (opcional)

Para rodar também a aplicação dentro do Docker, sem precisar do Node instalado:

```bash
docker compose --profile app watch
```

Isso sobe app, Postgres e Mailpit, aplica as migrations, roda o seed e copia
para o container cada arquivo salvo (a página recarrega sozinha). Se mudar
`package.json` ou o schema do Prisma, a imagem é reconstruída automaticamente. `Ctrl+C` para sair
e `docker compose --profile app down` para desligar tudo.

No Windows/Mac rodar fora do Docker (`npm run dev`) costuma ser mais rápido; use
o modo acima se preferir não instalar o Node ou para reproduzir o ambiente do
colega.

### Testes E2E (Playwright)

Os testes de `e2e/` usam o navegador de verdade: criam contas, leem os e-mails
de confirmação e de senha no Mailpit e testam login, perfil e páginas
protegidas. Precisam do banco com o seed e do Mailpit rodando (passos 3 a 5 de
"Como rodar"). O Playwright sobe o `npm run dev` sozinho (ou reaproveita o que
já estiver rodando).

```bash
# Só na primeira vez: baixa o Chromium usado nos testes
npx playwright install chromium
```

```bash
npm run test:e2e
```

Se algum falhar, o relatório abre com `npx playwright show-report`. No CI eles
rodam no job `e2e`, com Postgres e Mailpit como serviços.

### Fotos (Cloudinary)

O envio de fotos usa o [Cloudinary](https://cloudinary.com) (plano gratuito).
Sem configurar, o site funciona normalmente e só o botão de foto fica
desativado. Para ativar, crie uma conta, copie o _Cloud name_, a _API Key_ e o
_API Secret_ (Settings → API Keys) para o `.env`:

```bash
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Windows: quebras de linha

O projeto usa LF (ver `.gitattributes`). Se o clone foi feito antes disso e o
`npm run format:check` acusar todos os arquivos, rode uma vez, com as mudanças
já commitadas:

```bash
git rm --cached -r .
```

```bash
git reset --hard
```

Os dois comandos precisam ser rodados em sequência: só o primeiro faz o Git
achar que todos os arquivos foram apagados (se acontecer, `git reset` resolve).

## Scripts

| Comando                | O que faz                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento                                                           |
| `npm run build`        | Build de produção                                                                     |
| `npm run lint`         | ESLint                                                                                |
| `npm run format`       | Formata o código com o Prettier                                                       |
| `npm run format:check` | Verifica a formatação (roda no CI)                                                    |
| `npm run typecheck`    | Checagem de tipos do TypeScript                                                       |
| `npm run test`         | Testes unitários (Vitest)                                                             |
| `npm run test:watch`   | Vitest em modo watch                                                                  |
| `npm run test:e2e`     | Testes ponta a ponta (Playwright). Na primeira vez: `npx playwright install chromium` |
| `npm run db:migrate`   | Cria/aplica migrations e regenera o Prisma Client                                     |
| `npm run db:seed`      | Cadastra universidades e campi iniciais (`src/lib/seed/`)                             |
| `npm run db:generate`  | Regenera o Prisma Client                                                              |
| `npm run db:studio`    | Abre o Prisma Studio para ver os dados                                                |

## Estrutura

```
prisma/              schema e migrations do banco
src/app/             rotas (Next.js App Router)
src/components/ui/   componentes do shadcn/ui (npx shadcn@latest add <nome>)
src/lib/             código compartilhado (prisma, geo, utils)
src/generated/       Prisma Client gerado (não versionado)
e2e/                 testes Playwright
docs/                documentação do projeto
```

## Fluxo de trabalho

- Branches: `main` (estável) e `dev` (integração). Não usamos branches de feature.
- O trabalho do dia a dia vai direto na `dev`.
- A `main` só recebe mudanças por PR `dev → main`, com o CI passando.
- O CI (`.github/workflows/ci.yml`) roda lint, formatação (Prettier), tipos, testes e build.

Divisão de tarefas do MVP: [docs/TAREFAS.md](docs/TAREFAS.md).
