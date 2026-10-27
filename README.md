# UniTeto

Plataforma web para estudantes universitários encontrarem moradia (quartos, vagas
em repúblicas, quitinetes) pela **distância real até o campus**. Projeto de TCC
de Sistemas para Internet.

- **Estudantes** se cadastram com o e-mail institucional, buscam moradia e veem
  o contato de quem anuncia.
- **Anunciantes** (proprietários, imobiliárias) se cadastram com qualquer
  e-mail e publicam anúncios. Estudantes também podem anunciar (ex: vaga em
  república).
- A busca e o mapa são públicos; o contato do anúncio só aparece para estudante
  logado.

Decisões e tarefas: [docs/TAREFAS.md](docs/TAREFAS.md).

## Stack

Next.js (App Router) · TypeScript · PostgreSQL + PostGIS · Prisma · Tailwind CSS
· shadcn/ui · Zod · React Hook Form · Vitest · Playwright · Prettier · Docker
Compose

## Pré-requisitos

O site precisa de três coisas rodando ao mesmo tempo:

| O quê                       | Para quê                                                | Porta  |
| --------------------------- | ------------------------------------------------------- | ------ |
| PostgreSQL com PostGIS      | banco de dados (o PostGIS calcula a distância)          | `5432` |
| Mailpit                     | recebe os e-mails de confirmação (sem ele não há login) | `8025` |
| A aplicação (`npm run dev`) | o site em si                                            | `3000` |

Instale antes:

- **Git**
- **Node.js 24** (versão em `.nvmrc`). Confira com `node -v`.
- **Docker Desktop**, que sobe o banco e o Mailpit com um comando. Precisa de
  administrador para instalar e precisa estar **aberto** (ícone da baleia) antes
  de rodar `docker compose`. Confira com `docker --version`.
  Sem Docker (ex: computador do laboratório): veja
  [Rodar sem Docker](#rodar-sem-docker-windows-sem-administrador).

A internet precisa estar ligada: o mapa (OpenStreetMap), a geocodificação dos
endereços (Nominatim), o CEP (ViaCEP) e as fotos (Cloudinary) são serviços
externos.

## Como rodar

Os comandos abaixo funcionam no PowerShell, no Git Bash e no terminal do
VS Code.

```bash
# 1. Baixar o código
git clone https://github.com/uni-teto/uni-teto.git
cd uni-teto

# 2. Instalar dependências (também gera o Prisma Client)
npm install

# 3. Criar o arquivo de variáveis de ambiente
#    (o .env não vem no git; os valores do exemplo já servem para rodar local)
cp .env.example .env

# 4. Subir Postgres/PostGIS e Mailpit (Docker Desktop aberto)
docker compose up -d

# 5. Criar as tabelas no banco
npm run db:migrate

# 6. Cadastrar universidades e campi (pode rodar de novo sem duplicar)
npm run db:seed

# 7. (Opcional) Anúncios de demonstração, com fotos, para ver a busca com dados
#    (as fotos já estão no Cloudinary: não precisa configurar nada)
npm run db:seed-demo

# 8. Rodar a aplicação
npm run dev
```

Abra http://localhost:3000. O terminal do `npm run dev` precisa ficar aberto;
`Ctrl+C` para parar.

### Criar uma conta para testar

Os e-mails não saem de verdade: todos caem no Mailpit
(http://localhost:8025), inclusive para endereços que não existem. Então:

1. Cadastre-se em http://localhost:3000. Para **estudante**, use qualquer
   e-mail com domínio de universidade cadastrada, mesmo inventado (ex:
   `teste@ufpi.edu.br` ou `teste@aluno.uespi.br`). Para **anunciante**,
   qualquer e-mail.
2. Abra o Mailpit, clique no e-mail de confirmação e no link dele.
3. Faça login. Sem confirmar o e-mail o login não funciona.

### Nas próximas vezes

O banco guarda os dados entre uma vez e outra. Basta:

```bash
docker compose up -d   # Docker Desktop aberto
npm run dev
```

`docker compose down` desliga o banco e o Mailpit sem apagar os dados
(`docker compose down -v` apaga tudo e você volta ao passo 5).

### Atualizar uma cópia que já roda

Depois de um `git pull` com mudanças grandes (ex: o merge de uma fase):

```bash
npm install          # dependências novas
npm run db:migrate   # migrations novas (se houver)
npm run db:seed-demo # anúncios de demonstração atualizados, com as fotos
```

E reinicie o `npm run dev`. Se ele reclamar de um arquivo que não existe mais
("Can't resolve"), apague a pasta `.next/dev` e suba de novo.

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

### Rodar sem Docker (Windows, sem administrador)

Para computador onde não dá para instalar o Docker (laboratório, máquina do
trabalho). O PostgreSQL, o PostGIS e o Mailpit têm versão em `.zip` que roda
sem instalar. Use uma pasta **fora do projeto**, ex: `C:\Users\<você>\uniteto-local`.

1. Baixe e extraia nessa pasta:
   - **PostgreSQL 17**, versão _binaries_ (zip):
     https://www.enterprisedb.com/download-postgresql-binaries. Fica uma
     pasta `pgsql`.
   - **PostGIS** para PostgreSQL 17 (o `postgis-bundle-pg17-...x64.zip`):
     https://download.osgeo.org/postgis/windows/pg17/. Copie as pastas `bin`,
     `lib` e `share` dele para dentro de `pgsql`, juntando com as que já
     existem (sem isso dá `extension "postgis" is not available`).
   - **Mailpit** (`mailpit-windows-amd64.zip`):
     https://github.com/axllent/mailpit/releases/latest. É só o `mailpit.exe`.
2. No PowerShell, dentro dessa pasta, crie o banco (só na primeira vez):

   ```powershell
   .\pgsql\bin\initdb.exe -D dados -U uniteto -E UTF8 --locale=C
   .\pgsql\bin\pg_ctl.exe -D dados -l postgres.log start
   .\pgsql\bin\createdb.exe -U uniteto uniteto
   ```

3. Abra outro terminal e deixe o Mailpit rodando:

   ```powershell
   .\mailpit.exe
   ```

   Se o Windows perguntar sobre o firewall, pode cancelar: só o próprio
   computador acessa.

4. Siga [Como rodar](#como-rodar) **pulando o passo 4** (`docker compose`). O
   `.env` do exemplo já aponta para `localhost:5432` e `localhost:1025`.

Nas próximas vezes (depois de reiniciar o computador o banco desliga):

```powershell
.\pgsql\bin\pg_ctl.exe -D dados -l postgres.log start   # na pasta uniteto-local
.\mailpit.exe                                           # em outro terminal
npm run dev                                             # na pasta do projeto
```

Para desligar o banco: `.\pgsql\bin\pg_ctl.exe -D dados stop`. Os dados ficam
na pasta `dados` (apagar a pasta zera o banco).

### Problemas comuns

| Mensagem / sintoma                                                        | O que fazer                                                                                                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker` não é reconhecido                                                | Docker não instalado. Instale o Docker Desktop ou use [Rodar sem Docker](#rodar-sem-docker-windows-sem-administrador).                          |
| `error during connect` / `cannot find the file specified` (no `docker`)   | O Docker Desktop está fechado. Abra e espere ficar "Engine running".                                                                            |
| `Can't reach database server at localhost:5432` (P1001)                   | O banco não está rodando: `docker compose up -d` (ou `pg_ctl ... start` sem Docker).                                                            |
| `port is already allocated` / porta 5432 em uso                           | Já existe outro PostgreSQL na máquina. Pare ele, ou troque a porta no `docker-compose.yml` (`"5433:5432"`) e no `DATABASE_URL` do `.env`.       |
| Erro citando `DATABASE_URL` ou `datasource.url`                           | Falta o `.env`: `cp .env.example .env` na pasta do projeto.                                                                                     |
| `extension "postgis" is not available`                                    | Banco sem PostGIS. Com Docker, a imagem já tem; sem Docker, copie `bin`, `lib` e `share` do PostGIS para dentro do `pgsql`.                     |
| `npm.ps1 cannot be loaded because running scripts is disabled`            | PowerShell bloqueando scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, ou use o Git Bash / Prompt de Comando.                    |
| `cp` não é reconhecido (Prompt de Comando)                                | No `cmd`, use `copy .env.example .env`.                                                                                                         |
| `npm install` reclama da versão (`engines`) ou erros estranhos de sintaxe | Node antigo. Precisa do 24 (`node -v`).                                                                                                         |
| Cadastro diz que o e-mail não é permitido                                 | Faltou o `npm run db:seed`, ou o domínio não é de universidade cadastrada. Use `@ufpi.edu.br` / `@aluno.uespi.br`, ou cadastre como anunciante. |
| E-mail de confirmação não chega                                           | Ele vai para o Mailpit (http://localhost:8025), não para a caixa real. Confira se o Mailpit está rodando.                                       |
| Login dá erro mesmo com a senha certa                                     | E-mail ainda não confirmado: clique no link do e-mail no Mailpit.                                                                               |
| Busca sem nenhum anúncio                                                  | Banco novo, sem dados: `npm run db:seed-demo`.                                                                                                  |
| `Unknown argument` ou erro do Prisma depois de um `git pull`              | `npm install`, `npm run db:migrate` e reinicie o `npm run dev`.                                                                                 |
| `Can't resolve '...'` no `npm run dev`                                    | Cache velho: apague a pasta `.next/dev` e suba de novo.                                                                                         |
| Mapa cinza, sem ruas                                                      | Sem internet, ou a rede bloqueia o OpenStreetMap (comum em rede de instituição).                                                                |

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

No fim, os testes apagam as contas que criaram (e-mails `e2e-...`), junto com
os anúncios, para eles não aparecerem na busca. Se uma rodada for
interrompida no meio, `npm run db:clean-e2e` faz a limpeza.

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

Fotos enviadas e não salvas (página fechada no meio) ficam sobrando no
Cloudinary. `npm run cloudinary:cleanup` lista as que nenhum anúncio ou perfil
usa (com mais de 24 h) e `npm run cloudinary:cleanup -- --apply` apaga.
**Rode só com o banco dono dessa conta do Cloudinary**: se duas pessoas usam
as mesmas chaves com bancos locais diferentes, as fotos de uma parecem
sobrando para a outra. As fotos dos anúncios de demonstração (`uniteto/demo/`)
nunca entram nessa limpeza.

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

| Comando                          | O que faz                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`                    | Servidor de desenvolvimento                                                           |
| `npm run build`                  | Build de produção                                                                     |
| `npm run lint`                   | ESLint                                                                                |
| `npm run format`                 | Formata o código com o Prettier                                                       |
| `npm run format:check`           | Verifica a formatação (roda no CI)                                                    |
| `npm run typecheck`              | Checagem de tipos do TypeScript                                                       |
| `npm run test`                   | Testes unitários (Vitest)                                                             |
| `npm run test:watch`             | Vitest em modo watch                                                                  |
| `npm run test:integration`       | Testes de integração com o banco (PostGIS); precisa do `docker compose up -d`         |
| `npm run test:e2e`               | Testes ponta a ponta (Playwright). Na primeira vez: `npx playwright install chromium` |
| `npm run db:migrate`             | Cria/aplica migrations e regenera o Prisma Client                                     |
| `npm run db:seed`                | Cadastra universidades e campi iniciais (`src/lib/seed/`)                             |
| `npm run db:seed-demo`           | Anúncios de demonstração para a busca (`-- --remove` apaga); ver `src/lib/seed/`      |
| `npm run db:clean-e2e`           | Apaga as contas e anúncios criados pelos testes E2E (já roda no fim do `test:e2e`)    |
| `npm run cloudinary:demo-photos` | Reenvia as fotos dos anúncios de demonstração (só quem tem os originais)              |
| `npm run cloudinary:cleanup`     | Lista as fotos do Cloudinary sem uso; com `-- --apply`, apaga                         |
| `npm run db:generate`            | Regenera o Prisma Client                                                              |
| `npm run db:studio`              | Abre o Prisma Studio para ver os dados                                                |

## Estrutura

```
prisma/              schema e migrations do banco
src/app/             rotas (Next.js App Router)
src/components/ui/   componentes do shadcn/ui (npx shadcn@latest add <nome>)
src/components/map/  mapa (Leaflet + OpenStreetMap), carregado só no navegador
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
