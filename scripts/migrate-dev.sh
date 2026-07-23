#!/bin/sh
set -e

# Gera uma nova migração do Prisma a partir do schema atual.
# Requer Docker rodando com Postgres (infra/docker/docker-compose.dev.yml)
# e DATABASE_URL configurado em services/api/.env

cd "$(dirname "$0")/../services/api"

if [ ! -f .env ]; then
  echo "Crie o arquivo services/api/.env com DATABASE_URL antes de continuar."
  echo "Exemplo:"
  echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lavagem_domicilio?schema=public"'
  exit 1
fi

# Carrega variáveis do .env se existirem
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Gerando migração..."
pnpm exec prisma migrate dev --name "$1"

echo "Migração gerada com sucesso."

