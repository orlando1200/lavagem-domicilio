#!/bin/sh
set -e

# Aplica as migrações do Prisma em produção.
# Deve ser executado no container da API no startup (já está no Dockerfile)
# ou manualmente com DATABASE_URL configurado.

cd "$(dirname "$0")/../services/api"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Aplicando migrações em produção..."
pnpm exec prisma migrate deploy

echo "Migrações aplicadas com sucesso."

