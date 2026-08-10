# syntax=docker/dockerfile:1

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json* ./
COPY apps/admin-web/package.json ./apps/admin-web/
COPY services/api/package.json ./services/api/
RUN mkdir -p packages
COPY packages ./packages

RUN pnpm install --frozen-lockfile=false --filter admin-web

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin-web/node_modules ./apps/admin-web/node_modules
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml turbo.json* ./
COPY apps/admin-web ./apps/admin-web
COPY services/api/package.json ./services/api/
RUN mkdir -p packages
COPY packages ./packages

WORKDIR /app/apps/admin-web

ENV NEXT_TELEMETRY_DISABLED=1

# docker-compose.yml passa --build-arg API_URL (porta 3000, a que o
# serviço api de fato expõe) — sem declarar o ARG aqui, esse valor era
# descartado silenciosamente e o build sempre embutia o default
# hardcoded (porta 3001, que não existe), quebrando toda chamada do
# browser em runtime (ERR_CONNECTION_REFUSED).
ARG API_URL=http://localhost:3000/api/v1
ENV API_URL=$API_URL

RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003

# Output "standalone" do Next.js preserva a estrutura de diretórios do
# monorepo (é um workspace pnpm) — server.js fica em
# apps/admin-web/server.js, não em ./server.js na raiz. static/ e
# public/ (não incluídos no standalone) precisam ir pro mesmo caminho
# aninhado, senão o Next não os encontra em runtime.
COPY --from=builder /app/apps/admin-web/.next/standalone ./
COPY --from=builder /app/apps/admin-web/.next/static ./apps/admin-web/.next/static
COPY --from=builder /app/apps/admin-web/public ./apps/admin-web/public

EXPOSE 3003

CMD ["node", "apps/admin-web/server.js"]

