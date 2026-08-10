# Deploy de Staging — Fly.io

Passo a passo pra colocar `api` + `admin-web` + Postgres no ar num
ambiente de staging real. `flyctl` já está instalado nesta máquina
(`winget install Fly-io.flyctl`) — os passos abaixo com `[VOCÊ]`
precisam ser feitos por você (criação de conta, login, e qualquer
coisa que crie recurso cobrável); os demais podem ser rodados comigo.

## 0. Pré-requisitos — `[VOCÊ]`

1. Crie uma conta em <https://fly.io> (pede cartão de crédito mesmo no
   free tier — Fly cobra por uso além de uma cota grátis pequena).
2. Autentique o CLI local:
   ```bash
   flyctl auth login
   ```
   Abre o browser pra login/signup. Depois disso o token fica salvo
   localmente (`~/.fly/config.yml`) e todos os comandos `flyctl`
   seguintes funcionam sem pedir login de novo.

## 1. Banco de dados (Postgres)

Fly Postgres roda como uma VM Fly normal (não é totalmente gerenciado
tipo RDS, mas funciona bem pra staging):

```bash
flyctl postgres create --name giucar-db-staging --region gru --vm-size shared-cpu-1x --volume-size 1
```

Guarda a `DATABASE_URL` que o comando imprime no final — vai precisar
dela no passo 3.

## 2. Ajustar nomes únicos nos `fly.toml`

`fly.api.toml` e `fly.admin-web.toml` (raiz do repo) têm `app =
"giucar-api-staging"` / `"giucar-admin-web-staging"` — nomes de app são
globalmente únicos no Fly. Se já estiverem em uso por outra conta,
troque pra algo tipo `giucar-api-staging-<seu-usuario>` nos dois
arquivos (e no `API_URL`/`build.args.API_URL` de
`fly.admin-web.toml`, que referencia o nome do app da api).

## 3. Deploy da `api`

```bash
flyctl launch --config fly.api.toml --no-deploy   # cria o app no Fly sem deployar ainda
flyctl secrets set --config fly.api.toml \
  DATABASE_URL="<url do passo 1>" \
  JWT_SECRET="$(openssl rand -hex 32)" \
  MERCADO_PAGO_ACCESS_TOKEN="" \
  MERCADO_PAGO_PUBLIC_KEY="" \
  GOOGLE_MAPS_API_KEY=""
flyctl deploy --config fly.api.toml
```

Sem as chaves do Mercado Pago/Google Maps, a API sobe em modo mock
(mesmo comportamento do Docker Compose local) — dá pra testar tudo
antes de ter as chaves reais (ver `docs/PROGRESSO.md`, seções 6 e a
tarefa de sandbox do Mercado Pago/Google Maps).

Depois do deploy, aplique as migrations (o `Dockerfile` já roda
`prisma migrate deploy` automaticamente no boot do container — não
precisa de passo manual, mas dá pra confirmar com):
```bash
flyctl logs --config fly.api.toml
```

Anote a URL pública: `https://<app-da-api>.fly.dev`.

## 4. Deploy do `admin-web`

Antes de deployar, edite `fly.admin-web.toml`: troque
`build.args.API_URL` e `env.API_URL` pra
`https://<app-da-api-do-passo-3>.fly.dev/api/v1` (a URL real, não o
placeholder).

```bash
flyctl launch --config fly.admin-web.toml --no-deploy
flyctl deploy --config fly.admin-web.toml
```

## 5. Fechar o CORS

Volta na `api` e seta `ADMIN_WEB_URL` com a URL real do admin-web pra
travar o CORS (hoje só libera `localhost:3003` por padrão):
```bash
flyctl secrets set --config fly.api.toml ADMIN_WEB_URL="https://<app-do-admin-web>.fly.dev"
```
Isso reinicia a `api` automaticamente com a env var nova.

## 6. Criar o primeiro admin

Igual foi feito localmente nesta sessão: `POST /auth/register` só
aceita `CLIENTE`/`LAVADOR` (correção de segurança de 2026-08-10 —
antes disso dava pra virar admin sem autenticação). Pra criar o
primeiro admin em staging, conecte no Postgres do Fly e rode um
`UPDATE users SET role = 'ADMIN' WHERE email = '...'` depois de
registrar um usuário normal, ou promova via `PATCH
/admin/users/:id/role` se já existir outro admin.

```bash
flyctl postgres connect -a giucar-db-staging
```

## 7. Deploy automático (CI/CD)

`.github/workflows/deploy-staging.yml` já está pronto — dispara em
todo push a `main`, faz `flyctl deploy` da api e do admin-web. **Só
funciona depois que você criar o secret no GitHub**:

1. `flyctl tokens create deploy --config fly.api.toml` (gera um token
   com escopo restrito ao app da api — repita pro admin-web se quiser
   escopo separado, ou use um token de org pra cobrir os dois)
2. No GitHub: Settings → Secrets and variables → Actions → New
   repository secret → nome `FLY_API_TOKEN`, valor o token gerado.

Sem esse secret, o workflow existe mas falha logo no primeiro passo —
não deploya nada sozinho até você criar o secret de propósito.

## Custos

Fly cobra por VM ativa (mesmo `shared-cpu-1x`/512MB tem custo pequeno
por hora) + Postgres (outra VM). `auto_stop_machines = true` nos
`fly.toml` ajuda (para as máquinas quando sem tráfego), mas confira o
dashboard Fly (<https://fly.io/dashboard>) periodicamente pra não levar
susto na fatura — não há free tier ilimitado.
