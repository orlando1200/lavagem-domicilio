docker --version  # deve mostrar Docker version
```

## 📦 Instalação

Você pode rodar o projeto de duas formas:

### Opção A - Docker Compose (recomendada para testar rápido)

Suba toda a stack (Postgres, Redis, API e Admin Web) com um único comando:

```bash
cd C:\Users\orlan\Projects\lavagem-domicilio
copy env.docker.example .env.docker
# edite .env.docker se quiser alterar senhas/segredos
docker compose --env-file .env.docker up -d --build
```

Aguarde o build e as migrations. Acesse:
- Admin Web: http://localhost:3003
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs

Para parar:

```bash
docker compose --env-file .env.docker down
```

### Opção B - Desenvolvimento local com Node.js

### 1. Clone ou navegue até o projeto

```bash
cd C:\Users\orlan\Projects\lavagem-domicilio
```

### 2. Instale as dependências

```bash
pnpm install
```

Isso vai instalar todas as dependências do monorepo (backend, admin web, etc).

### 3. Suba o banco de dados e Redis

```bash
cd infra\docker
docker-compose -f docker-compose.dev.yml up -d
```

Aguarde alguns segundos até os containers ficarem prontos. Você pode verificar com:

```bash
docker ps
```

Deve mostrar 2 containers rodando: `lavagem-postgres` e `lavagem-redis`.

### 4. Configure o backend

```bash
cd ..\..\services\api
copy .env.example .env
```

Edite o arquivo `.env` se necessário. Os valores padrão já funcionam para desenvolvimento local.

### 5. Gere o Prisma Client

```bash
pnpm db:generate
```

### 6. Execute as migrations do banco

```bash
pnpm db:migrate
```

Isso vai criar todas as tabelas no banco de dados.

### 7. Popule o banco com dados iniciais

```bash
pnpm db:seed
```

Isso vai criar:
- Usuário admin
- Categorias de serviços
- Serviços básicos com preços
- Zona de cobertura São Paulo

## 🎯 Rodando o projeto

### Backend API

```bash
cd C:\Users\orlan\Projects\lavagem-domicilio
pnpm dev:api
```

A API vai rodar em: http://localhost:3000/api/v1

Documentação Swagger: http://localhost:3000/docs

### Admin Web

Em outro terminal:

```bash
pnpm dev:admin
```

O admin vai rodar em: http://localhost:3003

### Prisma Studio (visualizar banco)








Abre em: http://localhost:5555

### Apps Mobile (opcional)

> Os apps já vêm configurados para apontar para `http://localhost:3000/api/v1`.  
> Se precisar usar outro endereço, passe `--dart-define=API_BASE_URL=https://seu-endereco.com/api/v1` no `flutter run`.

#### App Cliente

```bash
cd apps\mobile-client
flutter pub get
flutter run
```

#### App Lavador

```bash
cd apps\mobile-driver
flutter pub get
flutter run
```

## 🔑 Credenciais de Teste



















































Ou use o Swagger UI: http://localhost:3000/docs

## 🛑 Parando o ambiente

### Docker Compose

```bash
cd C:\Users\orlan\Projects\lavagem-domicilio
docker compose --env-file .env.docker down
```

### Desenvolvimento local

#### Parar containers Docker

```bash
cd C:\Users\orlan\Projects\lavagem-domicilio\infra\docker
docker-compose -f docker-compose.dev.yml down
```

#### Parar servidores

Pressione `Ctrl+C` nos terminais onde os servidores estão rodando.

## 🔧 Comandos Úteis


# Ver logs dos containers (dev local)
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Resetar banco (CUIDADO: apaga tudo!)
cd services/api
pnpm db:migrate reset

# Formatar código
pnpm format

# Lint
pnpm lint
```

## ❓ Problemas Comuns

