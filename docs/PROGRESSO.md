# Progresso do Projeto — GIUCAR

## Última atualização
2026-08-14

> Nota: a versão anterior deste arquivo (17/jul) descrevia uma rodada
> anterior à recuperação do backend (Fase 9 — ver
> `docs/FASE9_CORRUPTED_MODULES.md`) e referenciava conceitos que não
> existem mais no schema atual (`DispatchAttempt`, tracking WebSocket,
> `QuoteCheckoutPage`). Substituída abaixo pelo estado atual.

## O que foi feito nesta rodada

### Backend (`services/api`)
- **Schema Prisma**: corrigido drift `Driver`→`DriverProfile` que
  impedia `prisma generate` por completo; adicionados
  `AuctionStatus.expired`, `LoyaltyPoint.redeemedAmount`, model
  `LoyaltyRedemption`.
- **`auctions`**: leilão de serviço pesado completo — cliente cria a
  partir de um pedido pendente, lojas `CARWASH_SHOP` enviam pujas,
  ranking ponderado (preço/prazo/garantia/reputação), aceite/
  cancelamento, endpoints admin.
- **`drivers` (estendido)**: onboarding de `DriverProfile`
  (moto/carro/loja de carwash) — antes não existia nenhuma forma de
  criar esse perfil; sem ele, `auctions` não tinha como ter pujadores.
- **`loyalty`**: reescrito do zero (código anterior estava corrompido,
  referenciava campos que não existem no schema) — `GET
  /loyalty/balance`, `POST /loyalty/redeem` (consumo parcial de
  concessões, mais próximas de vencer primeiro), concessão de 5% via
  `POST /admin/loyalty/orders/:id/grant`, job noturno real
  (`@nestjs/schedule`) que expira pontos vencidos.
- **`payments`**: adapter Mercado Pago em **modo mock** (nunca chama
  API real) atrás de uma interface (`PaymentGatewayAdapter`) — PIX e
  cartão, `POST /payments/intent`, `POST /payments/webhook` (webhook
  aprovado concede pontos GIUCAR automaticamente).
- **`maps`**: `GET /maps/distance` — usa Google Distance Matrix quando
  `GOOGLE_MAPS_API_KEY` está configurada, cai para haversine local sem
  chave ou se a API falhar. Cálculo de taxa de entrega
  (`calculateDeliveryFee`) com valores assumidos (sem tabela de preços
  definida em outro lugar do produto).
- **CI**: removido `continue-on-error` que fazia o job `api` passar
  independente do resultado real (falso-verde).
- **Testes**: 29 testes unitários novos (`loyalty`, `payments`,
  `mercado-pago.adapter`, `maps`), todos os `TestingModule` do Nest com
  teardown correto (`module.close()`).

### Apps Flutter
- **`mobile-client`**: tela de leilão completa (lista, formulário de
  solicitação, ofertas recebidas com ranking, aceitar/cancelar),
  integrada com a API real (não mock).
- **`mobile-driver`**: aba "Leilão de Serviços Pesados" — gate de
  ativação do modo Loja de Carwash (`DriverProfile` `CARWASH_SHOP`),
  leilões disponíveis com "Enviar oferta", "Minhas ofertas".
- Rodado `flutter analyze` pela primeira vez nesta máquina nos 3 apps
  (`mobile-client`, `mobile-lojista`, `mobile-driver`): revelou e
  corrigiu bugs reais pré-existentes (imports faltando/errados, `const`
  inválido com getters computados, campo morto) — nunca detectado antes
  porque o Flutter nunca tinha sido instalado/rodado neste ambiente.

### Infra/repo
- Quarentena de código corrompido (`_corrupted-quarantine/` /
  `_corrupted_quarantine/`) revisada arquivo a arquivo: o que já foi
  substituído por versão funcional foi removido (versionando um
  snapshot antes, já que os arquivos nunca tinham sido commitados — sem
  isso a remoção seria irreversível); o resto permanece, pois ainda é a
  única implementação existente daquela funcionalidade.
- `.gitignore` na raiz do monorepo (não existia — só dentro de cada
  pacote).
- `preview_driver.html`: preenchida a tela `#cadastro-loja` (o link já
  existia na tela "Escolha seu Perfil", mas apontava pra uma seção que
  nunca tinha sido criada) e o estado "aguardando aprovação".

## Modo mock / pendente de chaves reais

| Integração | Status | O que falta |
|---|---|---|
| **Mercado Pago** | Mock completo (PIX + cartão), nunca chama API real. Loga `[payments] modo MOCK ativo` no startup | `MERCADO_PAGO_ACCESS_TOKEN`/`MERCADO_PAGO_PUBLIC_KEY` de sandbox no `.env`; trocar `MercadoPagoAdapter` por integração real com o SDK |
| **Google Maps** | Fallback haversine funcional; código pronto pra API real. Loga `[maps] modo MOCK/REAL ativo` no startup | `GOOGLE_MAPS_API_KEY` no `.env` — sem chave, nunca testamos contra a API de verdade |
| **AWS Rekognition** | Não iniciado | Nada implementado ainda |
| **Firebase Push** | Hooks placeholder (só logam) em `auctions-notifications.service.ts` | SDK real do FCM |
| **Confirmação de pagamento (checkout da loja)** | `mobile-client` chama `POST /payments/webhook` ele mesmo logo após criar a intent, simulando a aprovação do gateway — o endpoint é propositalmente sem autenticação (é o que um gateway real chamaria) | Chave de sandbox do Mercado Pago; quando existir, o app para de chamar o webhook e passa a esperar o callback real |

Nenhuma integração foi validada contra credenciais reais de sandbox —
não há chaves configuradas nesta máquina.

## Decisões técnicas importantes

- **Leilão de serviço pesado pertence ao app lavador, não ao lojista.**
  Já era decisão de produto anterior (commit `d505f6f`); o backend
  `auctions` foi construído em cima da mesma divisão — quem puja é um
  `DriverProfile` (sub-perfil do `LAVADOR`), não a `Store` do lojista
  (que é só marketplace de produtos).
- **1 ponto GIUCAR = R$ 0,01 no resgate**, com concessão de 5 pontos por
  real gasto — taxa assumida (não especificada em nenhum outro lugar do
  produto), escolhida para que resgatar 100% dos pontos de um pedido
  devolva exatamente os mesmos 5% concedidos.
- **Webhook de pagamento aprovado chama
  `LoyaltyService.grantForPaidOrder`** (best-effort, não derruba o
  webhook se falhar) — fecha o loop que `loyalty` deixava em aberto (a
  concessão só tinha disparo manual/admin antes de `payments` existir).
- **`MapsService` agora é a fonte de distância do matching de pedidos**
  (`orders.service.ts.pickClosestDriver`) — antes tinha um `haversineKm`
  local duplicado, removido. Continua exposto standalone via `GET
  /maps/distance`.
- **Frete de `deliveries` não foi ligado ao `MapsService`, de propósito.**
  `Store.address` é `Json?` sem lat/lng estruturado; o único ponto que
  usa um valor de frete (`deliveries.service.ts.createDeliveryAsAdmin`)
  segue documentado como endpoint de teste/simulação (`dto.shippingAmount
  ?? 0`), não o checkout real. O checkout real (abaixo) tem sua própria
  regra de frete simbólica, independente do `MapsService`.
- **Checkout real da loja B2C construído** (`POST
  /marketplace/client/checkout` + `Payment` aceitando `ProductOrder`) —
  ver seção "Loja B2C (checkout)" abaixo. `ProductOrder.shippingAddress`
  é um snapshot JSON (mesmo padrão de `Store.address`), **não** um
  módulo de endereços — decisão explícita de escopo, endereço não é
  reutilizável entre pedidos nem compartilhado com o pedido de lavagem
  (que também não tem tela de endereço no app cliente).
- **Fidelidade sem sistema de metas/tiers inventado.** O card de
  fidelidade do app cliente mostrava `nextRewardAt` fixo (320/500
  pontos, hardcoded) — não existe conceito de "próxima recompensa" no
  modelo real (resgate é sempre parcial, a qualquer momento). Trocado
  por `nextExpiration` (pontos a vencer, já existia no backend) +
  `streakDays`/`totalSaved` novos, ambos derivados de dado real
  (`Order.completedAt`, `LoyaltyRedemption`), sem tabela nova.
- **`store.controller.ts` não tinha nenhum guard de autenticação**
  (achado ao integrar o app lojista) — `POST /stores` aceitava
  `ownerUserId` arbitrário no corpo (qualquer um podia criar loja em
  nome de outro usuário) e `GET/POST /stores/:id[/products]` eram
  públicos, expondo `bankInfo`/`commissionPlan` de qualquer loja sem
  login. Corrigido (commit `0204bbb`, **breaking change**): guard
  `JwtAuthGuard`/`RolesGuard` (`LAVADOR`/`ADMIN`) em todo o controller,
  `createStore` deriva o dono do usuário autenticado (não mais do
  body), demais rotas conferem ownership via `findStoreForOwner`.
- **Previews HTML (`apps/preview/*.html`) permanecem mockups manuais**
  (Opção A), atualizados só quando há mudança grande de fluxo ou um bug
  concreto (ex.: link morto) — não geramos a partir do código Flutter
  real. Trade-off aceito: os previews podem divergir do app real com o
  tempo; a fonte de verdade sobre comportamento é sempre o código em
  `apps/mobile-*`, nunca o preview.

## Bloqueios / débitos técnicos conhecidos

- **Incidente do GitHub Actions (2026-08-06)**: os commits `9aa8a88`,
  `5f9f091`, `0fd58c1` e `844ac1e` foram pushados pro `main` e
  confirmados como HEAD via API, mas nenhum workflow run foi criado —
  confirmado incidente ativo em [githubstatus.com](https://githubstatus.com)
  ("Incident with Actions": capacidade de runners reduzida, webhook
  deliveries atrasadas). Diagnóstico completo feito via API pública
  (workflow `state: active`, arquivo `ci.yml` presente no HEAD, zero
  causa local) antes de concluir que era só o incidente. Tentativa de
  re-disparo com commit vazio (`0fd58c1`) não funcionou enquanto o
  incidente seguia ativo — comportamento esperado, não confiável até o
  GitHub normalizar. Adicionado `workflow_dispatch` ao `ci.yml`
  (commit `844ac1e`) pra permitir disparo manual pela UI/API do GitHub
  da próxima vez que isso acontecer, sem depender de push. **Ação
  pendente**: conferir manualmente se os commits acima passaram no CI
  assim que o incidente for resolvido (ou disparar via "Run workflow"
  na aba Actions).
- ~~CI falha no Linux~~ — **resolvido** (run #34, commit `8900ed4`,
  `Status: Success` nos 3 jobs). Causa real, só descoberta depois de
  conseguir o texto do log (o endpoint de logs da API do GitHub exige
  token de admin, então dependeu de alguém com acesso ao repo colar o
  log manualmente): `ci.yml` rodava `pnpm run test -- --ci --coverage`,
  e o `pnpm` estava repassando um `"--"` **literal** como primeiro
  argumento pro jest (`jest "--" "--ci" "--coverage"`), em vez de
  tratar como separador. O jest interpreta qualquer argumento
  posicional como padrão de nome de teste — `"--"` não bate com nenhum
  arquivo, daí "No tests found, exiting with code 1". Não era diferença
  de SO/Node/pnpm (por isso nenhuma das reproduções locais pegava:
  nenhuma delas usou exatamente `pnpm run <script> -- <args>` do jeito
  que o workflow usava). Trocado por `pnpm exec jest --ci --coverage`,
  que invoca o jest direto sem passar pelo forwarding de argumentos do
  `pnpm run`. O teardown (`module.close()`) adicionado nos specs durante
  a investigação foi mantido por ser boa prática, mas não era a causa.
- **Sem Postgres/Docker nesta máquina** — as três migrations novas desta
  semana (`20260803000000_add_auctions_and_driver_profiles`,
  `20260804000000_add_loyalty_redemptions`,
  `20260806000000_unify_washer_into_driver_profile`) nunca foram
  aplicadas a um banco real, só validadas via `prisma generate`/
  `build`/`test`. A última em particular tem um `DROP TABLE` —
  revisar/testar em staging antes de aplicar em produção se algum dia
  houver dado real de `Washer` pra perder.
- **Mismatch de shape entre `GET /orders` e o app cliente**: o backend
  retorna `{ items, nextCursor }` (paginação por cursor), mas
  `orders_repository.dart` no `mobile-client` espera um array puro —
  bug pré-existente, não corrigido (fora do escopo do que foi pedido,
  mas afeta a listagem de pedidos em produção).
- ~~Naming divergente `MERCADOPAGO_*` vs `MERCADO_PAGO_*`~~ — resolvido,
  renomeado para `MERCADO_PAGO_ACCESS_TOKEN`/`MERCADO_PAGO_PUBLIC_KEY`.
- **App Lavador**: fluxo completo de registro com escolha de perfil
  (Moto/Carro/Loja) ainda não existe no app real — só login. O preview
  HTML já modela esse fluxo (`#escolha-perfil` → `#cadastro-loja`); o
  app Flutter, não.
- **`admin-web` real** (Next.js) continua quase vazio — só landing
  page. Commits que pareciam ser progresso do painel admin editavam
  `apps/preview/preview_admin.html` (mockup estático), não o app real.
- **Testes e2e**: nenhum configurado em nenhum pacote.
- **Deploy AWS**: só existe o documento de arquitetura, sem
  infraestrutura real.

## Fluxo completo de pedido (backend) — status real

Pedido explícito: "criar → matching por perfil/distância/disponibilidade
→ aceitar → executar → confirmar pagamento → emitir pontos". Boa parte
já existia (aceitar/executar via máquina de estados de `Order`,
confirmação de pagamento via webhook do `payments`, pontos via
`LoyaltyService.grantForPaidOrder`); o que faltava de verdade era
"matching por perfil" — resolvido nesta rodada:

- ~~Matching por perfil~~ — **feito**. Unificado `Washer` em
  `DriverProfile` (eram dois models pro mesmo conceito — só
  `DriverProfile` tinha `driverType`, mas só era usado pelo `auctions`;
  o matching normal usava `Washer`, sem noção de perfil). Adicionado
  `Order.serviceType`; `orders.service.ts.matchDriver` agora prioriza
  `MOTO_WASHER` pra `DRY_WASH`/`EXPRESS_WASH` mesmo se mais longe (PRD:
  "Moto ideal para Seco e Express"), nunca inclui `CARWASH_SHOP`
  (exclusivo do leilão). `/drivers/me` e `/admin/washers` removidos,
  consolidados em `/driver-profiles/me`/`/admin/driver-profiles`.
  Migration `20260806000000_unify_washer_into_driver_profile`
  (irreversível — `DROP TABLE washers` — mas sem dado real pra perder
  nesta máquina). CI real (#38) confirmou passando.
- Disponibilidade (`DriverStatus.active`) já existia antes, sem mudança
  de lógica além de trocar `Washer` por `DriverProfile`.
- ~~Ligar `MapsService` ao matching~~ — **feito**. `pickClosestDriver`
  agora chama `MapsService.getDistance` (Google Distance Matrix real
  quando há `GOOGLE_MAPS_API_KEY`, haversine local como fallback) em vez
  de um `haversineKm` duplicado dentro de `orders.service.ts`. Frete de
  `deliveries` **não** foi ligado — ver "Decisões técnicas importantes"
  pra o motivo (falta endereço estruturado em `Store`/`ProductOrder`).

## Próximos passos priorizados

Ordem sugerida, por dependência e impacto (não por facilidade):

1. ~~Ligar `MapsService` ao matching de pedidos~~ — **feito** (commits
   `9aa8a88`/`5f9f091`). Frete de `deliveries` ficou de fora (ver decisão
   técnica acima). CI real ainda não confirmou — GitHub Actions em
   incidente ativo (ver "Bloqueios" abaixo).
2. ~~Fluxo de registro com escolha de perfil no App Lavador~~ — **feito**
   (commit `0611b4e`). Tela em 2 passos: dados da conta (`POST
   /auth/register`, role `LAVADOR` fixo) + escolha Moto/Carro/Loja de
   Carwash (`POST /driver-profiles/me`, mesmo padrão de
   `AuctionsPage._ActivationPrompt`). `flutter analyze` limpo. Perfil
   nasce `pending_documents`, precisa aprovação do admin antes de
   participar do matching normal ou de leilões.
3. **Apps Flutter → backend real** — **fechado** (`mobile-client`):
   - ~~Bug `GET /orders`~~ — **feito** (commit `9448925`): corrigido o
     mismatch `{items, nextCursor}` vs array puro. `OrderModel`
     atualizado (`washerId` removido, `serviceType` adicionado).
   - ~~Loja/carrinho~~ — **feito** (commits `600af74`/`e732ba7`):
     catálogo real (`GET /marketplace/client/catalog`, já existia —
     só faltava ligar), checkout real novo (`POST
     /marketplace/client/checkout`, cria `ProductOrder` por loja,
     calcula comissão via `CommissionPlan`, valida/decrementa
     estoque), pagamento real (`Payment` agora aceita `ProductOrder`)
     — confirmado em modo mock pelo próprio app (sem chave de sandbox,
     ver tabela "Modo mock" acima).
   - ~~Fidelidade~~ — **feito** (mesmos commits): `GET /loyalty/balance`
     real, com `streakDays`/`totalSaved` novos no backend (dado real,
     sem inventar sistema de metas — ver "Decisões técnicas").
   - **Veículo/endereço**: continua fora — não existe nem tela no app
     cliente, não é wiring, é feature nova do zero (endereço do
     checkout da loja usa snapshot JSON, não esse fluxo).
   - Auth e leilões já eram 100% reais antes desta rodada.
   - **`mobile-lojista`** (commit `0204bbb`): auth, cadastro de loja
     (`POST /stores`) e gestão de produtos já eram reais de rodada
     anterior. Faltava a tela "Pedidos recentes" (100% estática) — sem
     endpoint nenhum pra loja ver seus pedidos. Criado `GET
     /stores/:id/orders` + ligado no app. Nesse processo, achado e
     corrigido um problema de segurança real: `store.controller.ts`
     não tinha guard de autenticação nenhum (ver "Decisões técnicas").
   - **`mobile-driver` — fluxo de pedidos** (commits `259c29b`/
     `528a303`): faltava o essencial — `GET /orders` era restrito a
     `CLIENTE`, então o lavador nunca tinha como ver pedidos
     disponíveis pra aceitar; a fila era 100% mockada
     (`_mockAvailableOrders`) mesmo com aceitar/avançar status/cancelar
     já chamando o backend real (silenciosamente, contra pedidos que
     não existiam). Criados `GET /orders/available` (fila
     `searching_washer` por zona) e `GET /orders/mine/active`; achado e
     corrigido outro bug real no caminho — `PATCH /orders/:id/cancel`
     só aceitava `CLIENTE`, o lavador não tinha nenhum jeito de cancelar
     um pedido que aceitou. Online/offline agora reflete
     `DriverProfile.status` de verdade. `DriverDailyStats` (ganhos/
     lavagens do dia) segue mockado — precisa de endpoint de agregação
     que não existe, fora do escopo desta rodada.
4. ~~Docker Compose local (Postgres + backend)~~ — **feito** (commit
   `dcbe25d`). `docker-compose.yml`/`Dockerfile` já existiam mas
   estavam desatualizados (Stripe em vez de Mercado Pago, `Redis` sem
   nenhum consumidor no código, secrets do Firebase/admin nunca lidos).
   Corrigido pro stack real; validado só via `docker compose config`
   no CI (sem Docker nesta máquina pra rodar de fato).
5. ~~Aplicar as migrations pendentes num Postgres real~~ — **feito**.
   Docker Desktop precisou de WSL2 (não instalado nesta máquina —
   resolvido pelo usuário via `wsl --install` + habilitação manual das
   features `Microsoft-Windows-Subsystem-Linux`/`VirtualMachinePlatform`
   via DISM + restart completo). Com `docker compose up -d postgres` de
   pé, `prisma migrate deploy` rodou pela primeira vez contra um
   Postgres de verdade — todas as 7 migrations reais aplicaram, mas
   quebrou em seguida em `P3015` ao alcançar `_legacy_20250101000000_init`
   (só tem `.md`, sem `migration.sql`). Causa: a suposição registrada em
   `_legacy-migrations-reference/_legacy_20250101000000_init/NOTA_RECUPERACAO.md`
   de que o prefixo `_legacy_` bastava pro Prisma ignorar a pasta estava
   **errada** — `migrate deploy` escaneia qualquer subdiretório dentro
   de `prisma/migrations/`, independente do nome bater o padrão
   `<timestamp>_<nome>`. Corrigido movendo as duas pastas `_legacy_*`
   pra fora de `prisma/migrations/` (novo dir
   `services/api/prisma/_legacy-migrations-reference/`, fora do alcance
   do Prisma) — nota corrigida no lugar.

   Com o schema aplicado, subiu o backend pela primeira vez de ponta a
   ponta (`node dist/main.js`) e exercitou `POST /auth/register` →
   `POST /auth/login` → `GET /users/me` de verdade. Isso expôs um bug
   real de drift, invisível até este exato momento: a migration
   `20260806000000_unify_washer_into_driver_profile` dropou a tabela
   `washers` (que tinha `service_radius_km`) sem nunca adicionar essa
   coluna em `driver_profiles`, apesar de `schema.prisma` continuar
   esperando `DriverProfile.serviceRadiusKm`. Qualquer query tocando
   `DriverProfile` quebrava com "column driver_profiles.service_radius_km
   does not exist". Corrigido com nova migration
   `20260808000000_add_driver_profile_service_radius`; revalidado
   registro de `LAVADOR` + `POST /driver-profiles/me` + `GET
   /driver-profiles/me` com sucesso.

   Rodar via `node dist/main.js` direto no host prova o código, mas não
   prova a imagem Docker de produção — `services/api/Dockerfile` nunca
   tinha sido de fato construído/executado (só validado via `docker
   compose config`, que não builda nada). Ao rodar `docker compose up
   api` pela primeira vez, dois bugs reais e completamente distintos do
   Dockerfile apareceram, um atrás do outro:
   - **Symlinks do pnpm quebrados pelo achatamento de diretório**: o
     stage `runner` copiava `services/api/node_modules` pra um
     `./node_modules_local` órfão (nunca lido por nada) — sintoma
     inicial `sh: prisma: not found`. Corrigir só o destino do COPY pra
     `./node_modules` também não bastou: o binário `.bin/prisma` do
     pnpm é um **symlink relativo** (`../../../node_modules/.pnpm/...`)
     calculado pra profundidade original
     (`services/api/node_modules/.bin/`) — achatar tudo em `/app/`
     muda a profundidade e o symlink passa a apontar pra fora da
     imagem. Corrigido preservando a mesma árvore de diretórios do
     monorepo no `runner` (`/app/node_modules` + `/app/services/api/`
     inteiro, `WORKDIR /app/services/api`) em vez de achatar.
   - **OpenSSL ausente na imagem `node:20-alpine`**: com o binário
     `prisma` resolvendo certo, `prisma migrate deploy` ainda quebrava
     com "Could not parse schema engine response" — o engine do Prisma
     linka contra `libssl` em runtime e o Alpine base não vem com
     OpenSSL instalado. Corrigido com `apk add --no-cache openssl` nos
     stages `builder` e `runner`.

   Com os dois corrigidos, `docker compose up -d api` sobe de verdade:
   `prisma migrate deploy` roda dentro do container contra o Postgres
   do compose, Nest inicializa (`Nest application successfully
   started`), e `POST /auth/register` → `GET /users/me` funcionam via
   `localhost:3000` — primeira vez que a imagem Docker de produção
   (não só o código-fonte) é validada de ponta a ponta.

   `apps/admin-web/Dockerfile` também nunca tinha sido construído de
   verdade e tinha mais três bugs reais, achados nessa mesma sessão de
   validação:
   - **`apps/admin-web/public/` não existia** no repo (nenhum asset
     estático foi criado ao montar o painel do zero) — `COPY
     .../public ./public` quebrava o build inteiro
     (`"/app/apps/admin-web/public": not found`). Corrigido criando o
     diretório com um `.gitkeep` (Next.js/Docker exigem que exista,
     mesmo vazio).
   - **`server.js` do output `standalone` do Next.js não fica na raiz**:
     como o build roda dentro de um workspace pnpm, o standalone
     preserva a estrutura do monorepo (`apps/admin-web/server.js`, não
     `./server.js`) — `CMD ["node", "server.js"]` a partir de `/app`
     quebrava com `Cannot find module '/app/server.js'`. `.next/static`
     e `public/` também precisam ir pro mesmo caminho aninhado
     (`./apps/admin-web/...`), não pra raiz. Corrigido ajustando os
     destinos dos `COPY` e o `CMD` pra `node apps/admin-web/server.js`.
   - **`API_URL` do build sempre apontava pra porta errada**: o stage
     `builder` tinha `ENV API_URL=http://localhost:3001/api/v1`
     hardcoded, sem nunca declarar `ARG API_URL` — o
     `--build-arg API_URL=http://localhost:3000/api/v1` que
     `docker-compose.yml` já passava (porta 3000, a que o serviço `api`
     de fato expõe) era descartado silenciosamente. Como
     `next.config.js` embute `API_URL` no bundle do client em build
     time (`env` do Next, não `NEXT_PUBLIC_*`), toda chamada do browser
     ia pra `localhost:3001` (porta que não existe) e falhava com
     `ERR_CONNECTION_REFUSED` — só visível testando o login de verdade
     no browser contra a imagem construída, nunca antes disso. Corrigido
     declarando `ARG API_URL` antes do `ENV`.

   **Bug de segurança real, achado no mesmo processo**: pra logar no
   admin-web precisava de um usuário `ADMIN`, e não havia nenhum. Ao
   tentar criar um, descoberto que `POST /auth/register` — endpoint
   **100% público, sem guard nenhum** — aceitava qualquer valor de
   `role` no DTO, incluindo `ADMIN`: qualquer pessoa não-autenticada
   podia se auto-registrar como administrador e ganhar acesso total a
   todo `/admin/*` (aprovação de lavadores, repasses, etc.). Corrigido
   restringindo `RegisterDto.role` a `CLIENTE`/`LAVADOR` via `@IsIn`
   (`services/api/src/modules/auth/dto/register.dto.ts`) — promoção pra
   `ADMIN` só é possível por um admin já existente via `PATCH
   /admin/users/:id/role`, endpoint que já existia e já era protegido.
   O primeiro admin real (`admin@giucar.com.br`) foi criado pelo
   endpoint antigo (ainda aberto nesse momento) segundos antes do fix
   subir — reveja a senha antes de qualquer uso além de teste local.

   Com os quatro bugs corrigidos, `docker compose up -d` sobe os três
   serviços (`postgres`, `api`, `admin-web`) de verdade, e o login
   admin funciona de ponta a ponta pelo browser: `POST /auth/login` →
   cookie → `GET /users/me` → `GET /admin/orders` — todos `200`,
   `localhost:3003` → `localhost:3000`, confirmado via rede do browser,
   não só `curl`.
6. **Chaves de sandbox reais** (Mercado Pago + Google Maps) — depende de
   você criar as contas de desenvolvedor; o código já está pronto pros
   dois lados (mock automático sem chave, real com chave, log de modo no
   startup).
7. **Admin panel com dados reais** — **Fase 1 feita** (commit `23a4f32`):
   Pedidos, Aprovação de Lavadores, Marketplace (lojas + aprovação de
   produtos), Repasses. `admin-web` era só uma landing page estática, as
   14 páginas em quarentena estavam **literalmente corrompidas**
   (imports faltando, sintaxe quebrada, componentes de UI inexistentes,
   schema desatualizado) — não reaproveitáveis, reconstrução do zero.
   Stack nova: Tailwind + shadcn/ui + TanStack Query. Dois problemas
   reais achados e corrigidos no processo: CORS nunca tinha sido
   habilitado no backend (`main.ts`) e `marketplace.admin.controller.ts`
   não tinha guard nenhum (mesmo padrão de falha do `store.controller.ts`,
   já corrigido antes) — mais um vazamento de `passwordHash` em
   `DRIVER_PROFILE_INCLUDE`/`PAYOUT_INCLUDE` (`user: true` sem `select`).
   **Dashboard adiado de propósito** — módulo `analytics` está
   fantasiado (método duplicado 4x referenciando IA de surge pricing,
   bot de WhatsApp, assinaturas recorrentes, nada disso existe de
   verdade). **Fases 2-4 seguem pendentes**: categorias/serviços/
   zonas/cupons, relatórios/suporte/fidelidade, aluguel de moto/kit
   inicial — nenhuma dessas 10 páginas foi tocada ainda.
8. **Seed de desenvolvimento + validação end-to-end do fluxo completo de
   pedido** — com os 3 containers Docker de pé, `pnpm --filter api
   seed:dev` popula o banco (1 admin, 3 clientes com veículo+endereço, 3
   lavadores ativos moto/carro/loja na mesma zona, 1 lojista com 3
   produtos, 7 pedidos de exemplo — um por status). Documentado em
   `services/api/prisma/seed.ts`; idempotente (upsert por email/slug).

   Testado o fluxo real de ponta a ponta pela primeira vez: registro →
   login → criação de pedido → matching automático → aceite pelo
   lavador → `en_route` → `in_progress` → `completed` → intent de
   pagamento PIX (mock) → webhook de aprovação → concessão automática
   de pontos GIUCAR → resgate de pontos. **Tudo funcionou exatamente
   como documentado**, incluindo o matching priorizando `MOTO_WASHER`
   sobre `CAR_WASHER` para `DRY_WASH` (conforme PRD).

   **Um bug real e sério bloqueava o fluxo inteiro antes de eu poder
   testar isso**: não existia (em lugar nenhum do `src`) nenhum endpoint
   pra criar `Vehicle` ou `Address` — confirmado por busca no código
   inteiro (zero controllers, zero `prisma.vehicle.create`/
   `prisma.address.create` fora do seed). Como `POST /orders` exige um
   `vehicleId`/`addressId` já existentes do cliente, **nenhum cliente
   novo conseguia jamais criar um pedido** pelo app de verdade — só
   usuários inseridos manualmente no banco (como os do seed) tinham
   como testar o fluxo. Corrigido com dois módulos novos, seguindo
   exatamente o padrão dos demais (`JwtAuthGuard`+`RolesGuard`+
   `@Roles(CLIENTE)`): `POST /vehicles` + `GET /vehicles/me`
   (`src/modules/vehicles/`) e `POST /addresses` + `GET /addresses/me`
   (`src/modules/addresses/`, primeiro endereço cadastrado vira
   `isDefault` automaticamente).

   **Gap de escopo encontrado, não um bug**: o passo "cliente usa
   pontos GIUCAR na loja B2C" **não corresponde a nenhum fluxo
   implementado**. `POST /loyalty/redeem` só resgata pontos como
   desconto num `Order` (pedido de lavagem) — exige `orderId`, dono do
   pedido — e não tem nenhuma ligação com `POST
   /marketplace/client/checkout` (compra na loja/`ProductOrder`), cujo
   DTO nem tem campo de pontos. Pontos GIUCAR e a lojinha B2C são dois
   sistemas desconectados hoje; usar pontos como desconto no checkout
   da loja exigiria trabalho novo (não wiring), fora do escopo desta
   rodada.
9. **Documentação da API**: `docs/API.md` (referência prática, todos
   os exemplos rodados de verdade) + Swagger UI ligado de verdade em
   `GET /api/docs` — todo controller já usava
   `@ApiTags`/`@ApiOperation`/`@ApiBearerAuth`, mas ninguém nunca
   chamava `SwaggerModule.setup()` em `main.ts`; a documentação
   inteira era gerada em lugar nenhum. Confirmado ao vivo: a UI lista
   exatamente os endpoints reais (inclusive `vehicles`/`addresses`
   novos), sem nenhum dos módulos em quarentena abaixo.

   **Achado no processo, não é bug novo**: `services/api/tsconfig.json`
   tem uma lista explícita de `exclude` com **10 módulos inteiros**
   (`analytics`, `compliance`, `dispatch`, `document-verification`,
   `face-check`, `rental`, `services-catalog`, `starter-kit`,
   `support`, `tracking`, `zones` admin) — código de controllers real,
   com bastante superfície (compliance de documentos, tracking de
   localização do lavador em tempo real + ETA, catálogo de
   serviços/preços por porte de veículo, aluguel de moto, kit inicial,
   tickets de suporte, zonas com regras de preço) que **nunca foi
   importado em `app.module.ts`** e não compila contra o schema atual
   (usa `UserRole.admin`/`client`/`driver` em minúsculo — o enum real é
   `ADMIN`/`CLIENTE`/`LAVADOR`). Mesmo padrão já documentado pra
   `analytics` sozinho (item 7) — só que a quarentena é bem maior do
   que uma pessoa checando só o dashboard perceberia. Não mexido nesta
   rodada (fora de escopo — resgatar qualquer um desses exigiria
   auditoria completa antes, não é só tirar do `exclude`), mas vale
   saber que esse código existe pra quem for planejar as próximas
   fases: pode ser trabalho parcialmente feito reaproveitável (ou não —
   não auditado).
10. **Admin panel — Fases 2-4**: **Cupons, Zonas, Suporte, Fidelidade,
    Aluguel de Moto e Kit Inicial** — feito. Categorias/Serviços
    **adiado de propósito** (mesma lógica do Dashboard na Fase 1: não
    existe nenhum model `ServiceCategory`/`Service`/preço por porte de
    veículo no schema, nem especificação no PRD — decisão de produto
    real necessária antes).

    Confirmado na prática (não só por leitura) que 4 dos módulos
    quarentenados descobertos no item 9 — `zones`, `support`,
    `starter-kit`, `rental` — eram **mesmo** irrecuperáveis: todos
    referenciavam models Prisma inexistentes (`coverageZone`,
    `RentalPartner`, `StarterKitConfig`, `TicketCategory`) e tinham
    arquivos literalmente truncados (`support.service.ts` começava no
    meio de uma função, sem import nenhum). Reescritos do zero contra o
    schema real, seguindo exatamente o padrão de `coupons` (guards,
    paginação `{data,total,page,limit,totalPages}`, soft-delete onde
    fazia sentido) — `zones.controller.ts` (público, sem consumidor) e
    `starter-kit.controller.ts` (self-service, sem necessidade) foram
    **descartados** em vez de recuperados; `moto-rental.admin.controller.ts`
    virou `rental.admin.controller.ts` (consistência de nome).

    **Achado real no processo**: não existia — vivo ou morto — nenhuma
    forma de um usuário criar um `SupportTicket`. Adicionado `POST
    /support/tickets` + `GET /support/tickets/me`
    (`CLIENTE`/`LAVADOR`), espelhando exatamente `vehicles`/`addresses`
    (mesmo padrão do item 8) — sem isso a tela admin de Suporte nunca
    teria dado real pra mostrar.

    Fidelidade ganhou relatório agregado novo (`GET
    /admin/loyalty/report`: total concedido/resgatado/em
    aberto/expirado + top usuários por saldo, via
    `Prisma.aggregate`/`groupBy`) — pedido explícito do usuário, não
    existia nenhum endpoint de agregação antes (só concessão manual
    pontual e expiração em lote).

    Frontend: 6 páginas novas em `apps/admin-web/src/app/(admin)/`
    (`cupons`, `zonas`, `suporte`, `fidelidade`, `aluguel-moto`,
    `kit-inicial`), seguindo exatamente as convenções da Fase 1 (query
    keys `['admin','<recurso>','list'|'detail',...]`, um
    `lib/api/<recurso>.ts` por recurso, `Sheet` de detalhe com
    `useMutation` invalidando o recurso, toast via `sonner`). Sem
    combobox/checkbox/alert-dialog neste projeto ainda — campos
    booleanos viram `<Select>` de 2 opções, "buscar lavador" reaproveita
    `listDriverProfiles` + `<Select>` simples (mesmo padrão do
    assign-driver de Pedidos), lista de bairros da Zona vira
    `<Textarea>` "separe por vírgula".

    Planejado via `EnterPlanMode`/`ExitPlanMode` antes de escrever
    código (escopo grande o suficiente pra justificar), com 2 agentes
    Explore + 1 agente Plan pra levantar convenções reais e desenhar a
    implementação contra o schema de verdade antes de qualquer linha de
    código.
11. **Dashboard, Relatórios Financeiros, Documentos e E2E Checklist**:
    quarto lote do admin panel — itens 2, 3, 5 e 6 de uma lista de 8
    pedida pelo usuário (itens 1 já feito, 4 pausado — app cliente não
    tem nenhum fluxo de criação de pedido, telas de veículo/endereço
    sozinhas não serviriam pra nada —, 7-8 bloqueados por chaves de
    sandbox do usuário).

    **Dashboard** (`services/api/src/modules/dashboard/`, módulo novo):
    `GET /admin/dashboard/summary` — pedidos por status
    (`groupBy`), receita paga total/hoje (`Payment.aggregate`),
    lavadores/lojas ativos, novos clientes hoje, aprovações de
    documentos pendentes. Vira a landing page do admin-web
    (`app/page.tsx` e o redirect pós-login trocaram de `/pedidos` pra
    `/dashboard`).

    **Relatórios Financeiros**: estende `payments` module existente
    (não cria módulo novo) — `AdminPaymentsController` novo
    (`GET /admin/payments`, `/report`, `/export`) reaproveitando um
    `buildAdminWhere` privado nos 3 métodos. CSV sem lib nova: backend
    devolve JSON puro (`/export`, capado em 5000 linhas), frontend
    converte via `Blob`+`<a download>` (`lib/csv.ts`, ~30 linhas,
    RFC4180 simples).

    **Documentos** (`document-verification` module, reescrito do zero —
    o arquivo antigo tinha 8 linhas, referenciava um serviço
    inexistente e usava `UserRole.admin` minúsculo inválido, mesmo
    tratamento de descarte total já dado a `zones`/`support`/etc.):
    self-service `POST`/`GET /document-verification/me` (`LAVADOR`) +
    admin `GET/PATCH /admin/document-verification`. Sem campo de motivo
    de rejeição (a coluna não existe em `DocumentVerification`) e sem
    infra de upload — `fileUrl` é um link colado pelo lavador, mesma
    pragmática já usada em `ProductOrder.shippingAddress`. Tela admin
    tem um botão "Ativar lavador" separado da revisão do documento, que
    reaproveita `PATCH /admin/driver-profiles/:userId/status` (já
    existia) — é decisão manual do admin, **não** conta quantos
    documentos foram aprovados (sem regra de "N aprovados = ativa
    sozinho", não especificada). Espelhado no mobile-driver:
    `features/documents/` (repository + provider + `DocumentsPage`),
    ligado no item de menu "Perfil de atuação" do Perfil (antes
    `onTap: () {}`).

    **Achado real de gap no roteiro do usuário**: o próprio lavador
    **não consegue** se auto-ativar — `PATCH
    /driver-profiles/me/availability` (self-service) exige que o perfil
    já esteja `active`/`inactive`; um perfil recém-criado nasce
    `pending_documents` e fica preso lá sem intervenção do admin. Sem
    esse passo, um pedido nunca aparece em `GET /orders/available` pro
    lavador. Documentado como "Passo 7a" no checklist abaixo.

    **`docs/E2E_CHECKLIST.md`** (novo): script `curl` documentado da
    sequência crítica completa (registro → veículo/endereço → pedido →
    registro do lavador → ativação pelo admin → aceite → avanço de
    status → pagamento → webhook → saldo de pontos), por pedido
    explícito do usuário — sem infra de teste nova (sem Supertest),
    "o mínimo é ter esse script documentado e validar que a sequência
    funciona contra o backend rodando localmente". **Rodado de verdade**
    contra o stack Docker reconstruído (`docker compose up -d --build`)
    via um script Node equivalente (ambiente sem `jq`/browser
    screenshot disponível) — todos os 13 passos + o 7a inserido
    passaram. Achado extra durante a execução real: `GET
    /orders/available` devolve um array simples, sem o wrapper
    `{items,...}` que o resto da documentação de pedidos client-facing
    usa — corrigido no checklist. Achado de ambiente (não é bug do
    código): o admin do seed (`admin@giucar.com.br`) já existia no
    Postgres local de uma criação manual anterior com senha diferente
    de `Senha123!` (seed usa `upsert` com `update: {}`, não sobrescreve
    senha existente) — documentado como troubleshooting no checklist,
    resolvido resetando o hash direto no Postgres do container (só
    ambiente de dev local).

    Verificação completa: `pnpm --filter api lint/type-check/test/build`
    (78 testes passando), `pnpm --filter admin-web lint/type-check`
    (build local falha por uma limitação conhecida do Windows —
    `next build` tenta symlink em `node_modules` no modo standalone e
    o Windows nega sem modo dev habilitado; o build real de produção é
    o do Dockerfile, já validado rodando), `flutter analyze` limpo no
    mobile-driver.
12. **Mobile-client — item 4: fluxo completo de pedido de lavagem**
    (`features/vehicles`, `features/addresses` novos + `features/orders`
    e `features/shop/data/payments_repository.dart` estendidos). Antes
    deste trabalho o app cliente não tinha **nenhum** fluxo de criação
    de pedido — nem mockado; toda CTA relevante (`/catalog`,
    `/vehicles`, `/addresses`, `/quote`) apontava pra `PlaceholderPage`.
    Trabalho 100% client-side — o backend (`vehicles`, `addresses`,
    `orders`, `payments`) já estava pronto.

    Wizard de 4 passos (`new_order_page.dart`, mesmo padrão imperativo
    `ConsumerStatefulWidget` + `_step`/`_submitting`/`_errorMessage` já
    usado no checkout de marketplace): serviço (lista fixa local —
    `DRY_WASH`/`EXPRESS_WASH`, mesmos preços já hardcoded na home, já
    que não existe catálogo de serviços real no schema) → veículo →
    endereço → revisão+pagamento (mock, reaproveitando
    `PaymentsRepository` que já era genérico). Nova tela de
    detalhe/acompanhamento (`order_detail_page.dart`, rota
    `/orders/:id`) com estado de pagamento (pagar agora/retomar
    pagamento/pago/recusado — `Order` e `Payment` são desacoplados no
    schema, pedido aparece em `/orders` independente do pagamento) e
    cancelamento.

    **`HEAVY_SERVICE` fica de fora deste wizard de propósito** — o
    usuário confirmou que esse tipo de serviço (estética automotiva,
    funilaria, tapeçaria, elétrico automotivo) pertence ao sistema de
    leilão já existente entre cliente e loja `CARWASH_SHOP`
    (`/auctions`), não a um checkout de preço fixo. Acompanha um gap já
    existente e fora de escopo: `/auctions/new` depende de um pedido
    `pending` preexistente que hoje nada no client cria (só
    `HEAVY_SERVICE` fica `pending` sem matching automático) — não é
    regressão introduzida aqui.

    **Bug real corrigido de brinde**: botão "Serviços Pesados" na home
    chamava `context.push('/auction')` (singular, rota morta) em vez de
    `/auctions` (plural, rota real já registrada) — o banner irmão na
    mesma tela já usava a forma certa.

    Verificação: `flutter analyze` limpo (só os mesmos `info`
    pré-existentes de `prefer_const_constructors` já tolerados no
    resto do repo) + `dart format`. Contratos de API confirmados por
    leitura direta do código (`orders.service.ts`, `payments.service.ts`,
    DTOs de `vehicles`/`addresses`) — `resolveZoneId` já resolve zona
    sozinha por endereço quando `zoneId` não é enviado, `POST /orders`
    devolve o `Order` completo sem wrapper, `GET
    /payments/orders/:orderId` (usado por `fetchForOrder`, método novo)
    devolve 404 quando ainda não há pagamento.

    **Verificação end-to-end ao vivo pendente**: o Docker Desktop deste
    ambiente parou de subir durante esta sessão por um bug próprio,
    sem relação com o projeto — o processo de backend do Docker Desktop
    crasha ao tentar recriar um socket AF_UNIX travado
    (`%LOCALAPPDATA%\Docker\run\dockerInference`), e o Windows recusa
    remover o arquivo mesmo com `Remove-Item -Force`/`rmdir` (precisa de
    reboot pra liberar o handle preso no nível do SO). A maioria dos
    endpoints usados aqui (`vehicles`, `addresses`, criação/consulta de
    `orders`, `payments/intent`+`webhook`) já foi validada ao vivo no
    item 11 (E2E Checklist) na mesma sessão; faltam confirmar ao vivo
    especificamente `GET /payments/orders/:orderId` (`fetchForOrder`) e
    `PATCH /orders/:id/cancel` — pendente de reboot da máquina do
    usuário. Script de verificação pronto em
    `item4-check.mjs` (scratchpad da sessão) pra rodar assim que o
    Docker voltar.
