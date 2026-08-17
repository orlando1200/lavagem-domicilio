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
6. **`JWT_SECRET`/`REFRESH_TOKEN_SECRET` configurados** — confirmado
   em 2026-08-17 via `flyctl secrets list --app giucar-api` (ambos
   `Deployed`). A API não usa mais o fallback hardcoded do código-fonte.
   **Ainda pendente `[VOCÊ]`**: trocar a senha do admin de bootstrap
   (`admin@giucar.com.br` / `Senha123!`), já que ficou em texto puro
   neste documento.
7. **`GOOGLE_MAPS_API_KEY` configurada** (2026-08-17) — a chamada real
   à Distance Matrix API ainda retorna `REQUEST_DENIED` porque o
   projeto no Google Cloud não tem billing habilitado (isso envolve
   pagamento — decisão e ação `[VOCÊ]`, ver
   <https://console.cloud.google.com/project/_/billing/enable>). O
   fallback haversine local cobre esse caso com segurança enquanto
   isso não for resolvido.
8. **CI/CD de deploy automático funcionando** (2026-08-17) — o secret
   `FLY_API_TOKEN` no GitHub (Settings → Secrets and variables →
   Actions) está configurado com um token de **escopo de organização**
   (`flyctl tokens create org --org personal`), cobrindo `giucar-api` e
   `giucar-admin` no mesmo secret. Todo push a `main` já deploya os
   dois apps de verdade — confirmado ao vivo (releases reais em
   `giucar-api` v6 e `giucar-admin` v2, ambos respondendo 200).

   Dois tokens anteriores falharam antes deste funcionar: um estava
   truncado ao colar no GitHub (o token do `flyctl` tem 600+
   caracteres numa linha só — fácil de cortar sem perceber ao
   selecionar manualmente no terminal); outro tinha escopo restrito a
   um único app (`flyctl tokens create deploy --config fly.api.toml`),
   insuficiente porque os dois jobs do workflow reaproveitam o mesmo
   secret. Se o token precisar ser regenerado no futuro, use sempre
   `flyctl tokens create org` (ou copie o valor de um arquivo, nunca
   selecionando manualmente no terminal).

Chaves de sandbox reais (Mercado Pago) continuam opcionais — sem elas
a API roda em modo mock, igual ao Docker Compose local (ver
`docs/PROGRESSO.md`).

## Deploy automático (CI/CD)

`.github/workflows/deploy-staging.yml` dispara em todo push a `main`,
faz `flyctl deploy` da api e do admin-web. **Já está funcionando** —
o secret `FLY_API_TOKEN` está configurado (ver item 8 acima).

Se precisar recriar o secret do zero:

1. `flyctl tokens create org --org personal` (token de escopo de
   organização — cobre os dois apps com um secret só; **não** use
   `tokens create deploy --config ...`, que restringe a um único app)
2. No GitHub: Settings → Secrets and variables → Actions → editar/criar
   `FLY_API_TOKEN`, colar o valor **completo** (selecione tudo com
   Ctrl+A a partir de um arquivo, nunca arrastando manualmente no
   terminal — o token é longo e é fácil cortar sem perceber).

Sem esse secret, o workflow existe mas pula o deploy de propósito (job
fica verde/skipped, não vermelho — passo "Check FLY_API_TOKEN" detecta
a ausência e sai cedo) — não deploya nada sozinho sem o secret.

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
