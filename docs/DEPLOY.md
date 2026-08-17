# Deploy — Fly.io

Estado real em 2026-08-15: `api` + `admin-web` + Postgres já estão no
ar. `flyctl` autenticado nesta máquina como `orlando.narcizo.07@gmail.com`.

| App Fly | Serviço | URL |
|---|---|---|
| `giucar-db` | Postgres (1 nó, shared-cpu-1x, 1GB) | interno (`giucar-db.flycast`) |
| `giucar-api` | `services/api` (`fly.api.toml`) | https://giucar-api.fly.dev |
| `giucar-admin` | `apps/admin-web` (`fly.admin-web.toml`) | https://giucar-admin.fly.dev |

(Existe também um app `lavagem-domicilio`, criado à parte durante um
teste manual, sem uso — pode ser removido com `flyctl apps destroy
lavagem-domicilio` quando quiser.)

## O que já está feito

1. **Postgres criado e anexado** — `flyctl postgres attach giucar-db
   --app giucar-api` já setou `DATABASE_URL` como secret automaticamente.
2. **`api` deployada** — `flyctl deploy --config fly.api.toml`.
   Migrations rodam sozinhas no boot (`CMD` do Dockerfile já faz
   `prisma migrate deploy && node dist/main.js`). `/health` responde
   200.
3. **`admin-web` deployada** — `flyctl deploy --config
   fly.admin-web.toml`. `/login` responde 200.
4. **Admin de bootstrap criado** — `admin@giucar.com.br` /
   `Senha123!` (via `flyctl ssh console -a giucar-api` + Prisma direto
   na máquina — mesmo padrão de reset de senha usado localmente nesta
   sessão). **Troque essa senha depois do passo 5 abaixo.**
5. **Configs não-sensíveis** (`NODE_ENV`, `JWT_EXPIRES_IN`,
   `PAYMENT_GATEWAY_PROVIDER`, `ADMIN_WEB_URL`) já estão em `[env]`
   dentro de `fly.api.toml` — aplicadas a cada `flyctl deploy`, sem
   precisar de `flyctl secrets set`.

## Pendente — `[VOCÊ]`

**`flyctl secrets set` é uma ação que o modo automático desta sessão
bloqueia pra mim** (mesmo pra valores não sensíveis) — os itens abaixo
só podem ser feitos rodando o comando vocë mesmo:

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
flyctl secrets set --app giucar-api \
  JWT_SECRET="$JWT_SECRET" \
  REFRESH_TOKEN_SECRET="$REFRESH_SECRET"
```

**Isso é urgente, não só "pendente"**: sem `JWT_SECRET` setado, a API
cai no fallback hardcoded do código-fonte
(`local-jwt-secret-change-me`, público no repo) — qualquer um que leia
o código pode forjar um token de ADMIN válido contra a API em
produção. Depois de rodar o comando acima (dispara redeploy
automático), troque também a senha do admin de bootstrap.

Chaves de sandbox reais (Mercado Pago, Google Maps) continuam opcionais
— sem elas a API roda em modo mock, igual ao Docker Compose local (ver
`docs/PROGRESSO.md`).

## Deploy automático (CI/CD)

`.github/workflows/deploy-staging.yml` já está pronto — dispara em
todo push a `main`, faz `flyctl deploy` da api e do admin-web. **Só
funciona depois que você criar o secret no GitHub**:

1. `flyctl tokens create deploy --config fly.api.toml` (gera um token
   com escopo restrito ao app da api — repita pro admin-web se quiser
   escopo separado, ou use um token de org pra cobrir os dois)
2. No GitHub: Settings → Secrets and variables → Actions → New
   repository secret → nome `FLY_API_TOKEN`, valor o token gerado.

Sem esse secret, o workflow existe mas pula o deploy de propósito (job
fica verde/skipped, não vermelho — passo "Check FLY_API_TOKEN" detecta
a ausência e sai cedo) — não deploya nada sozinho até você criar o
secret.

## Redeploy manual (mudou código ou `fly.*.toml`)

```bash
flyctl deploy --config fly.api.toml
flyctl deploy --config fly.admin-web.toml
```

## Custos

Fly cobra por VM ativa (mesmo `shared-cpu-1x`/512MB tem custo pequeno
por hora) + Postgres (outra VM). `auto_stop_machines` nos `fly.toml`
ajuda (para as máquinas quando sem tráfego), mas confira o dashboard
Fly (<https://fly.io/dashboard>) periodicamente pra não levar susto na
fatura — não há free tier ilimitado.
