# Secrets do GitHub Actions — GIUCAR

Para que os workflows de CI/CD funcionem corretamente, configure os seguintes secrets no repositório do GitHub:

## Registry de Containers (obrigatório para push)

- `REGISTRY_USERNAME` — usuário do registry (ex: usuário do Docker Hub).
- `REGISTRY_PASSWORD` — senha ou token de acesso do registry.

> O workflow `deploy.yml` faz push para `docker.io/giucar/api` e `docker.io/giucar/admin-web`.
> Se quiser usar outro registry (GHCR, ECR, GCR), ajuste a variável `REGISTRY` no workflow.

## AWS (opcional — apenas se for usar o deploy para ECS)

- `AWS_ACCESS_KEY_ID` — access key da conta AWS.
- `AWS_SECRET_ACCESS_KEY` — secret key da conta AWS.
- `AWS_REGION` — região dos recursos (ex: `us-east-1`).

## Outros secrets úteis para produção

- `DATABASE_URL` — URL de conexão com Postgres em produção.
- `JWT_SECRET` — secret para assinatura de tokens.
- `REFRESH_TOKEN_SECRET` — secret para refresh tokens.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — se usar Stripe.
- `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` — para notificações push.
- `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — para upload de fotos.

## Como configurar

1. No GitHub, vá em **Settings → Secrets and variables → Actions**.
2. Clique em **New repository secret**.
3. Adicione cada secret com nome e valor correspondentes.

## Workflows existentes

- `.github/workflows/ci.yml` — roda lint, typecheck, testes e build em PRs/pushs para `main` e `develop`.
- `.github/workflows/deploy.yml` — builda, gera imagens Docker e faz push no merge para `main`.

