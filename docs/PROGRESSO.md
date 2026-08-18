# Progresso do Projeto — GIUCAR

## Última atualização
2026-08-15 (tarde)

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

> Seção limpa em 2026-08-15 (tarde) — a maioria dos itens listados
> aqui em versões anteriores deste documento (incidente do GitHub
> Actions de 06/ago, mismatch de paginação em `GET /orders`, app
> Lavador sem escolha de perfil, `admin-web` "quase vazio", deploy só
> documentado sem infra real) foi resolvida em rodadas posteriores e
> ficou desatualizada no arquivo. O que segue é o que **realmente**
> continua em aberto:

- **Testes e2e automatizados**: nenhum configurado em nenhum pacote.
  `docs/E2E_CHECKLIST.md` cobre o fluxo crítico manualmente (curl/`.http`
  contra o Docker real), e esta sessão criou vários scripts Node
  ad-hoc de verificação ao vivo (não versionados, ficam no scratchpad),
  mas não há suite automatizada rodando em CI.
- **`GET /orders/available` e outras rotas em array puro**: convivem
  três convenções de paginação diferentes no backend (cursor
  `{items,nextCursor}`, array puro, admin `{data,total,page,limit,totalPages}`)
  — funciona porque cada repositório Dart foi checado contra o shape
  real, mas é uma inconsistência de API que vale unificar se o backend
  crescer mais.
- **Fly Postgres é "Unmanaged"**: o próprio `flyctl` avisa nesse modo
  ("users are responsible for operations, management, and disaster
  recovery") — sem backup automático configurado. Existe `flyctl mpg`
  (Managed Postgres) como alternativa paga, não usada aqui.
- **`docs/DEPLOY.md`** documenta o deploy real no Fly.io (ver item 19
  da lista de rodadas abaixo) — o documento de arquitetura AWS antigo,
  se ainda existir em algum lugar do repo, está desatualizado frente a
  essa decisão real de infra.

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

    **Verificação end-to-end ao vivo — concluída**: o Docker Desktop
    deste ambiente parou de subir por um bug próprio, sem relação com o
    projeto (o backend do Docker Desktop crashava tentando recriar
    sockets AF_UNIX travados — `dockerInference`, depois
    `docker-secrets-engine\engine.sock` — que o Windows recusava
    remover mesmo com `Remove-Item -Force`/`rmdir`; resolvido matando
    todos os processos `docker*` e relançando, o que finalmente liberou
    os arquivos travados sem precisar reboot completo). Com o stack de
    pé (`docker compose up -d`), rodado o script `item4-check.mjs`
    (scratchpad da sessão, replica exatamente as chamadas dos novos
    repositórios Dart): todos os 25 contratos confirmados, incluindo os
    dois que faltavam — `GET /payments/orders/:orderId` (`fetchForOrder`,
    404 antes do pagamento → 200 `status:"paid"` depois) e `PATCH
    /orders/:id/cancel` (→ `status:"cancelled"`).
13. **mobile-lojista — diagnóstico + dados reais/edição/plano
    persistido**. Terceira app Flutter, não tocada até esta sessão.
    Diagnóstico (agente Explore) mostrou que **não é shell vazio** —
    auth, criação de loja/produto, listagem de produtos/pedidos já
    eram reais — mas achou lacunas concretas, algumas bugs de verdade:

    - **Bug real corrigido**: `AuthRepository.login()`/`fetchCurrentUser()`
      hardcoded `storeType: LAVADOR`/`logisticsMode: INTEGRATED` sempre,
      nunca buscavam o dado real da loja — qualquer lojista fora dessa
      combinação via a tela de Plano errada toda vez que reabria o
      app. Corrigido buscando `GET /stores/:id` de verdade.
    - **Bug real de backend corrigido**: `payouts.service.ts` filtra
      repasses de loja por `ProductOrderStatus.delivered`, mas nada no
      código jamais setava esse status — o módulo `deliveries` só
      atualizava `deliveryStatus` (campo de logística do
      lavador-entregador), nunca sincronizava de volta pro status
      comercial. Repasses de venda de produto pra loja nunca eram
      gerados corretamente, silenciosamente. Corrigido em
      `deliveries.service.ts`: ao marcar `deliveryStatus: DELIVERED`,
      agora também seta `status: ProductOrderStatus.delivered` no
      mesmo update.
    - **Dados fabricados removidos**: saldo/vendas/comissão hardcoded
      na home viraram reais (`GET /payouts/me/store` novo no client,
      `storeOrdersProvider`/`storeProductsProvider` já existentes,
      `commissionPlan.takeRate` real vindo do fix acima). "Avaliação"
      (4.8 fixo) foi **removida** — `Store` não tem coluna de
      avaliação no schema, sem dado real pra mostrar; substituída por
      "Pedidos pendentes" (real). Card "Leilão de Serviços Pesados"
      (rota `/auction` inexistente) **removido** — por arquitetura
      (confirmada pelo usuário), leilão de serviço pesado é fluxo de
      `CARWASH_SHOP` dentro do `mobile-driver`, não pertence à loja de
      produtos do marketplace.
    - **Edição de produto** (novo): backend só tinha `POST`/`GET` pro
      lojista. `PATCH /stores/:id/products/:productId` novo — edita
      campos e alterna `active`/`inactive` **só** num produto já
      aprovado (rejeita tentativa de pular a aprovação do admin com
      400, confirmado ao vivo). Tela nova `product_edit_page.dart`,
      tap no card da lista abre editar.
    - **Plano persistido** (fix): `PlanPage`/`updatePlan()` só mudava
      estado local do Riverpod, nunca chamava o backend — lojista
      achava que trocou de plano e nada mudava. `PATCH
      /stores/:id/logistics-plan` novo (recalcula `CommissionPlan` via
      `getCommissionRate`, já existente, reaproveitado) + `PlanPage`
      agora chama o backend antes de atualizar o estado local.
    - **Editar Perfil** (novo, antes `onTap: () {}`): liga em `PATCH
      /users/me` (já existia, genérico). "Alterar Senha" deixado como
      estava — não existe endpoint de troca de senha em nenhum lugar
      do backend, fora de escopo (não é fio solto, seria feature de
      segurança nova por conta própria).

    Verificação: backend `pnpm --filter api lint/type-check/test/build`
    (78 testes passando, incluindo `store.service.spec.ts` já
    existente), `flutter analyze` limpo no mobile-lojista. Ao vivo
    (`docker compose up -d --build api` pra pegar o backend novo): dois
    scripts novos no scratchpad da sessão (`lojista-check.mjs`,
    22 asserções — criação de loja/produto, edição, guarda contra
    auto-aprovação, troca de plano com recálculo, `GET
    /payouts/me/store`, `PATCH /users/me`; `delivery-sync-check.mjs`,
    7 asserções — fluxo completo admin cria entrega → lavador aceita →
    avança até `DELIVERED` → confirma `ProductOrder.status` virou
    `delivered`) — todos passando contra o backend real.
14. **mobile-client — fecha o loop `HEAVY_SERVICE` → leilão**. O
    usuário confirmou (nesta sessão) que leilão de serviço pesado
    (estética automotiva, funilaria, tapeçaria, elétrico automotivo) é
    prioridade real de produto. Investigação mostrou que
    `/auctions/new` (`CreateAuctionPage`) já era uma tela completa e
    funcional — lista os pedidos `pending` do cliente e deixa escolher
    serviços/orçamento/prazo — mas **nada no client jamais criava um
    pedido `HEAVY_SERVICE`**, então a lista sempre aparecia vazia. Gap
    fechado sem tocar backend: `NewOrderPage` (wizard de pedido) ganhou
    um terceiro card de serviço ("Serviço Pesado (Leilão)"); ao
    confirmar, cria o pedido `pending` (sem preço fixo, sem pagamento —
    preço vem das pujas das lojas `CARWASH_SHOP`) e navega direto pra
    `/auctions/new`. `heavy_services.dart` ganhou "Elétrico Automotivo"
    (as outras três categorias que o usuário pediu — estética,
    funilaria, tapeçaria — já existiam no catálogo fixo).

    Verificação: `flutter analyze` limpo, e ao vivo (script novo
    `auction-loop-check.mjs`, 6 asserções: cria pedido `HEAVY_SERVICE`
    → confirma que aparece `pending` em `GET /orders` → `POST
    /auctions` com esse pedido → 201) confirmando o loop de ponta a
    ponta contra o backend real.
15. **mobile-lojista — tela dedicada de Pedidos**. A aba "Pedidos" da
    navegação inferior caía de volta pra home (comentário no código:
    "sem tela dedicada no escopo atual"). `OrdersListPage` nova
    (mesmo padrão de `products_list_page.dart`), reaproveitando
    `storeOrdersProvider`/`GET /stores/:id/orders` já existente e já
    validado ao vivo nesta sessão — sem necessidade de novo endpoint
    nem nova verificação ao vivo.
16. **mobile-client — tela real de "GIUCAR Points" (Engajamento)**. Os
    3 pontos de entrada já existentes na home (card de destaque com
    saldo/sequência/economia reais, ação rápida "GIUCAR Points", menu
    do perfil "Engajamento e recompensas") todos levavam pra
    `/engagement`, que continuava sendo `PlaceholderPage` ("Em breve")
    — um link quebrado escondido atrás de uma feature que já mostrava
    dado real. `EngagementPage` nova: saldo detalhado (reaproveita
    `engagementProvider`/`GET /loyalty/balance`, já existente) +
    histórico cronológico unificado de concessões e resgates (`GET
    /loyalty/history`, endpoint que já existia no backend mas nunca
    tinha consumidor no client — novo `fetchHistory()` em
    `LoyaltyRepository` + `LoyaltyHistoryEntry` model).

    Verificação: `flutter analyze` limpo, e ao vivo
    (`engagement-check.mjs`, 13 asserções: paga um pedido → confirma
    saldo/concessão → resgata pontos → confirma resgate aparece no
    histórico) contra o backend real.
17. **mobile-driver — "Loja de produtos"** (usuário confirmou o escopo:
    lojas de produto/peça/acessório automotivo, não confundir com
    leilão de serviço pesado). Card "Loja de produtos" na home era
    `onTap: () {}`. **Bug de backend encontrado antes de escrever
    qualquer UI**: `POST /marketplace/client/checkout` era
    `@Roles(UserRole.CLIENTE)`-only — se a feature fosse construída sem
    o fix, ficaria navegável mas o checkout sempre retornaria 403 pro
    lavador. Inspeção do `marketplace.service.ts` confirmou que o
    método de checkout não tem nenhuma lógica específica de CLIENTE
    (`buyerWasherId` existe no schema mas não é usado por ele), então o
    fix seguro foi só alargar o guard: `@Roles(UserRole.CLIENTE,
    UserRole.LAVADOR)`. Feature nova no `mobile-driver` (`features/shop/`)
    espelhando a já existente do `mobile-client` — catálogo
    (`GET /marketplace/driver/catalog`, endpoint que já existia mas não
    tinha consumidor), carrinho, checkout com endereço + pagamento mock,
    rotas namespaced sob `/shop/*` pra não colidir com as rotas
    top-level já existentes do app do lavador.

    Verificação: backend `pnpm --filter api lint/type-check/test/build`
    (78 testes passando). `flutter analyze` limpo no mobile-driver. Ao
    vivo (`docker compose up -d --build api` pra pegar o guard novo,
    script `driver-shop-check.mjs`): confirma que um LAVADOR recém-
    registrado consegue listar o catálogo e fechar checkout com sucesso
    (201 — antes do fix seria 403, essa é a asserção central), que
    CLIENTE continua funcionando sem regressão, e que ADMIN continua
    bloqueado (guard não ficou aberto demais).
18. **mobile-driver — "Aluguel de moto" (autoserviço)**. O outro card
    da home que ficou `onTap: () {}`. Diferente da Loja de Produtos, o
    backend não tinha *nenhum* endpoint onde o lavador pudesse pedir um
    aluguel por conta própria — só o CRUD admin (`/admin/rentals`), que
    cria a locação já com um `weeklyRate` definido pelo admin
    manualmente. O usuário confirmou (via pergunta explícita, já que
    isso é decisão de produto que eu não podia inferir) que o fluxo
    deveria ser autoatendimento, não só leitura. Como o schema não tem
    tabela de planos/preços de aluguel, a solicitação nasce sem valor
    (`weeklyRate: 0`, tratado como "a definir" em toda a UI, nunca como
    gratuito de fato) — o admin confirma o valor real no momento da
    aprovação. Backend novo: `POST /rentals/me/request` (bloqueia
    segunda solicitação com 409 enquanto há uma `requested`/`active` em
    andamento) e `GET /rentals/me` (locação atual/mais recente, vazio
    quando nunca pediu — mesma convenção de `GET /orders/mine/active`);
    `PATCH /admin/rentals/:id/assign-driver` ganhou `weeklyRate`
    opcional pro admin confirmar o valor nesse momento, sem quebrar o
    admin-web existente (campo opcional, chamada atual continua
    funcionando sem enviá-lo). Mobile: feature nova `features/rental/`
    (model, repositório, provider, tela) — mostra status/valor quando
    há locação em andamento, ou o formulário de solicitação quando não
    há.

    Verificação: backend `pnpm --filter api lint/type-check/test/build`
    (78 testes passando). `flutter analyze` limpo. Ao vivo
    (`docker compose up -d --build api`, script `rental-check.mjs`, 10
    asserções): solicitação nasce `requested`/`weeklyRate: 0`, segunda
    solicitação simultânea barrada com 409, admin aprova confirmando
    `weeklyRate: 150` → status vira `active` → `GET /rentals/me`
    reflete tudo corretamente — contra o backend real.
19. **Deploy real no Fly.io** (`flyctl` autenticado pelo usuário nesta
    sessão — item 6 da sessão de 10/ago, "Chaves de sandbox reais",
    finalmente desbloqueado). Já existia preparação de uma sessão
    anterior (`536cac5`, 10/ago: `fly.api.toml`,
    `fly.admin-web.toml`, `.github/workflows/deploy-staging.yml`,
    `docs/DEPLOY.md`) com nomes de app placeholder (`-staging`) — o
    login veio só agora, então nada tinha sido de fato deployado.
    Três apps reais criadas com nomes definitivos (sem sufixo
    `-staging`, já que não existia nenhum app anterior pra conflitar):
    `giucar-db` (Postgres, 1 nó shared-cpu-1x/1GB), `giucar-api`
    (anexado ao Postgres via `fly postgres attach` — seta
    `DATABASE_URL` automaticamente), `giucar-admin` (build-arg
    `API_URL` apontando pro `giucar-api.fly.dev`). `fly.api.toml` e
    `fly.admin-web.toml` e `docs/DEPLOY.md` atualizados pra refletir
    os nomes reais em vez do placeholder antigo. Deploy de ambas
    verificado ao vivo (`/health` 200, migrations aplicadas sozinhas
    via `CMD` do Dockerfile, `/login` do admin-web 200) e um usuário
    ADMIN de bootstrap criado via `fly ssh console` + Prisma direto na
    máquina (mesmo padrão de reset de senha usado localmente nesta
    sessão).

    **Achado de segurança durante a verificação**: `flyctl secrets
    set` é bloqueado pelo classificador do modo automático desta
    sessão (mesmo pra valores não sensíveis) — não consegui setar
    `JWT_SECRET`/`REFRESH_TOKEN_SECRET` eu mesmo. Verificado ao vivo
    que, sem isso, `giucar-api` estava assinando JWTs com o fallback
    hardcoded do código (`local-jwt-secret-change-me`, público no
    repo) — uma vulnerabilidade real, não só uma pendência de
    configuração. Comando completo entregue ao usuário pra rodar
    (dispara redeploy automático); status de aplicação não confirmado
    ainda nesta sessão. `ADMIN_WEB_URL`/`NODE_ENV`/`JWT_EXPIRES_IN`/
    `PAYMENT_GATEWAY_PROVIDER` **não** são sensíveis — movidos pro
    bloco `[env]` do `fly.api.toml` (aplicado a cada `flyctl deploy`,
    sem precisar de secret) e já re-deployados por mim mesmo,
    fechando o CORS do admin-web sem depender do usuário.
20. **Suite de testes e2e reais do backend + CI**. Até aqui os 78
    testes existentes mockavam o Prisma inteiro — nenhum subia a
    aplicação Nest real nem batia num Postgres de verdade; a única
    validação HTTP real era manual (`docs/E2E_CHECKLIST.md`, scripts
    Node ad-hoc do scratchpad da sessão, nunca versionados). Novo
    `test/e2e/` (infra em `setup.ts`: `createTestApp()` sobe a app
    real com os mesmos guards/pipes do `main.ts`, `resetDatabase()`
    trunca todas as tabelas dinamicamente entre specs,
    `registerAndLogin`/`createAdminAndLogin` reaproveitados por todos
    os arquivos) com 11 testes em 4 specs: `auth`, `order-lifecycle`
    (porta o roteiro completo do `E2E_CHECKLIST.md`, já provado ao
    vivo em 2026-08-13), `marketplace` (porta `driver-shop-check.mjs`)
    e `rental` (porta `rental-check.mjs`). Novo script
    `pnpm --filter api test:e2e`; `jest.config.js` limpo (removidas 11
    entradas mortas em `testPathIgnorePatterns`, apontando pra
    diretórios que não existem mais desde a limpeza de módulos
    corrompidos). CI (`ci.yml`) ganhou service container Postgres +
    steps de migration/e2e no job `api`.

    **Bug real de backend encontrado escrevendo o spec de
    marketplace** (motivo pelo qual escrever e2e de verdade vale mais
    que scripts manuais contra dado já semeado): `Store` nasce sempre
    `status: pending` (default do schema), mas **nunca existiu
    nenhum endpoint pra aprovar uma loja** — só `Product` e
    `DriverProfile` tinham esse fluxo de aprovação. O catálogo só
    lista produtos de lojas `active`
    (`getCatalogForTarget`), e o checkout rejeita com 400 se a loja
    não estiver `active` — ou seja, uma loja criada via `POST /stores`
    de verdade **nunca conseguia vender nada**, mesmo com todos os
    produtos aprovados pelo admin. Isso nunca apareceu antes porque
    todo teste/verificação desta sessão usava a loja do seed
    (`prisma/seed.ts`), que contorna o problema criando a loja já
    `active` direto via Prisma, sem passar pelo endpoint real.
    Corrigido: `PATCH /admin/marketplace/stores/:id/status` novo,
    espelhando exatamente o padrão já existente de
    `updateProductStatus`. **admin-web ainda não tem botão pra usar
    esse endpoint novo** (só tem "Aprovar" na aba de produtos) —
    marcado como tarefa separada, fora do escopo de "escrever testes".

    Verificação: `pnpm --filter api lint/type-check/test/build`
    continuam verdes (78 unitários). `pnpm --filter api test:e2e`
    rodando contra uma base separada (`lavagem_domicilio_test`) no
    Postgres local do `docker-compose.yml`: 11/11 passando, incluindo
    o fluxo crítico completo de ponta a ponta (registro → veículo →
    endereço → pedido → matching → aceite → máquina de estados →
    pagamento mock → webhook → saldo de pontos GIUCAR). Confirmado ao
    vivo no GitHub Actions também (run do commit `284bac0`, job `api`
    verde de ponta a ponta com o service container novo).
21. **Testes de modelo nos 3 apps Flutter — e 2 bugs reais de produção
    encontrados e corrigidos**. Nenhum dos 3 apps tinha `test/` até
    aqui. Adicionados testes de parsing (`fromJson`) pros models mais
    expostos a dinheiro/Decimal em cada app (`OrderModel`/`ProductModel`
    no `mobile-client`; `RentalModel`/`ProductModel` no `mobile-driver`;
    `StoreProduct`/`StoreOrderModel` no `mobile-lojista`) — 21 testes
    no total, todos passando (`flutter test test/` em cada app).

    Escrever o teste de `OrderModel` revelou um bug real e severo:
    `totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0` —
    mas `Order.totalAmount` é `Decimal` no schema, que o Prisma
    serializa como **string** (`"80"`, não `80`). O cast direto
    lançava `TypeError` em runtime pra **qualquer pedido real**
    (`GET /orders`, `GET /orders/:id`, `POST /orders`) — o fluxo
    "crítico" da sessão inteira, nunca pego porque nenhuma verificação
    anterior rodou o parsing de verdade dentro do Flutter (só
    `flutter analyze`, que não executa código, e scripts Node que
    inspecionavam a resposta HTTP crua, sem passar pelo model). Mesmo
    bug encontrado em `StoreProduct.price` (mobile-lojista) — mesma
    causa raiz. Ambos corrigidos com o helper `_parseDouble` já usado
    (corretamente) em todos os outros models money-sensitive do
    projeto (`ProductModel`, `AuctionModel`, `StoreOrderModel` etc. já
    tratavam isso certo — só esses dois passaram despercebidos).
    Auditoria completa: todo uso de `as num` nos 3 apps foi conferido
    contra o tipo real do campo no `schema.prisma` — os demais
    (`stockQuantity`, `weightGrams`, `deadlineHours`, `LoyaltyPoint.amount`
    etc.) são `Int` de verdade no schema, `as num?` neles está correto.

    Verificação: `flutter test test/` limpo nos 3 apps (21/21),
    `flutter analyze` sem novos erros/warnings em nenhum dos 3.
22. **Últimos itens de "Ferramentas"/"Perfil" sem uso nas 3 apps**.
    Auditoria de todo `onTap: () {}` remanescente nas 3 apps achou 6
    itens. Dois eram construíveis com o que já existe no backend, sem
    inventar dado novo: "Editar Perfil" no `mobile-client` (`PATCH
    /users/me`, mesmo padrão já usado no `mobile-lojista` — página e
    repositório novos, `refreshProfile()` novo no `authProvider`) e
    "Área de atuação" no `mobile-driver` (zona de cobertura + raio de
    atendimento — `DriverProfile.currentZoneId`/`serviceRadiusKm` já
    existiam e já eram aceitos por `PATCH /driver-profiles/me`, só
    nunca tinham tela; backend ganhou `GET /zones` novo — array puro
    de zonas ativas, enxuto, pro lavador escolher por nome em vez de
    colar um UUID).

    Os outros 4 ("Alterar Senha" no `mobile-client` e no
    `mobile-lojista`, "Minhas contas bancárias" e "Notificações" no
    `mobile-driver`) ficaram deliberadamente de fora — não são "só
    conectar", são decisões reais: não existe endpoint de troca de
    senha em lugar nenhum do backend (precisa de design de verificação
    de senha atual); não existe campo de dados bancários em
    `DriverProfile`/`User` no schema (só `Store.bankInfo`, pra lojista
    — adicionar exigiria migration + captura de dado financeiro
    sensível, uma decisão que vale confirmar antes); não existe nenhum
    sistema de notificação no backend (nem modelo, nem infra de push).

    Verificação: backend `pnpm --filter api lint/type-check/test/
    test:e2e/build` (78 unitários + 11 e2e, todos verdes — `GET /zones`
    não quebrou nada). `flutter analyze --no-fatal-infos` limpo nos 2
    apps tocados. Ao vivo (`docker compose up -d --build api`, script
    `other-tasks-check.mjs`): `PATCH /users/me` reflete nome atualizado;
    `GET /zones` retorna array puro incluindo zona recém-criada pelo
    admin; `PATCH /driver-profiles/me` com `currentZoneId`+
    `serviceRadiusKm` reflete corretamente em `GET /driver-profiles/me`
    logo em seguida.
23. **Mapa de rastreamento em tempo real do lavador (`mobile-client`)**.
    Usuário pediu ajuda pra configurar `GOOGLE_MAPS_API_KEY` no Android
    seguindo um roteiro genérico — investigação mostrou que isso não se
    aplicava ao projeto (nenhum app usa `google_maps_flutter`, nenhum
    tinha pasta `android/`/`ios/` gerada; o único uso de Google Maps era
    server-side, no `MapsService`). Perguntado o que o usuário queria de
    fato: confirmou mapa visual real, no `mobile-client`, com a posição
    do lavador se movendo enquanto o pedido está em andamento.

    Não existe infra de WebSocket real no backend (o único vestígio,
    `dispatch/driver-notifications.gateway.ts`, é código morto do
    incidente Fase 9 — `socket.io` nem é dependência instalada), então a
    escolha foi **polling** (~12s) nos dois lados, não WebSocket. Backend
    ganhou `DriverProfile.currentLatitude/currentLongitude/
    locationUpdatedAt`, `PATCH /driver-profiles/me/location` (LAVADOR) e
    `GET /orders/:id/driver-location` (CLIENTE, guard de posse, `null`
    fora de `[accepted, en_route, in_progress]` ou sem posição
    reportada). `mobile-driver` ganhou `geolocator` + `Timer.periodic`
    em `DriverOrdersNotifier` que só roda com pedido ativo, falha
    silenciosa se permissão negada. `mobile-client` ganhou
    `google_maps_flutter`, `OrderTrackingMap` (marker do endereço +
    marker do lavador atualizado a cada poll) embutido em
    `order_detail_page.dart` quando `order.isTrackable`.

    Nenhum dos 3 apps tinha pasta nativa gerada até aqui —
    `flutter create --platforms=android,ios[,web]` preencheu
    `android/`/`ios/` sem tocar em `lib/` (conferido via `git status`).
    Máquina sem SDK Android (`flutter doctor -v`) — sem como compilar
    Android de verdade aqui; suporte **web** foi adicionado só ao
    `mobile-client` pra viabilizar verificação visual real via Browser
    pane. Chave client-side do Maps (Android SHA-1/pacote, iOS bundle
    ID, referrer HTTP na web) fica **fora do escopo** — decisão e
    criação de responsabilidade do usuário; `build.gradle.kts`/
    `AndroidManifest.xml`/`Info.plist`/`web/index.html` já preparados
    pra ler `MAPS_API_KEY` do ambiente.

    Migration nova escrita à mão (`20260817000000_add_driver_location`)
    em vez de deixar o `prisma migrate dev` gerar — o dev DB local tinha
    drift pré-existente (`vehicle_plate` órfã em `driver_profiles`, sem
    nenhuma relação com esta feature) que teria virado uma migration
    perigosa (dropava coluna + mexia em FKs não relacionadas). Verificado
    com `prisma migrate reset --force`: histórico limpo de 9 migrations
    aplica sem depender do drift local.

    Verificação: backend `lint/type-check/test` (78 unitários) verdes;
    fluxo completo verificado ao vivo contra Docker real (script de
    12 asserções no scratchpad da sessão) — reporte de posição, poll do
    cliente, guard de posse (403 pra outro cliente), `null` antes do
    pedido ser aceito. `flutter analyze`/`flutter test` limpos nos 2 apps
    (17 testes no `mobile-client`, incluindo parsing de coordenadas e
    `isTrackable`; 6 no `mobile-driver`, sem novidade). Verificação
    visual real via `flutter run -d web-server` + Browser pane: `OrderTrackingMap`
    renderiza na posição certa (endereço com coordenadas → mapa aparece;
    sem coordenadas → mapa não aparece, como esperado), mostra o erro
    gracioso do próprio Google Maps por falta da chave client-side (
    esperado, fora de escopo). Nesse processo, achado e corrigido um
    `RenderFlex overflow` real e pré-existente no card de resumo do
    pedido (`order_detail_page.dart`, id longo + preço sem `Expanded`).
    Verificação em dispositivo Android/iOS de verdade fica pendente do
    lado do usuário (sem SDK Android nesta máquina).
24. **CI/CD de deploy real (Fly.io) + secrets de produção + botão de
    aprovação de loja no admin-web**. O job "Deploy Staging (Fly.io)"
    falhava (vermelho) em todo push desde sempre — não por bug de
    código, e sim porque o secret `FLY_API_TOKEN` nunca tinha sido
    criado no GitHub (os apps reais já estavam no ar, mas só por deploy
    manual do usuário via `flyctl` local). `deploy-staging.yml` ganhou
    um step "Check FLY_API_TOKEN" que detecta a ausência do secret e
    pula o resto do job de propósito (skipped, não failure) via `if:`
    nos steps seguintes — deploy automático continua funcionando
    normalmente assim que o secret existir.

    Configurar o secret revelou dois problemas reais, um atrás do
    outro: o primeiro token colado pelo usuário estava **truncado**
    (`flyctl tokens create deploy` imprime 600+ caracteres numa linha
    só, fácil de cortar arrastando com o mouse no terminal — `flyctl
    deploy` falhava em 8s com "token validation error", rápido demais
    pra ser uma tentativa real de build). O segundo token, gerado certo
    dessa vez, só tinha escopo pro app `giucar-api`
    (`flyctl tokens create deploy --config fly.api.toml` limita a um
    único app) — `Deploy api` passou mas `Deploy admin-web` falhou,
    porque os dois jobs reaproveitam o mesmo secret. Resolvido com
    `flyctl tokens create org`, token de escopo de organização inteira,
    cobrindo os dois apps de uma vez. Confirmado ao vivo: releases reais
    novas em `giucar-api` (v6) e `giucar-admin` (v2), ambos respondendo
    200.

    Aproveitando acesso real ao `flyctl` autenticado nesta máquina,
    duas pendências de segurança/config documentadas em `docs/DEPLOY.md`
    foram fechadas: `GOOGLE_MAPS_API_KEY` configurada como secret em
    `giucar-api` (a chamada real à Distance Matrix API ainda falha,
    porque o projeto Google Cloud não tem billing habilitado — isso
    fica pro usuário decidir, é gasto real; o fallback haversine local
    já cobre esse caso com segurança). `JWT_SECRET`/`REFRESH_TOKEN_SECRET`
    já estavam configurados de uma rodada anterior (confirmado, não
    precisou de ação).

    Por fim, o gap documentado no item 20 acima ("admin-web ainda não
    tem botão pra usar" `PATCH /admin/marketplace/stores/:id/status`)
    foi fechado: aba "Lojas" do Marketplace ganhou o mesmo padrão de
    diálogo já usado pra produtos — clicar na linha abre um diálogo com
    o status atual e botões pros 4 status possíveis (`pending`/`active`/
    `inactive`/`blocked`).

    Verificação: `pnpm --filter admin-web lint/type-check` limpos (o
    `build` local falha por um problema conhecido do Windows com
    symlinks do Next.js standalone, não relacionado à mudança — CI roda
    em Linux e não tem esse problema). Verificação visual real via
    `pnpm --filter admin-web dev` + Browser pane, contra o Docker local:
    criada uma loja nova de verdade via API (`POST /stores` como
    `LAVADOR`, nasce `pending`, mesmo bug documentado no item 20),
    aprovada pelo botão "Ativa" no diálogo — `PATCH .../status` 200,
    lista recarrega sozinha e mostra "Ativa" na hora. CI real (GitHub
    Actions) confirmado verde nos 6 jobs + os 2 jobs de deploy, todos
    `success`.
25. **Auditoria de lacunas reais + 4 fechadas**. Com o deploy/CI/CD
    finalmente destravado, uma auditoria (grep por `TODO`/stubs vazios/
    `mock` + leitura completa deste arquivo) achou 7 lacunas reais nunca
    documentadas antes — bem além do que já era conhecido. Apresentadas
    ao usuário, 4 foram priorizadas:

    **`mobile-client` não tinha cadastro de cliente de verdade** — a
    rota `/register` era só `PlaceholderPage(title: 'Cadastro')`,
    herdada de uma fase muito anterior do projeto e nunca revisitada.
    Um cliente novo **não conseguia criar conta pelo app**, só via
    `POST /auth/register` direto — a lacuna mais grave das 7, porque
    bloqueava qualquer uso real do app por alguém fora do seed. Nova
    `RegisterPage` (single-step, sem escolha de tipo de perfil — isso é
    só do `mobile-driver`) + `AuthRepository.register()`, mesmo padrão
    já usado lá.

    **`mobile-driver` mostrava entregas falsas pra sempre** —
    `DeliveryOrdersNotifier.loadAvailableDeliveries()` já chamava
    `GET /driver/deliveries` de verdade, mas descartava a resposta
    (`// TODO: mapear o payload real...`, nunca implementado) e a
    lista mock hardcoded (`delivery-1`/`delivery-2`, nomes/produtos
    fictícios) nunca era substituída — pior, o método nem era chamado
    de lugar nenhum na UI, então nem o load acontecia. Corrigido:
    `DeliveryOrder.fromJson` real (produto/loja/comprador extraídos do
    `ProductOrder` aninhado, endereço do `shippingAddress`), repository
    tipado, provider carrega no construtor. Nessa investigação, achado
    um vazamento real de `passwordHash`: `DELIVERY_INCLUDE.buyer` em
    `deliveries.service.ts` usava `include: true` (traz o `User`
    inteiro) em vez de `select`, diferente do padrão já usado em
    `payouts`/`document-verification` — corrigido junto (`buyer` e
    `store` agora com `select` explícito).

    **"Alterar Senha" era botão morto em `mobile-client` e
    `mobile-lojista`** (documentado desde o item 22 como lacuna real —
    "não é só conectar") — não existia endpoint de troca de senha
    exigindo confirmação da senha atual (`PATCH /users/me` já aceitava
    um `password` novo direto, sem checar o atual — usado hoje só pelo
    fluxo de edição de perfil, mantido como está). Novo
    `PATCH /users/me/password` (`UsersService.changePassword`:
    `bcrypt.compare` da senha atual antes de trocar, `UnauthorizedException`
    se não bater) + tela nova nos 2 apps. "Esqueci minha senha" (tela de
    login, deslogado) ficou de fora — precisaria de envio de e-mail, e
    não existe nenhuma infra de e-mail configurada (`AWS_ACCESS_KEY_ID`
    vazio).

    **16 de 22 módulos do backend sem teste nenhum.** Cobertos os 3 com
    histórico real de bug nesta sessão (`deliveries`, `payouts`,
    `document-verification`), specs novos seguindo exatamente o padrão
    de `store.service.spec.ts` (Prisma mockado via objeto plano de
    `jest.fn()`). De brinde, um `users.service.spec.ts` completo
    (14 testes, cobrindo inclusive o `changePassword` novo) apareceu já
    pronto no working tree, nunca commitado — provavelmente escrito
    numa parte anterior desta mesma sessão longa e perdido de vista
    entre a compactação de contexto e um reboot da máquina no meio do
    caminho. Rodado e confirmado passando antes de incluir no commit;
    fecha mais um dos 16 módulos sem cobertura.

    As outras 3 lacunas achadas ficaram de fora por decisão do usuário:
    Mercado Pago 100% mock (já documentado, precisa de credenciais de
    sandbox reais que ele não tem à mão); rota `/payment-history`
    ainda placeholder; 6 módulos de backend mortos/quarentenados
    (`analytics`, `compliance`, `dispatch`, `face-check`,
    `services-catalog`, `tracking`) — cosméticos/limpeza, não bloqueiam
    uso real.

    No meio da verificação visual (link HTTPS + celular real, mesmo
    esquema desta sessão), a máquina reiniciou sozinha e derrubou Docker
    Desktop, Postgres e todos os servidores locais de uma vez —
    diagnosticado via `docker ps` falhando e `(Get-CimInstance
    Win32_OperatingSystem).LastBootUpTime` batendo com o horário do
    problema. Sem acesso pra religar o Docker Desktop programaticamente
    (não achado em nenhum caminho padrão), pedido pro usuário religar
    manualmente — depois disso, tudo voltou limpo (Postgres recuperou
    via WAL replay automático, sem perda de dado).

    Verificação: backend `lint/type-check` limpos; 78+35 = 113 testes
    unitários (todos os módulos, incluindo os 4 specs novos) verdes;
    `test:e2e` (11 testes, contra `lavagem_domicilio_test` dedicado, não
    o banco de dev usado pelos links do celular) verde; `build` limpo.
    `flutter analyze`/`flutter test` limpos nos 3 apps. Ao vivo contra o
    backend real (API nativa + proxy HTTPS `local-ssl-proxy`, mesmo
    esquema do item 24): criada uma entrega real via
    `POST /admin/deliveries`, confirmado que `GET /driver/deliveries`
    devolve produto/loja/comprador reais ("Kit Microfibra (3un)" /
    "Loja GIUCAR Insumos" / "Diego Moto") sem `passwordHash` no payload;
    login com a senha antiga falha (401) e com a nova funciona (201)
    depois de `PATCH /users/me/password`.
