# Fase 9 - Modulos com Codigo-Fonte Corrompido/Truncado

## Contexto

Durante o inicio da Fase 9 (DevOps/CI-CD AWS), foi identificado que uma
restauracao anterior do repositorio (`chore: restore project files after
gh-pages cleanup`, commit `6006c04`) deixou uma parte significativa do
codigo-fonte truncada: arquivos `.ts`/`.tsx`/`.dart` com trechos inteiros
faltando no meio de funcoes/classes (imports ausentes, blocos `switch`
incompletos, chaves/parenteses desbalanceados, linhas em branco onde
deveria haver logica).

Como o objetivo da Fase 9 exige que lint/typecheck/test/build **passem de
verdade** no CI, nao seria seguro (nem seria "DevOps") tentar adivinhar e
reescrever milhares de linhas de regras de negocio. A decisao tomada foi:

1. Excluir todo arquivo comprovadamente corrompido do escopo compilado/
   testado pelo CI, via `tsconfig.json` (`exclude`), `.eslintrc.js`
   (`ignorePatterns`), `jest.config.js` (`testPathIgnorePatterns`) e
   `analysis_options.yaml` (`analyzer.exclude`) de cada pacote.
2. **A forma de exclusao varia por pacote** (ver detalhe em cada secao
   abaixo):
   - Em `services/api`, a "quarentena" e **puramente logica**: os modulos
     corrompidos continuam fisicamente em `src/modules/**`, nos mesmos
     caminhos originais, e sao apenas ignorados pelo `tsconfig.json`/
     `.eslintrc.js`/`jest.config.js` do pacote. Nenhum arquivo foi movido.
   - Em `apps/admin-web`, `apps/mobile-client` e `apps/mobile-driver`, os
     arquivos corrompidos **foram fisicamente movidos** para uma pasta
     `_corrupted-quarantine/` (`_corrupted_quarantine/` nos apps Flutter)
     dentro do proprio pacote, alem de excluidos das respectivas
     configs. Isso foi necessario porque o Next.js (App Router) e o
     analyzer do Flutter compilam/analisam tudo dentro de `src/app` e
     `lib/`, respectivamente, entao um `exclude` de config sozinho nao
     seria suficiente para tirar esses arquivos do build/lint.
3. Reconstruir o scaffolding minimo que faltava totalmente (package.json,
   tsconfig, main.ts/app.module.ts, pubspec.yaml etc.) para que o CI tenha
   algo real para compilar/testar.
4. Documentar aqui, arquivo por arquivo, o que foi excluido/isolado e por
   que, deixando explicito em cada caso se houve ou nao movimentacao
   fisica de arquivo.

Nenhum arquivo de codigo de dominio foi apagado. Em `services/api` os
modulos corrompidos permanecem no lugar original (apenas fora do escopo
de build/lint/test); nos demais pacotes, permanecem no repositorio dentro
das pastas de quarentena fisica, para recuperacao manual futura.

## Metodologia de deteccao

Verificacao automatizada (contagem de linhas em branco no meio do arquivo
e balanceamento de chaves/parenteses `{}`/`()`) + leitura manual de uma
amostra de cada modulo para confirmar truncamento real (nao apenas estilo).

---

## 1. `services/api` (NestJS)

### Scaffolding que nao existia e foi reconstruido do zero
- `package.json`, `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`
- `src/main.ts`, `src/app.module.ts`
- `src/database/prisma.service.ts`, `src/database/database.module.ts`
  (referenciados por varios modulos como `@database/database.module` mas
  nunca existiam no repositorio)
- `src/modules/health/*` (novo modulo de health-check, com teste real em
  `test/health.controller.spec.ts`)
- `.eslintrc.js`, `jest.config.js`, `.gitignore`

### `prisma/schema.prisma`
O schema original (1447 linhas) **nao contem blocos `generator` nem
`datasource`** e possui dezenas de trechos em branco no meio das
definicoes de `model` (confirmado via leitura direta). Nao e possivel
gerar o Prisma Client a partir dele. O arquivo original foi preservado em
`services/api/prisma/schema.prisma.corrupted-backup`.

**Atualizacao (rodada de recuperacao do marketplace dual):** o schema
minimo (`model HealthCheck` apenas) foi substituido por um **schema
unificado completo** cobrindo todo o dominio (User, Address, Vehicle,
Driver, Washer, Order, Payment, Store, Product, CommissionPlan, Coupon,
Cashback, Review, SupportTicket, Zone, DocumentVerification, FaceCheck,
StarterKit, Rental, LoyaltyCampaign, CouponCampaign, AnalyticsEvent, etc. —
27 models / 19 enums no total). Ver `docs/BACKEND_RECOVERY_AUDIT.md` secao
3-4 para detalhes e `prisma/migrations/20260723000000_init_unified_schema/`
para a migration correspondente. As migrations antigas incompativeis
(`20250101000000_init`, `20250716000000_admin_fields`) foram renomeadas
para `_legacy_*` (preservadas, nao deletadas, mas nao mais aplicadas).

### Modulos ainda excluidos do build/lint/test (`src/modules/**`)
Todos os modulos abaixo tem arquivos com >10% de linhas em branco em
posicoes que quebram a sintaxe (imports cortados, corpos de metodo
incompletos) e/ou referenciam simbolos/controllers inexistentes.
Excluidos via `tsconfig.json` (`exclude`), `.eslintrc.js`
(`ignorePatterns`) e `jest.config.js` (`testPathIgnorePatterns`):

- `src/modules/analytics/**`
- `src/modules/compliance/**`
- `src/modules/dispatch/**`
- `src/modules/document-verification/**` (Phase B, Prioridade 2 — proximo)
- `src/modules/face-check/**` (Phase B, Prioridade 2 — proximo)
- `src/modules/loyalty/**` (Phase B, Prioridade 2 — proximo)
- `src/modules/rental/**`
- `src/modules/services-catalog/**`
- `src/modules/starter-kit/**`
- `src/modules/support/**`
- `src/modules/tracking/**`
- `src/modules/zones/**`

**`src/modules/drivers/**`, `src/modules/coupons/**` e
`src/modules/payouts/**` saem desta lista nesta rodada (Phase B do master
plan — Prioridade 1):** ver secao "1.2 Recuperacao de `drivers`, `coupons`
e `payouts` (Phase B)" abaixo. Todos os tres continuam usando o mesmo
padrao de evidencia de corrupcao encontrado nos demais modulos ainda
quarentenados: por exemplo, o `coupons.service.ts` original terminava a
linha 9 em `contains: query.search, mode: 'insensitive' } },` e a linha
seguinte ja iniciava `const skip = ...`, sem fechamento do objeto/where
anterior; `drivers.service.ts`/`payouts.service.ts` originais
referenciavam modelos inexistentes no schema recuperado (`driverProfile`,
`dispatchAttempt`, `Wallet`) e um guard importado de
`@modules/auth/guards/...`, que nunca existiu no repositorio.

**`src/modules/marketplace/**` saiu desta lista nesta rodada**: estava
corrompido (helpers duplicados, classes referenciadas mas nunca
declaradas, chaves desbalanceadas — ver `docs/BACKEND_RECOVERY_AUDIT.md`),
e foi **totalmente reescrito** contra o novo schema dual
(`Store`/`Product`/`CatalogTarget`/`CommissionPlan`), substituindo o
modelo antigo (`Supplier`/`StorePlan`/`washer`|`customer`). Um modulo novo,
`src/modules/store/**`, foi criado para cadastro de lojista e produtos.
Ambos agora fazem parte do build/lint/test normal (incluidos em
`app.module.ts`, `tsconfig.json`, `.eslintrc.js`, `jest.config.js`).

**`src/modules/orders/**` e `src/modules/users/**` saem desta lista
nesta rodada (Fase 9 — recuperacao do core do produto):** ambos estavam
truncados (controllers/services/DTOs referenciando modelos inexistentes
no schema recuperado, como `profile`, `driverProfile`, `statusHistory`,
chat/conversas, guard importado de `@modules/auth/guards/...` que nunca
existiu) e foram **totalmente reescritos** contra o schema unificado
(`User`, `UserRole`, `UserStatus`, `Order`, `OrderStatus`, `OrderItem`,
`Vehicle`, `Address`, `Washer`, `WasherStatus`, `Zone`), reaproveitando os
guards/decorators reais do projeto (`JwtAuthGuard`, `RolesGuard`, `Roles`,
`CurrentUser`). Ver secao "5. Recuperacao de `orders` e `users`" abaixo
para o detalhamento completo de endpoints e logica de matching. Ambos
agora fazem parte do build/lint/test normal (incluidos em
`app.module.ts`, `tsconfig.json`, `.eslintrc.js`, `jest.config.js`).

### Plano de recuperacao sugerido
1. Restaurar cada modulo a partir do historico de commits anterior ao
   `6006c04` (se existir em outro branch/backup) ou reescrever a partir das
   specs de negocio da Fase correspondente (Fase 2 a Fase 8).
   `git log` no branch atual so mostra `95d2a82 Initial commit` e
   `6006c04 chore: restore project files after gh-pages cleanup`, ou seja,
   nao ha commit anterior integro dentro deste repositorio local.
2. Apos reconstruir cada modulo, remover a entrada correspondente do
   `exclude`/`ignorePatterns`/`testPathIgnorePatterns` e adicionar testes
   unitarios reais antes de reabilita-lo no CI.
3. ~~Reconstruir `prisma/schema.prisma` a partir do backup + specs de
   dominio, depois rodar `prisma migrate dev` para validar.~~ **Feito**
   nesta rodada (schema unificado + migration manual; falta rodar
   `prisma migrate dev`/`validate` de fato em uma maquina com Node, ja que
   esta maquina nao tem Node instalado).
4. ~~Priorizar `orders` e `users` nas proximas rodadas — sao o core do
   produto e os modulos mais corrompidos (ver
   `docs/BACKEND_RECOVERY_AUDIT.md`).~~ **Feito nesta rodada** — ver
   secao 1.1 abaixo.

### 1.1 Recuperacao de `orders` e `users` (core do produto)

Os dois modulos foram reescritos do zero contra o schema Prisma
recuperado (`prisma/schema.prisma`), reaproveitando os guards/decorators
ja existentes em `src/common/` (`JwtAuthGuard`, `RolesGuard`, `Roles`,
`CurrentUser`). Nenhuma regra de negocio nao documentada foi inventada:
onde o comportamento do arquivo truncado nao podia ser inferido com
seguranca (ex.: chat/mensagens entre cliente e lavador, historico de
status em tabela separada), a funcionalidade foi omitida em vez de
adivinhada, ja que o schema recuperado nao contem os modelos
correspondentes (nao ha `Conversation`/`Message`/`OrderStatusHistory`).

#### `src/modules/users/**`
- `users.module.ts` — registra `UsersController`, `AdminUsersController`
  e `UsersService`.
- `users.controller.ts` (`/users`, protegido por `JwtAuthGuard`):
  - `GET /users/me` — perfil do usuario autenticado (inclui enderecos,
    veiculos, perfil de motorista/lavador e saldo de cashback).
  - `PATCH /users/me` — atualiza nome/telefone/avatar/senha (hash via
    `bcryptjs`).
  - `DELETE /users/me` — soft-delete (marca `status = inactive`, nao
    apaga o registro).
- `users.admin.controller.ts` (`/admin/users`, protegido por
  `JwtAuthGuard` + `RolesGuard` + `Roles(ADMIN)`):
  - `GET /admin/users` — lista paginada com filtros por `role`, `status`
    e busca textual (nome/e-mail).
  - `GET /admin/users/:id` — detalhes de um usuario.
  - `PATCH /admin/users/:id/status` — ativa/inativa/bloqueia usuario.
  - `PATCH /admin/users/:id/role` — troca de role, com trava para nao
    remover o ultimo `ADMIN` do sistema.
  - `DELETE /admin/users/:id` — bloqueia a conta (`status = blocked`).
- `users.service.ts` — contem tambem `createUser()` (hash de senha +
  checagem de e-mail duplicado), exportado para uso futuro por um modulo
  de autenticacao (ainda nao existe `src/modules/auth/**` no
  repositorio). Todas as respostas removem `passwordHash` antes de
  retornar ao cliente.
- `dto/create-user.dto.ts`, `dto/update-user.dto.ts` — validacao via
  `class-validator`, usando os enums `UserRole`/`UserStatus` do
  `@prisma/client`.

#### `src/modules/orders/**`
- `orders.module.ts` — registra `OrdersController`,
  `AdminOrdersController` e `OrdersService`.
- `orders.controller.ts` (`/orders`, protegido por `JwtAuthGuard` +
  `RolesGuard`):
  - `POST /orders` (`CLIENTE`) — cria pedido a partir de
    `vehicleId` + `addressId` + itens (`CreateOrderDto`), calcula
    `totalAmount`, resolve a `Zone` do endereco quando aplicavel e
    dispara o matching de lavador automaticamente.
  - `GET /orders` (`CLIENTE`) — lista os pedidos do proprio cliente
    (paginacao por cursor, filtro por `status`).
  - `GET /orders/:id` (`CLIENTE`) — acompanha um pedido especifico
    (valida que o pedido pertence ao usuario autenticado).
  - `PATCH /orders/:id/cancel` (`CLIENTE`) — cancela o proprio pedido.
  - `PATCH /orders/:id/accept` (`LAVADOR`) — lavador aceita um pedido em
    `searching_washer`, passando para `accepted`.
  - `PATCH /orders/:id/status` (`LAVADOR`) — avanca o status do pedido
    atribuido a ele (`en_route` → `in_progress` → `completed`, ou
    `cancelled`), respeitando a maquina de estados.
- `orders.admin.controller.ts` (`/admin/orders`, `Roles(ADMIN)`):
  - `GET /admin/orders` — lista com filtros (`status`, `washerId`,
    `search`, intervalo de datas) e paginacao por pagina/limite.
  - `GET /admin/orders/:id` — detalhes de um pedido.
  - `PATCH /admin/orders/:id/assign-washer` — atribui manualmente um
    lavador ao pedido.
  - `PATCH /admin/orders/:id/status` — forca a transicao de status
    (admin ignora a maquina de estados restrita ao fluxo do cliente).
- `orders.service.ts`:
  - Maquina de estados (`ALLOWED_TRANSITIONS`):
    `pending → searching_washer → accepted → en_route → in_progress →
    completed`, com `cancelled` disponivel em qualquer etapa anterior a
    `completed`. Transicoes fora dessa tabela sao rejeitadas
    (`BadRequestException`) para chamadas nao-admin.
  - **Matching lavador x cliente** (`matchWasher`): (1) filtra lavadores
    com `WasherStatus.active` e, quando o pedido tem `zoneId` resolvido,
    restringe a `Washer.currentZoneId` igual a do pedido; (2) dentre os
    candidatos, calcula a distancia haversine entre o endereco do pedido
    e o endereco padrao (`isDefault`) de cada lavador e escolhe o mais
    proximo dentro do `Washer.serviceRadiusKm`; lavadores sem endereco
    com coordenadas entram como fallback por ordem de chegada. O pedido
    sempre migra para `searching_washer`, mesmo sem match imediato, para
    permitir aceite manual depois.
  - `resolveZoneId` — quando o cliente nao informa `zoneId`, tenta
    resolver a `Zone` ativa cujo `neighborhoods` contenha o bairro do
    endereco (mesma cidade/estado).
- `dto/create-order.dto.ts` — `vehicleId`, `addressId`, `zoneId?`,
  `scheduledAt?`, `notes?`, `items[]` (nome/preco/quantidade).
- `dto/update-order-status.dto.ts` — `UpdateOrderStatusDto` (usado por
  lavador/admin) e `CancelOrderDto` (usado pelo cliente).
- `dto/order-response.dto.ts` — shape de resposta documentado no
  Swagger (nao substitui validacao de entrada).
- `dto/list-orders.dto.ts` — `ListOrdersDto` (cliente, cursor-based) e
  `AdminListOrdersDto`/`AdminAssignWasherDto` (admin, paginacao
  pagina/limite).

Os DTOs antigos `admin-order.dto.ts`, `admin-orders.dto.ts` e
`chat.dto.ts` foram removidos: os dois primeiros foram consolidados em
`list-orders.dto.ts`; o terceiro (`SendMessageDto`) dizia respeito a um
sistema de chat que nao existe no schema recuperado (sem
`Conversation`/`Message`), entao foi descartado em vez de mantido como
codigo morto ou reintroduzido sem lastro no schema.

### 1.2 Recuperacao de `drivers`, `coupons` e `payouts` (Phase B — Prioridade 1)

Mesma metodologia da secao 1.1: os tres modulos foram **reescritos do
zero** contra o schema Prisma recuperado, reaproveitando
`JwtAuthGuard`/`RolesGuard`/`Roles`/`CurrentUser` de `src/common/`. Nenhuma
regra de negocio nao documentada foi inventada — onde o arquivo truncado
referenciava um conceito sem lastro no schema (ex.: `driverProfile`,
`dispatchAttempt`, `Wallet`, taxa de comissao de lavador), a
funcionalidade foi reconstruida com base apenas no que o schema realmente
suporta.

#### `src/modules/drivers/**` (onboarding e perfil do lavador)
Cobre o model `Washer` (perfil do lavador que atende pedidos de servico —
complementa `users`/`orders`). O model `Driver` (motorista/logistica de
aluguel de moto) nao tem modulo dedicado nesta rodada; ficou fora do
escopo pedido ("onboarding e perfil **do lavador**").
- `drivers.module.ts` — registra `DriversController` e
  `AdminWashersController`.
- `drivers.controller.ts` (`/drivers/me`, `Roles(LAVADOR)`):
  - `POST /drivers/me` — cria o perfil de lavador (onboarding) para o
    usuario autenticado; falha se o usuario nao for `LAVADOR` ou ja
    tiver perfil. Status inicial `pending_documents`.
  - `GET /drivers/me` — retorna o proprio perfil (com `user` e `zone`).
  - `PATCH /drivers/me` — atualiza `serviceRadiusKm`/`currentZoneId`.
  - `PATCH /drivers/me/availability` — alterna `status` entre
    `active`/`inactive` (unico campo do schema que representa
    disponibilidade; so permitido a partir desses dois status, nao a
    partir de `pending_documents`/`blocked`/`rejected`).
- `washers.admin.controller.ts` (`AdminWashersController`,
  `/admin/washers`, `Roles(ADMIN)`):
  - `GET /admin/washers` — lista paginada com filtro por `status` e
    busca textual (nome/e-mail).
  - `GET /admin/washers/:userId` — detalhes de um lavador.
  - `PATCH /admin/washers/:userId/status` — aprova/bloqueia/rejeita
    (qualquer `WasherStatus`), com `reason` opcional.
- `drivers.service.ts` / `dto/washers.dto.ts` (renomeado de
  `driver-availability.dto.ts`, que so continha um DTO fictício de
  `availableNow: boolean` sem lastro no schema).

#### `src/modules/coupons/**` (cupons para cliente e lojista)
- `coupons.module.ts` — registra `CouponsController` (novo arquivo — a
  versao truncada referenciava esse controller sem nunca defini-lo) e
  `AdminCouponsController`.
- `coupons.admin.controller.ts` (`/admin/coupons`, `Roles(ADMIN)`):
  CRUD de campanhas (`POST/PATCH /admin/coupons/campaigns[...]`,
  `GET /admin/coupons/campaigns`) e de cupons (`POST/GET/PATCH
  /admin/coupons[...]`, `DELETE /admin/coupons/:id` como soft-delete via
  `isActive = false`).
- `coupons.controller.ts` (`/coupons`, qualquer usuario autenticado —
  usado no checkout tanto pelo cliente quanto pelo lojista):
  - `POST /coupons/validate` — valida codigo, ativo, prazo de validade,
    limite de usos (`maxUses`/`usedCount`) e pedido minimo
    (`minOrderAmount`), retornando o valor de desconto calculado
    (percentual ou fixo).
  - `POST /coupons/redeem` — registra `CouponRedemption` e incrementa
    `usedCount`, chamado apos confirmacao do pagamento.
- `coupons.service.ts` / `dto/coupons.dto.ts`.

#### `src/modules/payouts/**` (repasses para lavadores e lojistas)
**O schema recuperado nao tinha nenhum model de repasse** (nenhuma
referencia a "payout"/"repasse" sobreviveu na versao truncada, e a busca
por `Payout|payout` no schema antes desta rodada nao retornou nenhuma
ocorrencia). Foi adicionado o model `Payout` (`enum
PayoutRecipientType`, `enum PayoutStatus`) em `prisma/schema.prisma`,
cobrindo tanto lavador (`recipientWasherId -> Washer.userId`) quanto
lojista (`recipientStoreId -> Store.id`), com a migration incremental
`prisma/migrations/20260723180000_add_payouts/migration.sql` (a migration
inicial `20260723000000_init_unified_schema` foi mantida intocada, ja que
ainda nao foi aplicada em nenhum banco).
- `payouts.module.ts` — registra `PayoutsController` (consulta pelo
  proprio lavador/lojista) e `AdminPayoutsController` (geracao e gestao).
  Substitui `repayments.admin.controller.ts`, que importava
  `@modules/wallet/wallet.module` — modulo/model `Wallet` inexistente no
  schema recuperado.
- `payouts.admin.controller.ts` (`/admin/payouts`, `Roles(ADMIN)`):
  - `POST /admin/payouts/washers` — apura repasse de um lavador em um
    periodo, somando `Order.totalAmount` das orders `completed` no
    intervalo (`completedAt`), aplicando `commissionRate` informada na
    requisicao (default 0% — o schema nao define uma taxa de comissao de
    plataforma sobre o lavador, diferente do lojista).
  - `POST /admin/payouts/stores` — apura repasse de uma loja em um
    periodo, somando `ProductOrder.totalAmount`/`commissionAmount` dos
    pedidos `delivered` (a comissao ja e calculada por pedido via
    `CommissionPlan.takeRate` no modulo `store`/`marketplace`).
  - `GET /admin/payouts` — lista com filtros (`status`, `washerId`,
    `storeId`) e paginacao.
  - `GET /admin/payouts/:id` — detalhes.
  - `PATCH /admin/payouts/:id/status` — transiciona
    `pending → approved/rejected → paid`; exige `rejectionReason` ao
    rejeitar; bloqueia edicao apos `paid`.
- `payouts.controller.ts` (`/payouts/me`): `GET /payouts/me/washer`
  (`Roles(LAVADOR)`) e `GET /payouts/me/store` (qualquer autenticado,
  resolve a loja pelo `ownerUserId`).
- `payouts.service.ts` / `dto/payouts.dto.ts`.

#### Bugfix de schema encontrado durante a integracao de `payouts`
Ao implementar a consulta de `Order` por lavador/motorista para o calculo
de repasse, foi identificado um **drift entre `schema.prisma` e a
migration SQL existente**: `Order.washer` e `Order.driver` estavam
declarados no schema com `references: [id]`, mas nem `Washer` nem
`Driver` tem coluna `id` (a PK de ambos e `userId`). A migration
`20260723000000_init_unified_schema/migration.sql` ja continha o FK
correto (`REFERENCES "washers"("user_id")` / `REFERENCES
"drivers"("user_id")`), entao a correcao foi so no `schema.prisma`
(`references: [userId]` nos dois casos) para alinhar com o SQL — sem
qualquer alteracao na migration ja escrita.

### 1.3 Recuperacao de `auctions` (Phase C — leilao de servicos pesados)

Pedido: fechar a camada de backend do modulo `auctions` (leilao de
servicos pesados — cliente cria o leilao, lojas do tipo `CARWASH_SHOP`
enviam pujas, cliente seleciona a vencedora).

**Bloqueio encontrado antes de comecar:** `prisma/schema.prisma` estava
com uma edicao nao commitada e incompleta de uma rodada anterior (fora
deste repositorio de agentes) que renomeava o model `Driver` para
`DriverProfile` e ja adicionava `Auction`/`AuctionBid`/`LoyaltyPoint`, mas
sem atualizar todas as referencias: `User.driver`, `Order.driver`,
`Rental.driver` e `Zone.drivers` continuavam tipados como `Driver`, um
model que nao existia mais no arquivo — o que quebra `prisma generate`
por completo (nao e um problema isolado do `auctions`, impede qualquer
build). Corrigido:
- Removido o campo orfao `User.driver` (duplicava `User.driverProfile`,
  que ja cobre a mesma relacao 1:1).
- `Order.driver`, `Rental.driver` e `Zone.drivers` retipados para
  `DriverProfile`/`DriverProfile[]`.
- Adicionado `expired` a `AuctionStatus` (a spec do modulo pede os quatro
  estados "aberto, fechado, cancelado, expirado"; o enum recuperado so
  tinha os tres primeiros).
- Nova migration incremental
  `prisma/migrations/20260803000000_add_auctions_and_driver_profiles/migration.sql`:
  renomeia a tabela `drivers` para `driver_profiles` preservando dados
  (troca a PK de `user_id` para um novo `id`, mantendo `user_id` como
  `UNIQUE` para nao quebrar os FKs existentes de `orders`/`rentals`,
  recriados apos o `DROP CONSTRAINT ... CASCADE`), cria os enums
  `DriverType`/`ServiceType`/`AuctionStatus`/`BidStatus` e as tabelas
  `auctions`, `auction_bids`, `loyalty_points`. Ainda **nao aplicada** em
  nenhum banco (mesma limitacao ja registrada na secao 1: esta maquina
  nao tem Node/npm instalado, entao nao foi possivel rodar `prisma
  migrate dev`/`generate`/`validate`, nem `tsc`/`nest build` para
  confirmar o typecheck de fato — ver "Verificacao pendente" abaixo).

#### `src/modules/auctions/**` (novo modulo)
- `auctions.module.ts` — registra `AuctionsController`,
  `AdminAuctionsController`, `AuctionsService` e
  `AuctionsNotificationsService`. Adicionado a `app.module.ts` e ao
  `include` do `tsconfig.json` (junto de `deliveries`, que ja estava
  registrada em `app.module.ts` mas faltava no `include`).
- `auctions.controller.ts` (`/auctions`, `JwtAuthGuard`):
  - `POST /auctions` (`CLIENTE`) — abre leilao a partir de um
    `orderId` proprio com status `pending`; veiculo/endereco sao sempre
    herdados do `Order` (nunca aceitos do client, para nao divergir).
  - `GET /auctions/me`, `GET /auctions/me/:id` (`CLIENTE`) — lista/detalha
    os proprios leiloes; o detalhe retorna as pujas **rankeadas**.
  - `PATCH /auctions/me/:id/cancel` (`CLIENTE`) — cancela leilao aberto.
  - `PATCH /auctions/me/:id/bids/:bidId/accept` (`CLIENTE`) — aceita a
    puja vencedora: fecha o leilao, rejeita as demais pujas e atribui a
    loja vencedora como `Order.driver` (`Order.status -> accepted`).
  - `GET /auctions/available` (`LAVADOR`) — leiloes abertos disponiveis
    para a loja autenticada pujar (filtra pela zona da loja quando ela
    tiver uma definida).
  - `GET /auctions/bids/me` (`LAVADOR`) — pujas enviadas pela loja.
  - `POST /auctions/:id/bids` (`LAVADOR`) — envia puja (uma puja pendente
    por leilao por loja).
  - `PATCH /auctions/:id/bids/me`, `DELETE /auctions/:id/bids/me`
    (`LAVADOR`) — atualiza/retira a propria puja pendente.
- `auctions.admin.controller.ts` (`/admin/auctions`, `Roles(ADMIN)`):
  `GET /admin/auctions`, `GET /admin/auctions/:id`,
  `PATCH /admin/auctions/:id/cancel`, `POST
  /admin/auctions/expire-overdue` (varre leiloes abertos com prazo
  vencido e marca `expired` — nao ha scheduler no processo Nest hoje,
  este endpoint existe para ser chamado por um cron externo).
- `auctions.service.ts`:
  - Elegibilidade de puja: usuario precisa ter `DriverProfile` com
    `driverType = CARWASH_SHOP`, `HEAVY_SERVICE` em `allowedServices` e
    `status = active`.
  - **Ranking de pujas** (`rankBids`): score ponderado 0–1 normalizado
    entre as pujas do proprio leilao — preco 40% (menor melhor), prazo
    20% (menor melhor), garantia 15% (maior melhor), reputacao da loja
    (`DriverProfile.averageRating`) 25% (maior melhor). Exposto apenas
    para o cliente e para o admin (a lista de leiloes disponiveis para a
    loja nao expoe pujas de concorrentes, so a contagem).
  - Expiracao "preguicosa": qualquer leitura de um leilao aberto com
    `deadlineHours` vencido o marca `expired` antes de responder, alem do
    endpoint de admin para varredura em lote.
- `auctions-notifications.service.ts` — pontos de integracao com Firebase
  Push (FCM): `notifyAuctionOpened`, `notifyNewBid`, `notifyBidAccepted`,
  `notifyBidRejected`, `notifyAuctionCancelled`, `notifyAuctionExpired`.
  Hoje so loga a intencao do evento (nao ha dependencia de FCM instalada
  no projeto); quando o Firebase for conectado, cada metodo passa a
  enviar a notificacao real em vez de logar — nenhuma outra parte do
  `AuctionsService` precisa mudar.
- `dto/create-auction.dto.ts`, `dto/create-bid.dto.ts`,
  `dto/list-auctions.dto.ts`, `dto/cancel-auction.dto.ts` — validacao via
  `class-validator`, mesmo padrao dos demais modulos.

#### Gap real encontrado (nao e so documentacao — trava o fluxo end-to-end)
**Nao existe, em nenhum lugar do codigo, um jeito de criar um
`DriverProfile`** (o model usado por `AuctionBid.supplier`). O
`src/modules/drivers/**` atual (`DriversController`) so cria/gerencia o
model `Washer` (perfil de lavador comum), nunca `DriverProfile`. Ou seja:
hoje nenhum usuario `LAVADOR` consegue virar uma loja `CARWASH_SHOP`
elegivel para pujar, mesmo com o `auctions` completo. Proximo passo
recomendado antes de testar o fluxo ponta a ponta: endpoint de onboarding
de `DriverProfile` (provavelmente `POST /drivers/me/shop-profile` ou
modulo `drivers` estendido), correspondente ao item "Fluxo de registro
com escolha de perfil (Moto/Carro/Loja)" do roadmap do app Lavador.

#### Verificacao pendente (sem Node nesta maquina)
Nao foi possivel rodar, nesta maquina: `npm run db:generate` (`prisma
generate`), `npm run db:migrate:dev`, `npm run type-check` (`tsc
--noEmit`) nem `npm run build` (`nest build`). Todo o codigo foi escrito
manualmente seguindo com precisao os padroes ja usados por
`orders`/`drivers`/`deliveries` (mesmos imports, mesmos nomes de guard/
decorator, mesmo formato de paginacao), mas **isso nao substitui rodar os
comandos de verificacao de fato** em uma maquina com Node/npm instalados:

```bash
cd services/api
npm install
npm run db:generate
npm run db:migrate:dev
npm run type-check
npm run build
```

### 1.4 CI deixava de ser um gate real (`continue-on-error` no job `api`)

Auditoria pedida pelo usuario sobre o roadmap macro do produto revelou que
o job `api` do `.github/workflows/ci.yml` tinha `continue-on-error: true`
nas 4 etapas (lint, type-check, test, build) — ou seja, o job aparecia
verde no GitHub mesmo que qualquer uma delas falhasse de verdade. Corrigido
nesta rodada, apos validar localmente (agora com Node instalado) que as 4
etapas passam de fato:
- `pnpm run lint` tinha 1 erro real, tambem pre-existente e sem relacao
  com `auctions`: o script rodava sobre `"{src,test}/**/*.ts"`, mas
  `tsconfig.json` exclui `test/**` do `parserOptions.project` do ESLint,
  causando um erro de parsing em `test/health.controller.spec.ts`. Como
  os testes ja sao validados pelo Jest (via `ts-jest`, config propria em
  `jest.config.js`), o fix foi restringir o glob do lint para
  `"src/**/*.ts"` (`package.json`), alinhando com o que o `tsconfig.json`
  sempre pretendeu.
- `pnpm run type-check`, `pnpm run test` e `pnpm run build` ja passavam
  limpos (apos os fixes das secoes 1.1–1.3).
- `jest.config.js` (`collectCoverageFrom`) ganhou as entradas de
  `deliveries` e `auctions`, que faltavam.

### 1.5 Onboarding de `DriverProfile` (Onda 1 do roadmap pos-auditoria)

A auditoria da secao 1.3 identificou um gap real: nao havia, em nenhum
lugar do codigo, um jeito de criar um `DriverProfile` (moto/carro/loja
carwash) — `src/modules/drivers/**` so gerenciava o model `Washer`. Sem
isso, nenhum `LAVADOR` conseguia virar elegivel para pujar em `auctions`.
Adicionado ao mesmo modulo `drivers` (mesmo padrao de
`DriversController`/`AdminWashersController`, para o model `Washer`):

- `driver-profiles.controller.ts` (`/driver-profiles/me`, `Roles(LAVADOR)`):
  `POST` (onboarding — status inicial `pending_documents`, igual ao
  padrao do `Washer`), `GET`, `PATCH` (atualiza `driverType`,
  `allowedServices`, `serviceRadiusKm`, `currentZoneId`) e `PATCH
  /availability` (alterna `active`/`inactive`, mesma regra do `Washer`:
  so a partir desses dois status).
- `driver-profiles.admin.controller.ts` (`/admin/driver-profiles`,
  `Roles(ADMIN)`): `GET` (lista com filtro de `status`/`driverType`/
  busca), `GET /:userId`, `PATCH /:userId/status` (aprova/bloqueia/
  rejeita, `reason` aceito mas nao persistido — mesmo comportamento do
  `AdminUpdateWasherStatusDto` existente, o schema nao tem coluna pra
  isso em nenhum dos dois models).
- `driver-profiles.service.ts` / `dto/driver-profiles.dto.ts`.

Uma loja so fica elegivel para pujar em `auctions` depois de: (1) criar o
perfil com `driverType = CARWASH_SHOP`, (2) admin aprovar
(`status -> active`), e (3) incluir `HEAVY_SERVICE` em `allowedServices`
(no `POST` ou depois via `PATCH`) — a checagem de elegibilidade em
`auctions.service.ts` (secao 1.3) ja exigia os tres, sem mudanca
necessaria la.

Validado localmente (Node instalado nesta rodada): `lint`, `type-check`,
`test` e `build` passam limpos com o modulo `drivers` estendido.

---

## 2. `apps/admin-web` (Next.js)

### Scaffolding que nao existia e foi reconstruido do zero
- `package.json`, `tsconfig.json`, `.eslintrc.js`, `.gitignore`
- `src/app/layout.tsx`, `src/app/page.tsx` (landing minima)

### Arquivos isolados em `_corrupted-quarantine/`
Movidos para fora da arvore compilada pelo Next.js (App Router compila
automaticamente tudo em `src/app`, entao exclude no `tsconfig.json` sozinho
nao seria suficiente):

- `(admin)/dashboard/page.tsx`
- `(admin)/cupons/page.tsx`
- `(admin)/fidelidade/page.tsx`
- `(admin)/marketplace/page.tsx`
- `(admin)/aluguel-motos/page.tsx`
- `(admin)/categorias/page.tsx`
- `(admin)/servicos/page.tsx`
- `(admin)/kit-inicial/page.tsx`
- `(admin)/suporte/page.tsx`
- `(admin)/relatorios/page.tsx`
- `(admin)/repasses/page.tsx`
- `(admin)/compliance/page.tsx`
- `(admin)/compliance/[id]/page.tsx`
- `(admin)/inteligencia-operacional/page.tsx`
- `hooks/use-orders.ts`, `hooks/use-users.ts`, `hooks/use-starter-kit.ts`
- `lib/api.ts`
- `types/index.ts`

Evidencia: `hooks/use-orders.ts` comeca com o corpo de uma funcao (sem
`import`/assinatura); `lib/api.ts` e importado por praticamente todas as
paginas mas o proprio `page.tsx` do dashboard tambem referencia
`@/components/ui/card` e `@/lib/utils`, que nunca existiram no
repositorio - ou seja, mesmo sem a corrupcao esses arquivos dependiam de
componentes de UI (`components/ui/*`) que nunca foram versionados.

### Plano de recuperacao sugerido
1. Reconstruir `src/components/ui/*` (provavelmente shadcn/ui - `card`,
   `button`, etc.) e `src/lib/utils.ts` (`formatCurrency`, `cn`, etc.),
   que sao pre-requisitos para qualquer pagina do `(admin)` funcionar.
2. Restaurar `lib/api.ts` e `types/index.ts` primeiro (base para hooks).
3. Restaurar hooks (`use-orders`, `use-users`, `use-starter-kit`).
4. Restaurar paginas `(admin)/**` uma a uma, validando `next build` a cada
   pagina reintroduzida.
5. Mover a pagina de volta de `_corrupted-quarantine/` para `src/app/` e
   remover a exclusao em `.eslintrc.js`/`tsconfig.json`.

---

## 3. `apps/mobile-client` (Flutter)

### Arquivos validos mantidos em `lib/`
- `lib/main.dart` (reescrito como entrypoint minimo, ver abaixo)
- `lib/core/constants/app_constants.dart`
- `lib/core/theme/app_colors.dart`, `lib/core/theme/app_theme.dart`
- `lib/core/widgets/app_scaffold.dart`, `loading_skeleton.dart`,
  `neon_surface.dart`
- `lib/features/auth/presentation/pages/login_page.dart` (valido, mas
  quarentenado - ver observacao abaixo)

### Arquivos isolados em `_corrupted_quarantine/`
Corrompidos (linhas em branco no meio do arquivo e/ou chaves
desbalanceadas):
- `core/router/app_router.dart` (77% em branco)
- `features/auth/presentation/providers/auth_provider.dart` (14% em
  branco, corta no meio da definicao do provider)
- `features/auth/presentation/providers/auth_state.dart` (14% em branco)
- `features/engagement/presentation/providers/engagement_provider.dart`
  (13% em branco)
- `features/orders/data/models/order_models.dart` (56% em branco)
- `features/orders/data/models/order_models.g.dart` (48% em branco, chaves
  desbalanceadas 3 vs 5)
- `features/quote/presentation/pages/quote_page.dart` (88% em branco)

Quarentenados em cascata (arquivos sintaticamente validos, porem com
`import` direto de algum dos arquivos corrompidos acima, portanto nao
compilam sem eles):
- `features/auth/presentation/pages/login_page.dart` (importa
  `auth_provider.dart` e `auth_state.dart`)
- `features/home/presentation/pages/home_page.dart` (importa
  `auth_provider.dart`, `auth_state.dart`, `engagement_provider.dart`)
- `features/orders/data/repositories/order_repository.dart` (importa
  `order_models.dart`)
- `features/orders/presentation/pages/quote_checkout_page.dart` (importa
  `order_models.dart`)

`lib/main.dart` foi reescrito para nao depender de nenhuma feature
quarentenada: exibe apenas uma tela de manutencao usando o tema e o
`AppScaffold` (ambos validos).

### Plano de recuperacao sugerido
1. Reconstruir `auth_state.dart` e `auth_provider.dart` primeiro (base de
   autenticacao usada por quase tudo).
2. Reconstruir `engagement_provider.dart` e `order_models.dart` (+
   `order_models.g.dart` via `build_runner build` apos corrigir o `.dart`
   fonte).
3. Reintroduzir `login_page.dart` e `home_page.dart` (ja validos) e
   restaurar o roteamento (`core/router/app_router.dart` ou o `GoRouter`
   embutido em `main.dart`, como estava antes da quarentena).
4. Por ultimo, `quote_page.dart` e `quote_checkout_page.dart`.

---

## 4. `apps/mobile-driver` (Flutter)

### Scaffolding que nao existia e foi reconstruido do zero
- `pubspec.yaml`, `analysis_options.yaml`, `.gitignore`
- `lib/main.dart` (nao existia; entrypoint minimo criado)

### Arquivos isolados em `_corrupted_quarantine/`
Todo o diretorio `features/orders/**` foi isolado: o unico arquivo lido
(`driver_order_models.dart`) tem um `switch` truncado (falta a primeira
`case` e o `return` inicial do metodo), confirmando o mesmo padrao de
corrupcao dos demais pacotes:
- `features/orders/data/models/driver_order_models.dart`
- `features/orders/data/models/driver_order_models.g.dart`
- `features/orders/data/repositories/driver_order_repository.dart`
- `features/orders/presentation/pages/active_order_page.dart`
- `features/orders/presentation/providers/driver_orders_provider.dart`

Apenas `lib/core/constants/app_constants.dart` estava integro.

### Plano de recuperacao sugerido
1. Reconstruir `driver_order_models.dart` (enum + labels) e regenerar
   `driver_order_models.g.dart` via `build_runner`.
2. Reconstruir `driver_order_repository.dart` e
   `driver_orders_provider.dart`.
3. Reconstruir `active_order_page.dart` e ligar ao `main.dart`.

---

## Resumo de impacto no CI

| Pacote | Codigo valido em CI | Codigo excluido do build/lint/test | Tipo de exclusao |
|---|---|---|---|
| `services/api` | `main.ts`, `app.module.ts`, `database/*`, `common/*`, `modules/health/*`, `modules/marketplace/*`, `modules/store/*`, `modules/users/*`, `modules/orders/*` | 15 modulos de dominio (ver secao 1 atualizada) | Logica (config): arquivos permanecem em `src/modules/**`, apenas ignorados por `tsconfig.json`/`.eslintrc.js`/`jest.config.js` |
| `apps/admin-web` | `app/layout.tsx`, `app/page.tsx` | 14 paginas `(admin)`, 3 hooks, `lib/api.ts`, `types/index.ts` | Fisica: movidos para `_corrupted-quarantine/` (+ exclude no `tsconfig.json`) |
| `apps/mobile-client` | `main.dart`, `core/theme/*`, `core/widgets/*`, `login_page.dart` (isolado por dependencia) | 7 arquivos corrompidos + 4 dependentes em cascata | Fisica: movidos para `_corrupted_quarantine/` (+ exclude no `analysis_options.yaml`) |
| `apps/mobile-driver` | `main.dart`, `core/constants/*` | Todo `features/orders/**` (5 arquivos) | Fisica: movidos para `_corrupted_quarantine/` (+ exclude no `analysis_options.yaml`) |

O CI da Fase 9 valida com sucesso (lint + typecheck + build + test) o
codigo listado na coluna "Codigo valido em CI". A recuperacao do codigo
excluido/quarentenado e um trabalho de reconstrucao de produto (Fases 2-8)
e nao faz parte do escopo de DevOps da Fase 9. Note que em `services/api`
essa exclusao e apenas de configuracao (nenhum arquivo mudou de lugar),
enquanto nos outros tres pacotes houve movimentacao fisica real para uma
pasta de quarentena dentro do proprio pacote (necessaria porque o Next.js
App Router e o analyzer do Flutter, de outra forma, tentariam compilar/
analisar esses arquivos mesmo com exclusoes no `tsconfig`/`analysis_options`).
