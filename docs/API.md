# API — GIUCAR (Lavagem a Domicílio)

Referência prática dos endpoints reais e ativos do backend
(`services/api`). Todos os exemplos abaixo foram executados de
verdade contra o container Docker (`docker compose up -d`) durante a
validação end-to-end de 2026-08-10 — não são hipotéticos.

## Documentação interativa (Swagger)

Com a API rodando, `GET /api/docs` abre uma UI interativa (Swagger)
com todos os endpoints, schemas de request/response e um botão
"Authorize" pra colar o Bearer token e testar direto no browser. Gerada
automaticamente a partir dos decorators `@ApiTags`/`@ApiOperation`/
`@ApiBearerAuth` que já existiam em todo controller — só faltava
`SwaggerModule.setup()` ser chamado em `main.ts` (corrigido em
2026-08-10).

## Base URL e autenticação

- Local (Docker): `http://localhost:3000/api/v1` (exceto `GET /health`,
  que fica fora do prefixo: `http://localhost:3000/health`)
- Toda rota autenticada usa `Authorization: Bearer <accessToken>`
  (JWT, obtido em `POST /auth/login` ou `POST /auth/register`)
- Roles: `CLIENTE`, `LAVADOR`, `ADMIN` (campo `role` do `User`)
- Campos monetários/decimais (`Decimal` do Prisma) sempre serializam
  como **string** no JSON (`"totalAmount": "80"`, nunca `80`) — todo
  client (mobile, admin-web) precisa fazer parse defensivo.

## Escopo deste documento

Cobre só os módulos de fato registrados em
`services/api/src/app.module.ts` e confirmados no ar (rota mapeada nos
logs do Nest + testada com curl/browser). **Existe código de
controllers adicional em `src/modules/`** (`analytics`, `compliance`,
`dispatch`, `face-check`, `services-catalog`, `tracking`) que **não
está documentado aqui de propósito**: são módulos em quarentena,
explicitamente excluídos em `tsconfig.json` (`exclude`) e nunca
importados em `app.module.ts` — sobras da recuperação de um schema
anterior corrompido (mesmo padrão já registrado pra `analytics` em
`docs/PROGRESSO.md`). Não compilam contra o schema atual (usam
`UserRole.admin`/`client`/`driver` en minúsculo, que não existem no
enum real `CLIENTE`/`LAVADOR`/`ADMIN`) e não respondem a nenhuma
requisição. Se um dia forem resgatados, precisam de auditoria completa
antes — não é so tirar do `exclude`.

`document-verification`, `rental`, `starter-kit`, `support` e `zones`
(admin) **já saíram da quarentena** — foram reescritos do zero contra
o schema real e estão documentados abaixo normalmente.

---

## Auth (`/auth`)

Único módulo sem `JwtAuthGuard` — público por natureza.

### `POST /auth/register`
Cria um usuário e já retorna um token (login automático). `role` só
aceita `CLIENTE` ou `LAVADOR` — **não é possível se auto-registrar como
`ADMIN`** (bug de escalonamento de privilégio corrigido em
2026-08-10; promoção pra admin exige `PATCH
/admin/users/:id/role` por um admin já existente).

```json
// Request
{
  "name": "Gustavo E2E",
  "email": "gustavo.e2e@example.com",
  "phone": "+5511955554444",
  "password": "SenhaForte123!",
  "role": "CLIENTE"
}
// Response 201
{
  "accessToken": "eyJhbGciOi...",
  "user": { "id": "...", "name": "...", "email": "...", "role": "CLIENTE", "status": "active", ... }
}
```

### `POST /auth/login`
```json
{ "email": "gustavo.e2e@example.com", "password": "SenhaForte123!" }
```
Mesma resposta de `register`.

---

## Users (`/users`)

- `GET /users/me` — perfil do autenticado, incluindo `addresses`,
  `vehicles`, `driverProfile`, `cashbackBalance`.
- `PATCH /users/me` — atualiza nome/telefone/avatar.
- `DELETE /users/me` — desativa a própria conta (soft delete via
  `status`).

## Vehicles (`/vehicles`) — CLIENTE

Adicionado em 2026-08-10 (não existia nenhum endpoint de veículo antes
— sem isso, um cliente novo nunca conseguia criar um pedido).

- `POST /vehicles` — `{ type: "carro"|"moto"|"caminhonete"|"van", brand, model, color?, plate }`
- `GET /vehicles/me` — lista os veículos do cliente autenticado

## Addresses (`/addresses`) — CLIENTE

Adicionado em 2026-08-10, mesmo motivo do módulo de veículos.

- `POST /addresses` — `{ street, number, neighborhood, city, state, zipCode, label?, complement?, latitude?, longitude?, isDefault? }`. O primeiro endereço cadastrado vira `isDefault` automaticamente.
- `GET /addresses/me` — lista os endereços do cliente autenticado

---

## Orders (`/orders`) — pedido de lavagem

### Cliente
- `POST /orders` — cria o pedido. Dispara matching automático
  (`GET`/`POST` não fazem parte do request, é side-effect síncrono):
  ```json
  {
    "vehicleId": "...", "addressId": "...", "serviceType": "DRY_WASH",
    "items": [{ "name": "Lavagem completa", "price": 80, "quantity": 1 }]
  }
  ```
  Resposta já vem com `status: "searching_washer"` e `zoneId`
  resolvido (por `city`+`state`+`neighborhood` batendo em
  `Zone.neighborhoods`). Se `serviceType` for `HEAVY_SERVICE`, fica
  `pending` — serviço pesado só avança via leilão (`POST /auctions`).
- `GET /orders` — lista os próprios pedidos (paginação por cursor:
  `{items, nextCursor}`)
- `GET /orders/:id` — detalhe de um pedido próprio
- `PATCH /orders/:id/cancel` — cliente **ou** lavador atribuído podem
  cancelar (`{ "reason"?: string }`)

### Lavador
- `GET /orders/available` — fila de pedidos `searching_washer` na
  mesma zona do lavador (só `MOTO_WASHER`/`CAR_WASHER` ativos —
  `CARWASH_SHOP` não participa, é exclusivo de leilão)
- `GET /orders/mine/active` — pedido ativo atual (aceito/a
  caminho/em andamento)
- `PATCH /orders/:id/accept` — aceita um pedido `searching_washer`
  ("primeiro a aceitar leva" — não precisa ser o lavador
  pré-sugerido pelo matching)
- `PATCH /orders/:id/status` — avança o status
  (`{ "status": "en_route"|"in_progress"|"completed"|"cancelled", "reason"?: string }`)

Máquina de estados: `pending → searching_washer → accepted → en_route
→ in_progress → completed`, com `cancelled` possível a partir de
qualquer estado não-terminal.

### Matching (automático, sem endpoint dedicado)
Ao criar o pedido: filtra por zona (`DriverProfile.currentZoneId ==
Order.zoneId`), prioriza `MOTO_WASHER` sobre `CAR_WASHER` pra
`DRY_WASH`/`EXPRESS_WASH` (conforme PRD), senão ordena por distância
via `MapsService` dentro do `serviceRadiusKm` de cada lavador.
Confirmado em teste real: pedido `DRY_WASH` foi pré-atribuído
corretamente a um `MOTO_WASHER` disponível na zona.

---

## Auctions (`/auctions`) — leilão de serviço pesado

Exclusivo pra `serviceType: HEAVY_SERVICE`. Lojas `CARWASH_SHOP` pujam,
cliente escolhe a vencedora.

### Cliente
- `POST /auctions` — abre leilão a partir de um pedido `pending`
- `GET /auctions/me` / `GET /auctions/me/:id` — lista/detalhe (com
  pujas rankeadas por preço/prazo/garantia/reputação)
- `PATCH /auctions/me/:id/cancel`
- `PATCH /auctions/me/:id/bids/:bidId/accept` — aceita a puja
  vencedora, fecha o leilão

### Loja (`CARWASH_SHOP`)
- `GET /auctions/available` — leilões abertos disponíveis pra pujar
- `GET /auctions/bids/me` — pujas já enviadas
- `POST /auctions/:id/bids` — envia puja
  (`{ amount, durationHours, warrantyDays, message?, photos? }`)
- `PATCH /auctions/:id/bids/me` / `DELETE /auctions/:id/bids/me`

---

## Loyalty (`/loyalty`) — pontos GIUCAR — CLIENTE

Sistema real (não gamificado): 5% do valor de todo pedido **pago**
vira pontos automaticamente (1 ponto = R$0,01), expiram em 90 dias.

- `GET /loyalty/balance` — `{ balance, balanceValue, nextExpiration, streakDays, totalSaved }`
- `GET /loyalty/history` — concessões + resgates
- `POST /loyalty/redeem` — `{ orderId, amount }`, resgata pontos como
  desconto **num pedido de lavagem específico** (`Order`), consumindo
  as concessões mais próximas de vencer primeiro. Confirmado em teste
  real: R$80 pago → 400 pontos concedidos automaticamente pelo webhook
  → resgate de 100 pontos → saldo 300, `totalSaved` R$1.

  **Importante — gap de escopo real**: isso é só desconto em `Order`.
  **Não existe** nenhuma ligação entre pontos GIUCAR e a compra de
  produtos na loja (`POST /marketplace/client/checkout` /
  `ProductOrder`) — os dois sistemas são independentes hoje. "Usar
  pontos na lojinha" exigiria trabalho novo, não é wiring de algo já
  existente.

---

## Payments (`/payments`)

- `POST /payments/intent` — CLIENTE. Exatamente um entre `orderId` OU
  `productOrderId`, mais `method` (`pix`|`credit_card`|`debit_card`).
  Retorna `{ payment, gateway }` (`gateway.qrCode` em modo mock PIX).
- `GET /payments/orders/:orderId` / `GET /payments/product-orders/:productOrderId` — CLIENTE, consulta o próprio pagamento
- `POST /payments/webhook` — **sem autenticação** (callback de
  gateway real não manda Bearer token nosso). `{ externalRef, status:
  "approved"|"rejected"|"pending" }`. `approved` pela primeira vez
  dispara, best-effort: concessão de pontos GIUCAR (se `orderId`) ou
  confirmação do `ProductOrder` (se `productOrderId`).

Modo mock: sem `MERCADO_PAGO_ACCESS_TOKEN` configurado, o adapter
nunca chama a API real do Mercado Pago — log `[payments] modo MOCK
ativo` no startup confirma.

---

## Store (`/stores`) — gestão da própria loja — LAVADOR/ADMIN

Painel do lojista (dados sensíveis: `bankInfo`, produtos em qualquer
status, pedidos recebidos). Distinto de `/marketplace`, que é vitrine
pública.

- `POST /stores` — cria a loja do usuário autenticado
- `GET /stores/:id` — só o dono (ou admin)
- `POST /stores/:id/products` / `GET /stores/:id/products`
- `GET /stores/:id/orders` — pedidos de produto recebidos pela loja

## Marketplace (`/marketplace`) — vitrine pública + checkout

- `GET /marketplace/client/catalog` — produtos ativos com
  `catalogTarget` `CLIENTE` ou `AMBOS`, de lojas ativas (cursor
  pagination)
- `GET /marketplace/driver/catalog` — mesma coisa, `catalogTarget`
  `LAVADOR`/`AMBOS`
- `GET /marketplace/products/:id`
- `POST /marketplace/client/checkout` — CLIENTE. `{ items: [{productId, quantity}], shippingAddress: {...snapshot JSON...} }` — cria um `ProductOrder` por loja distinta no carrinho.

---

## Driver Profiles (`/driver-profiles/me`) — LAVADOR

Perfil de motorista/loja (`DriverProfile`) — moto, carro ou loja de
carwash.

- `POST /driver-profiles/me` — cria (`{ driverType, allowedServices?, serviceRadiusKm?, currentZoneId? }`)
- `GET /driver-profiles/me`
- `PATCH /driver-profiles/me`
- `PATCH /driver-profiles/me/availability` — `{ status: "active"|"inactive" }`, único par que o próprio lavador altera (demais status exigem admin)

## Document Verification (`/document-verification/me`) — LAVADOR

Envio de documentos (CNH, CRLV, foto do veículo, etc) para aprovação
do perfil. Sem infraestrutura de upload binário — `fileUrl` é um link
para onde o arquivo já está hospedado.

- `POST /document-verification/me` — `{ docType, fileUrl }`
- `GET /document-verification/me` — lista os próprios documentos enviados

**Importante**: aprovar documentos não ativa o lavador automaticamente
— isso é uma ação manual e separada do admin (`PATCH
/admin/driver-profiles/:userId/status {status:"active"}`). Um perfil
recém-criado (`pending_documents`) também não consegue se auto-ativar
via `PATCH /driver-profiles/me/availability` (esse endpoint só alterna
`active`/`inactive`, exige que o perfil já esteja num desses dois
estados). Ver `docs/E2E_CHECKLIST.md` (Passo 7a).

## Payouts (`/payouts/me`) — repasses — LAVADOR

- `GET /payouts/me/washer` — repasses do lavador autenticado
- `GET /payouts/me/store` — repasses da loja do usuário autenticado

## Coupons (`/coupons`)

- `POST /coupons/validate` — valida um cupom pro valor de um pedido
- `POST /coupons/redeem` — registra o resgate após pagamento confirmado

## Deliveries (`/driver/deliveries`) — entregas da Loja do Lavador — LAVADOR

- `GET /driver/deliveries` — disponíveis/pendentes
- `GET /driver/deliveries/active`
- `PATCH /driver/deliveries/:id/accept`
- `PATCH /driver/deliveries/:id/status`

## Maps (`/maps`)

- `GET /maps/distance` — Google Distance Matrix se
  `GOOGLE_MAPS_API_KEY` configurada, senão haversine local (log
  `[maps] modo MOCK/REAL ativo` no startup)

## Health

- `GET /health` (fora do prefixo `/api/v1`) — `{ status: "ok", timestamp }`

---

## Admin (`/admin/*`) — role `ADMIN`

Todos protegidos por `JwtAuthGuard` + `RolesGuard` +
`@Roles(UserRole.ADMIN)`.

| Recurso | Endpoints |
|---|---|
| Dashboard | `GET /admin/dashboard/summary` — pedidos por status, receita paga (total/hoje), lavadores/lojas ativos, novos clientes hoje, aprovações de documentos pendentes |
| Usuários | `GET /admin/users`, `GET /admin/users/:id`, `PATCH /admin/users/:id/status`, `PATCH /admin/users/:id/role`, `DELETE /admin/users/:id` |
| Pedidos | `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/assign-driver`, `PATCH /admin/orders/:id/status` |
| Lavadores | `GET /admin/driver-profiles`, `GET /admin/driver-profiles/:userId`, `PATCH /admin/driver-profiles/:userId/status` |
| Documentos | `GET /admin/document-verification`, `GET /admin/document-verification/:id`, `PATCH /admin/document-verification/:id/review` — aprova/rejeita; ativação do lavador é ação separada via `PATCH /admin/driver-profiles/:userId/status` |
| Marketplace | `GET /admin/marketplace/stores`, `GET /admin/marketplace/products`, `PATCH /admin/marketplace/products/:id/status` |
| Repasses | `POST /admin/payouts/washers`, `POST /admin/payouts/stores`, `GET /admin/payouts`, `GET /admin/payouts/:id`, `PATCH /admin/payouts/:id/status` |
| Relatórios financeiros | `GET /admin/payments` (lista paginada), `GET /admin/payments/report` (agregado por status/método), `GET /admin/payments/export` (até 5000 linhas, sem paginação — base do CSV) |
| Cupons | `POST /admin/coupons/campaigns`, `GET /admin/coupons/campaigns`, `PATCH /admin/coupons/campaigns/:id`, `POST /admin/coupons`, `GET /admin/coupons`, `GET /admin/coupons/:id`, `PATCH /admin/coupons/:id`, `DELETE /admin/coupons/:id` |
| Zonas | `POST /admin/zones`, `GET /admin/zones`, `GET /admin/zones/:id`, `PATCH /admin/zones/:id`, `DELETE /admin/zones/:id` (desativa) |
| Suporte | `GET /admin/support/tickets`, `GET /admin/support/tickets/:id`, `PATCH /admin/support/tickets/:id/status` |
| Kit Inicial | `POST /admin/starter-kits`, `GET /admin/starter-kits`, `GET /admin/starter-kits/:washerId`, `PATCH /admin/starter-kits/:washerId/status` |
| Aluguel de Moto | `POST /admin/rentals`, `GET /admin/rentals`, `GET /admin/rentals/:id`, `PATCH /admin/rentals/:id/assign-driver`, `PATCH /admin/rentals/:id/status` |
| Fidelidade | `GET /admin/loyalty/report` (agregado: concedido/resgatado/em aberto/expirado + top usuários por saldo), `POST /admin/loyalty/orders/:orderId/grant`, `POST /admin/loyalty/expire-overdue` |
| Leilões | `GET /admin/auctions`, `GET /admin/auctions/:id`, `PATCH /admin/auctions/:id/cancel`, `POST /admin/auctions/expire-overdue` |
| Entregas | `POST /admin/deliveries`, `GET /admin/deliveries` |

Paginação admin usa offset (`{data, total, page, limit, totalPages}`),
diferente da paginação cursor-based (`{items, nextCursor}`) dos
endpoints client-facing — as duas convenções coexistem de propósito
neste backend.

---

## Dados de teste (seed)

`pnpm --filter api seed:dev` popula: 1 admin
(`admin@giucar.com.br`), 3 clientes, 3 lavadores (moto/carro/loja) +
1 lojista com 3 produtos, 7 pedidos (um por status). Senha de todos:
`Senha123!` (exceto o admin, criado manualmente — ver
`docs/PROGRESSO.md`). Ver `services/api/prisma/seed.ts`.
