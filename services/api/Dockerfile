# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copia os arquivos de configuração do monorepo
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json* ./
COPY services/api/package.json ./services/api/
COPY apps/admin-web/package.json ./apps/admin-web/
RUN mkdir -p packages
COPY packages ./packages

# Instala apenas as dependências da API
RUN pnpm install --frozen-lockfile=false --filter api

# -----------------------------------------------------------------------------
# Stage 2: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Engines do Prisma (schema-engine/query-engine) linkam contra libssl em
# runtime — node:20-alpine não vem com OpenSSL instalado.
RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/api/node_modules ./services/api/node_modules
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json* ./
COPY services/api ./services/api
COPY apps/admin-web/package.json ./apps/admin-web/
RUN mkdir -p packages
COPY packages ./packages

WORKDIR /app/services/api

# Gera o Prisma Client antes do build
RUN pnpm db:generate

# Builda a aplicação NestJS
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Engines do Prisma (schema-engine/query-engine) linkam contra libssl em
# runtime — node:20-alpine não vem com OpenSSL instalado. Sem isso,
# `prisma migrate deploy` falha com "Could not parse schema engine
# response" (o engine crasha ao subir por falta de libssl.so).
RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Mantém a mesma profundidade de diretório do monorepo (services/api/).
# node_modules/.bin/prisma do pnpm é um symlink relativo (ex.:
# ../../../node_modules/.pnpm/prisma@.../...) calculado pra essa
# profundidade — achatar tudo em /app quebra a resolução do binário
# ("Cannot find module '.../prisma/build/index.js'").
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api ./services/api

WORKDIR /app/services/api

# Expõe a porta da aplicação
EXPOSE 3001

# Comando de inicialização: aplica migrations e sobe o servidor
CMD ["sh", "-c", "pnpm db:migrate:prod && node dist/main.js"]

