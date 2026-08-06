# Progresso do Projeto — GIUCAR

## Última atualização
2026-08-05

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
- **`MapsService` não foi conectado ao matching de pedidos
  (`orders.service.ts`) nem ao cálculo de frete de `deliveries`** —
  ficou standalone, exposto via `GET /maps/distance`, para não alterar
  comportamento de código já testado sem revisão dedicada a isso.
- **Previews HTML (`apps/preview/*.html`) permanecem mockups manuais**
  (Opção A), atualizados só quando há mudança grande de fluxo ou um bug
  concreto (ex.: link morto) — não geramos a partir do código Flutter
  real. Trade-off aceito: os previews podem divergir do app real com o
  tempo; a fonte de verdade sobre comportamento é sempre o código em
  `apps/mobile-*`, nunca o preview.

## Bloqueios / débitos técnicos conhecidos

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
- Distância (haversine) e disponibilidade (`DriverStatus.active`) já
  existiam antes, sem mudança de lógica além de trocar `Washer` por
  `DriverProfile`.
- **Ainda não ligado**: `MapsService` (Google Maps/haversine com fallback)
  segue standalone — o matching usa seu próprio haversine interno, não
  reaproveita `MapsService.getDistance`. Ligar os dois é o item 1 abaixo.

## Próximos passos priorizados

Ordem sugerida, por dependência e impacto (não por facilidade):

1. **Ligar `MapsService` ao matching de pedidos e ao frete de
   `deliveries`** — hoje `matchDriver` usa haversine próprio, não
   `MapsService.getDistance` (que já suporta Google Maps real + fallback).
   Fechar esse loop é o que torna a integração do Google Maps
   realmente útil em produção, não só uma chamada de API solta.
2. **Fluxo de registro com escolha de perfil no App Lavador** (Moto/
   Carro/Loja) — hoje só existe login, nenhuma tela de cadastro. Sem
   isso, um usuário novo não vira `LAVADOR`/`DriverProfile` pelo app, só
   via chamada direta à API. O ativar-modo-Loja-de-Carwash já existe
   (`AuctionsPage._ActivationPrompt`), mas depende de já ter conta — o
   registro em si que falta.
3. **Apps Flutter → backend real**: trocar mocks pelas chamadas reais,
   incluindo corrigir o mismatch `GET /orders` (`{items, nextCursor}` vs
   array puro que `mobile-client` espera hoje) — bug pré-existente que
   provavelmente já quebra a listagem de pedidos.
4. **Aplicar as migrations pendentes num Postgres real** (não há
   Postgres/Docker nesta máquina — já são 4 migrations nunca aplicadas a
   um banco de verdade) — pré-requisito prático pros itens 3, 5 e 6.
5. **Chaves de sandbox reais** (Mercado Pago + Google Maps) — depende de
   você criar as contas de desenvolvedor; o código já está pronto pros
   dois lados (mock automático sem chave, real com chave, log de modo no
   startup).
6. **Admin panel com dados reais** — maior esforço da lista;
   `admin-web` está quase vazio (só landing page), as 14 páginas do
   painel seguem em quarentena aguardando reconstrução.
