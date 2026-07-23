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
COPY packages ./packages

WORKDIR /app/apps/admin-web

ENV NEXT_TELEMETRY_DISABLED=1
ENV API_URL=http://localhost:3001/api/v1

RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003

# Copy standalone output from Next.js
COPY --from=builder /app/apps/admin-web/.next/standalone ./
COPY --from=builder /app/apps/admin-web/.next/static ./.next/static
COPY --from=builder /app/apps/admin-web/public ./public

EXPOSE 3003

CMD ["node", "server.js"]

