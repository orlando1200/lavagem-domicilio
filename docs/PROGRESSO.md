# Progresso do Projeto — GIUCAR

## Última atualização
2026-08-07

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
4. ~~Docker Compose local (Postgres + backend)~~ — **feito** (commit
   `dcbe25d`). `docker-compose.yml`/`Dockerfile` já existiam mas
   estavam desatualizados (Stripe em vez de Mercado Pago, `Redis` sem
   nenhum consumidor no código, secrets do Firebase/admin nunca lidos).
   Corrigido pro stack real; validado só via `docker compose config`
   no CI (sem Docker nesta máquina pra rodar de fato).
5. **Aplicar as migrations pendentes num Postgres real** (não há
   Postgres/Docker nesta máquina — já são 6 migrations nunca aplicadas a
   um banco de verdade) — pré-requisito prático pro item 6.
6. **Chaves de sandbox reais** (Mercado Pago + Google Maps) — depende de
   você criar as contas de desenvolvedor; o código já está pronto pros
   dois lados (mock automático sem chave, real com chave, log de modo no
   startup).
7. **Admin panel com dados reais** — maior esforço da lista;
   `admin-web` está quase vazio (só landing page), as 14 páginas do
   painel seguem em quarentena aguardando reconstrução.
