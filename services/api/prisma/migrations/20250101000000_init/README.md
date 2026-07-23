# How to generate and run Prisma migrations

## Development

1. Start the local database:

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

2. Create `services/api/.env` if it does not exist:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lavagem_domicilio?schema=public"
```

3. Generate a new migration after changing `schema.prisma`:

```bash
./scripts/migrate-dev.sh nome_da_migracao
```

Or manually:

```bash
cd services/api
pnpm exec prisma migrate dev --name nome_da_migracao
```

## Production

Migrations are applied automatically when the API container starts (see `services/api/Dockerfile`).

To apply manually:

```bash
./scripts/migrate-prod.sh
```

Or manually:

```bash
cd services/api
pnpm exec prisma migrate deploy
```

## CI/CD

The GitHub Actions workflow runs `pnpm build` but does not execute migrations.
Migrations are executed at container startup in production environments.

