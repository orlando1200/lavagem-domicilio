# E2E Checklist — fluxo crítico (registro → pedido → aceite → pagamento → pontos)

Script manual de validação via `curl`, sem infraestrutura de teste nova
(sem Supertest/Jest e2e). Objetivo: garantir que a sequência crítica
funciona de ponta a ponta contra o backend real, sem precisar testar
manualmente pelo app toda vez. Roda contra o stack Docker
(`docker compose up -d --build`), não contra `pnpm start:dev` local.

Requer `curl` e `jq` (para extrair campos das respostas). Todas as
respostas de erro seguem o formato `{ "statusCode", "message", "error" }`.

## Pré-requisitos

```bash
docker compose up -d --build
# aguarde o healthcheck do Postgres e o Nest logar "Nest application successfully started"
docker compose logs -f api | grep -m1 "Nest application successfully started"
```

Base URL: `http://localhost:3000/api/v1` (exceto `/health`, fora do
prefixo). Este script cria seus próprios dados (não depende do
`seed:dev`), **exceto** pelo login de admin no Passo 0, que usa o
usuário criado pelo seed (`pnpm --filter api seed:dev`). Se preferir
não rodar o seed, crie um admin manualmente e ajuste o Passo 0 (auto
-registro não aceita `role: "ADMIN"` — bug de escalonamento de
privilégio corrigido, ver `docs/API.md`).

```bash
BASE=http://localhost:3000/api/v1
```

---

## Passo 0 (preparação) — login admin + zona de cobertura

O matching de pedidos exige que o pedido tenha um `zoneId` resolvido
(por `city`+`state`+`neighborhood` batendo em `Zone.neighborhoods`) **e**
que o lavador tenha o mesmo `currentZoneId`. O seed cria a zona
`sp-centro` (São Paulo/SP, bairros `Sé`/`República`/`Bela Vista`/
`Consolação`) — usamos um desses bairros no endereço do cliente (Passo 4)
e o id da zona no perfil do lavador (Passo 7). Esse mesmo login de admin
é reaproveitado no Passo 7a.

```bash
ADMIN_LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@giucar.com.br","password":"Senha123!"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.accessToken')

ZONE_ID=$(curl -s "$BASE/admin/zones?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data[0].id')

echo "ADMIN_TOKEN=${ADMIN_TOKEN:0:20}..."
echo "ZONE_ID=$ZONE_ID"
```

**Esperado**: `ZONE_ID` é um UUID não-vazio. Se vier `null`, a zona do
seed não existe — rode `pnpm --filter api seed:dev` primeiro.

**Gotcha confirmado ao rodar este script pela primeira vez**: `seed.ts`
usa `upsert` com `update: {}` no admin — se `admin@giucar.com.br` já
existir no banco (de uma criação manual anterior, como o aviso em
`docs/PROGRESSO.md` menciona), o seed **não** sobrescreve a senha, e
`Senha123!` retorna `401`. Em ambiente de desenvolvimento local, resolva
resetando o hash direto no Postgres do container:

```bash
HASH=$(docker compose exec -T api sh -c "cd /app/services/api && node -e \"require('bcryptjs').hash('Senha123!',10).then(h=>console.log(h))\"")
docker compose exec -T postgres psql -U postgres -d lavagem_domicilio \
  -c "UPDATE users SET password_hash = '$HASH' WHERE email = 'admin@giucar.com.br';"
```

---

## 1. `POST /auth/register` (cliente)

```bash
CLIENT_EMAIL="cliente.e2e.$(date +%s)@example.com"
CLIENT_REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Cliente E2E\",\"email\":\"$CLIENT_EMAIL\",\"phone\":\"+5511955550001\",\"password\":\"SenhaForte123!\",\"role\":\"CLIENTE\"}")
CLIENT_TOKEN=$(echo "$CLIENT_REGISTER" | jq -r '.accessToken')
echo "$CLIENT_REGISTER" | jq '.user.role, .user.status'
```

**Esperado**: `201`, resposta com `accessToken` + `user.role: "CLIENTE"`,
`user.status: "active"`.

## 2. `POST /auth/login`

```bash
CLIENT_LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"SenhaForte123!\"}")
CLIENT_TOKEN=$(echo "$CLIENT_LOGIN" | jq -r '.accessToken')
```

**Esperado**: `200`, mesmo formato do registro (login automático já
retorna token, então esse passo é redundante em relação ao Passo 1, mas
valida que a senha foi persistida/hasheada corretamente).

## 3. `POST /vehicles`

```bash
VEHICLE=$(curl -s -X POST "$BASE/vehicles" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"carro","brand":"Fiat","model":"Argo","color":"Prata","plate":"E2E1A23"}')
VEHICLE_ID=$(echo "$VEHICLE" | jq -r '.id')
```

**Esperado**: `201`, `{ id, type, brand, model, color, plate }`.

## 4. `POST /addresses`

Bairro precisa bater com um dos bairros da zona do seed
(`Sé`/`República`/`Bela Vista`/`Consolação`) para o pedido resolver
`zoneId` no Passo 5.

```bash
ADDRESS=$(curl -s -X POST "$BASE/addresses" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"street":"Rua da Sé","number":"100","neighborhood":"Sé","city":"São Paulo","state":"SP","zipCode":"01001-000"}')
ADDRESS_ID=$(echo "$ADDRESS" | jq -r '.id')
```

**Esperado**: `201`, `{ id, street, ..., neighborhood: "Sé" }`.

## 5. `POST /orders`

`serviceType: "DRY_WASH"` — `HEAVY_SERVICE` não passa pelo matching
normal (vai para leilão via `POST /auctions`), fora do escopo deste
script.

```bash
ORDER=$(curl -s -X POST "$BASE/orders" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d "{\"vehicleId\":\"$VEHICLE_ID\",\"addressId\":\"$ADDRESS_ID\",\"serviceType\":\"DRY_WASH\",\"items\":[{\"name\":\"Lavagem completa\",\"price\":80,\"quantity\":1}]}")
ORDER_ID=$(echo "$ORDER" | jq -r '.id')
echo "$ORDER" | jq '.status, .zoneId, .totalAmount'
```

**Esperado**: `201`, `status: "searching_washer"`, `zoneId` igual ao
`ZONE_ID` do Passo 0, `totalAmount: "80"` (string — `Decimal` do
Prisma).

## 6. `POST /auth/register` (lavador)

```bash
LAVADOR_EMAIL="lavador.e2e.$(date +%s)@example.com"
LAVADOR_REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Lavador E2E\",\"email\":\"$LAVADOR_EMAIL\",\"phone\":\"+5511955550002\",\"password\":\"SenhaForte123!\",\"role\":\"LAVADOR\"}")
LAVADOR_TOKEN=$(echo "$LAVADOR_REGISTER" | jq -r '.accessToken')
LAVADOR_USER_ID=$(echo "$LAVADOR_REGISTER" | jq -r '.user.id')
```

**Esperado**: `201`, `user.role: "LAVADOR"`.

## 7. `POST /driver-profiles/me`

`driverType: "MOTO_WASHER"` — priorizado sobre `CAR_WASHER` no
matching de `DRY_WASH`/`EXPRESS_WASH`. `currentZoneId` precisa ser o
`ZONE_ID` do Passo 0 para o matching (e o Passo 8) encontrarem este
pedido.

```bash
DRIVER_PROFILE=$(curl -s -X POST "$BASE/driver-profiles/me" \
  -H "Authorization: Bearer $LAVADOR_TOKEN" -H "Content-Type: application/json" \
  -d "{\"driverType\":\"MOTO_WASHER\",\"allowedServices\":[\"DRY_WASH\",\"EXPRESS_WASH\"],\"currentZoneId\":\"$ZONE_ID\"}")
echo "$DRIVER_PROFILE" | jq '.status'
```

**Esperado**: `201`, `status: "pending_documents"` — **novo perfil
nunca nasce ativo**.

## 7a. (passo que faltava no roteiro original) — ativação do lavador pelo admin

**Achado durante o planejamento deste checklist**: o próprio lavador
**não consegue** se auto-ativar. `PATCH
/driver-profiles/me/availability` (self-service) exige que o perfil já
esteja `active`/`inactive` — recém-criado (Passo 7) ele está
`pending_documents`. Sem este passo, os Passos 8 e 9 falham (o pedido
nunca aparece em `/orders/available` para um lavador não-`active`).
Reaproveita o `ADMIN_TOKEN` do Passo 0.

```bash
curl -s -X PATCH "$BASE/admin/driver-profiles/$LAVADOR_USER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"active"}' | jq '.status'
```

**Esperado**: `200`, `status: "active"`.

## 8. `GET /orders/available`

```bash
curl -s "$BASE/orders/available" \
  -H "Authorization: Bearer $LAVADOR_TOKEN" | jq '.[] | {id, status}'
```

**Esperado**: `200`, array simples (sem wrapper `{items,...}` — diferente
de `GET /orders`, que usa paginação cursor) inclui o `ORDER_ID` do
Passo 5 com `status: "searching_washer"`. Pode incluir também um
`driverId` já preenchido — é a pré-sugestão do matching automático, não
uma aceitação formal (que só acontece no Passo 9).

## 9. `PATCH /orders/:id/accept`

```bash
curl -s -X PATCH "$BASE/orders/$ORDER_ID/accept" \
  -H "Authorization: Bearer $LAVADOR_TOKEN" | jq '.status, .driverId'
```

**Esperado**: `200`, `status: "accepted"`, `driverId` igual ao
`LAVADOR_USER_ID`.

## 10. `PATCH /orders/:id/status` (uma transição por vez)

Pular direto para `completed` dá `400` — a máquina de estados exige
`accepted → en_route → in_progress → completed`.

```bash
for STATUS in en_route in_progress completed; do
  curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
    -H "Authorization: Bearer $LAVADOR_TOKEN" -H "Content-Type: application/json" \
    -d "{\"status\":\"$STATUS\"}" | jq ".status"
done
```

**Esperado**: três respostas `200`, uma por linha: `"en_route"`,
`"in_progress"`, `"completed"`.

## 11. `POST /payments/intent`

```bash
PAYMENT=$(curl -s -X POST "$BASE/payments/intent" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\",\"method\":\"pix\"}")
EXTERNAL_REF=$(echo "$PAYMENT" | jq -r '.payment.externalRef')
echo "$PAYMENT" | jq '.payment.status, .gateway.qrCode'
```

**Esperado**: `201`, `payment.status: "pending"`, `gateway.qrCode`
presente (modo mock — sem `MERCADO_PAGO_ACCESS_TOKEN` configurado).

## 12. `POST /payments/webhook` (sem auth)

```bash
curl -s -X POST "$BASE/payments/webhook" \
  -H "Content-Type: application/json" \
  -d "{\"externalRef\":\"$EXTERNAL_REF\",\"status\":\"approved\"}" | jq '.status'
```

**Esperado**: `201` (Nest usa 201 como default de `@Post` sem
`@HttpCode` — o `curl -s` sem `-w` não mostra o status, então essa
imprecisão só foi pega ao automatizar este passo em
`test/e2e/order-lifecycle.e2e-spec.ts`), `status: "paid"`. Dispara, best-effort, a
concessão de pontos GIUCAR (5% do valor pago).

## 13. `GET /loyalty/balance`

```bash
curl -s "$BASE/loyalty/balance" \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq '.'
```

**Esperado**: `200`, `balance: 400` (5% de R$80 = R$4 = 400 pontos,
1 ponto = R$0,01), `balanceValue: 4`, `nextExpiration` ~90 dias no
futuro.

---

## Resultado esperado (resumo)

| Passo | Verificação |
|---|---|
| 0 | `ZONE_ID` resolvido |
| 1-2 | Cliente registrado e logado |
| 3-4 | Veículo e endereço criados |
| 5 | Pedido criado com `zoneId` resolvido e `status: searching_washer` |
| 6 | Lavador registrado |
| 7 | Perfil criado como `pending_documents` |
| 7a | Perfil ativado pelo admin (`active`) |
| 8-9 | Pedido visível e aceito pelo lavador |
| 10 | Pedido avança até `completed` |
| 11-12 | Pagamento criado e confirmado via webhook |
| 13 | Saldo de pontos GIUCAR creditado |

Se qualquer passo falhar, o `jq` vai mostrar `null`/`error` no lugar
do valor esperado — confira o `statusCode`/`message` da resposta bruta
(`echo "$VAR" | jq '.'` sem filtro) antes de seguir para o próximo
passo.

---

**Validado de verdade em 2026-08-13** contra o stack Docker
(`docker compose up -d --build`, imagens reconstruídas com todas as
mudanças desta sessão): os 13 passos + 7a rodaram em sequência sem
nenhum ajuste no fluxo além dos dois achados já incorporados acima
(passo 7a e o formato de array simples do Passo 8, sem wrapper
`{items,...}`).
