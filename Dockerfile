# Imagem de desenvolvimento da aplicação (usada pelo serviço `app` do docker-compose).
# O código é montado como volume, então alterações nos arquivos recarregam a página.
FROM node:24-slim

WORKDIR /app

# O Prisma precisa do OpenSSL para rodar as migrations
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Instala as dependências primeiro para aproveitar o cache do Docker.
# O `postinstall` gera o Prisma Client, que precisa do schema e da config.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

# Aplica as migrations pendentes, popula universidades/campi (sem duplicar)
# e sobe o servidor de desenvolvimento
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run dev"]
