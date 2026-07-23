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
COPY packages ./packages

# Instala apenas as dependências da API
RUN pnpm install --frozen-lockfile=false --filter api

# -----------------------------------------------------------------------------
# Stage 2: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/api/node_modules ./services/api/node_modules
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json* ./
COPY services/api ./services/api
COPY apps/admin-web/package.json ./apps/admin-web/
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

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copia apenas o necessário para rodar em produção
COPY --from=builder /app/services/api/dist ./dist
COPY --from=builder /app/services/api/package.json ./
COPY --from=builder /app/services/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api/node_modules ./node_modules_local

# Expõe a porta da aplicação
EXPOSE 3001

# Comando de inicialização: aplica migrations e sobe o servidor
CMD ["sh", "-c", "pnpm db:migrate:prod && node dist/main.js"]

