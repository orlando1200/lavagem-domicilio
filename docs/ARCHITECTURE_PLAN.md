# Plano de Arquitetura — GIUCAR

## 1. Resumo Executivo

Este documento consolida a arquitetura do projeto **GIUCAR** após as 4 mudanças estratégicas confirmadas:

1. **MVP de lavagem focado em Lavado a Seco + Express**.
2. **3 perfis de lavador**: Moto Lavador, Carro Lavador e Loja de Carwash.
3. **Leilão no formato InDrive** para serviços pesados nas Lojas de Carwash.
4. **Programa de pontos GIUCAR** com 5% cashback, 1 ponto = R$ 1, validade 6 meses, combinado com retenção de pagamento, garantia, agendamento prioritário e ranking algorítmico.

O projeto continua como monorepo pnpm + Turbo, backend NestJS, admin web Next.js e apps Flutter para cliente, lavador e lojista.

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend API | NestJS + Prisma | 10.3 / 5.8 |
| Banco de dados | PostgreSQL + PostGIS | 15+ |
| Cache / Filas | Redis + BullMQ | 7 / 5.1 |
| Auth | JWT + Passport | - |
| Pagamentos | Mercado Pago | API v1 |
| Push | Firebase Admin | 12 |
| Storage | AWS S3 | SDK v3 |
| Admin Web | Next.js + Tailwind + shadcn/ui | 14.1 |
| Mobile | Flutter + Riverpod + Go Router | >=3.2 |
| Monorepo | pnpm workspaces + Turbo | 8.15 / 1.12 |

---

## 3. Estrutura de Diretórios

```
C:\Users\orlan\Projects\lavagem-domicilio
├── apps/
│   ├── admin-web/          # Painel administrativo Next.js
│   ├── mobile-client/      # Flutter — Cliente
│   ├── mobile-driver/      # Flutter — Lavador / Moto / Carro / Loja
│   ├── mobile-lojista/     # Flutter — Portal do Lojista (pode ser unificado ao driver no futuro)
│   └── preview/            # Previews HTML estáticos
├── services/
│   └── api/                # Backend NestJS
├── docs/
│   ├── PRD.md              # Requisitos de produto
│   ├── ARCHITECTURE_PLAN.md # Este documento
│   └── ...
├── packages/               # Reservado para shared-types, api-client, utils
├── infra/docker/           # Docker Compose dev
└── .github/workflows/      # CI/CD
```

---

## 4. Domínios do Backend

### 4.1 Módulos Implementados / Stubs

Backend possui 25 domínios, dos quais ~30% implementados (auth, orders, payments, dispatch, chat, tracking, push, photos, compliance, marketplace, rental, starter-kit).

### 4.2 Novos Domínios Necessários

| Domínio | Responsabilidade | Status |
|---|---|---|
| `DriverProfile.driverType` | `moto_washer`, `car_washer`, `carwash_shop` | Incluir no schema |
| `Auctions` | Leilão InDrive de serviços pesados | Novo módulo |
| `AuctionBids` | Ofertas das lojas | Novo módulo |
| `LoyaltyPoints` | Cashback e saldo de pontos GIUCAR | Novo módulo |
| `Ranking` | Score algorítmico de parceiros | Novo serviço dentro de drivers/orders |

### 4.3 Banco de Dados — Adições ao Schema

```prisma
enum DriverType {
  MOTO_WASHER
  CAR_WASHER
  CARWASH_SHOP
}

model DriverProfile {
  // ... campos existentes
  driverType DriverType @default(CAR_WASHER)
  allowedServices ServiceType[]
}

enum ServiceType {
  DRY_WASH
  EXPRESS_WASH
  HEAVY_SERVICE
}

model Auction {
  id            String   @id @default(uuid())
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id])
  serviceIds    String[]
  vehicleId     String
  addressId     String
  status        AuctionStatus @default(open)
  maxBudget     Decimal?
  deadlineHours Int?
  createdAt     DateTime @default(now())
  closedAt      DateTime?
  winningBidId  String?  @unique
}

model AuctionBid {
  id          String   @id @default(uuid())
  auctionId   String
  auction     Auction  @relation(fields: [auctionId], references: [id])
  supplierId  String
  supplier    Supplier @relation(fields: [supplierId], references: [id])
  amount      Decimal
  durationHours Int
  warrantyDays Int
  message     String?
  photos      String[]
  status      BidStatus @default(pending)
  createdAt   DateTime @default(now())
}

model LoyaltyPoint {
  id          String   @id @default(uuid())
  userId      String
  orderId     String?
  amount      Int      // pontos (1 ponto = R$ 1)
  expiresAt   DateTime
  usedAt      DateTime?
  createdAt   DateTime @default(now())
}
```

---

## 5. Fluxos de Negócio

### 5.1 Pedido Rápido (Seco/Express)

1. Cliente seleciona veículo e endereço.
2. Escolhe Seco ou Express.
3. Sistema calcula preço e ETA.
4. Dispatch oferece apenas a lavadores cujo `driverType` permita o serviço.
5. Lavador aceita, executa e registra fotos.
6. Cliente aprova; pagamento liberado.
7. Cliente recebe 5% do valor em pontos GIUCAR.

### 5.2 Serviço Pesado via Leilão

1. Cliente seleciona serviço pesado (polimento, cristalização, etc.).
2. Sistema cria `Auction` vinculada a um `Order` em status `awaiting_bids`.
3. Lojas de Carwash dentro do raio recebem notificação.
4. Lojas enviam `AuctionBid` com preço, prazo, garantia e fotos.
5. Cliente visualiza ranking de ofertas (preço, nota, tempo).
6. Cliente aceita oferta; `Order` vira `pending_payment` e depois `paid`.
7. Pagamento retido até cliente aprovar entrega.
8. Loja executa, envia fotos; cliente aprova.
9. Pagamento liberado e pontos creditados.

### 5.3 Programa GIUCAR Points

- Após confirmação do pagamento:
  - `amount = floor(order.total * 0.05)`
  - Cria registro `LoyaltyPoint` com `expiresAt = now() + 6 months`.
- Resgate: pontos podem ser usados como crédito no checkout.
- Expiração: job noturno inativa pontos vencidos.
- Ranking: parceiros com mais pedidos, melhor nota e menor taxa de cancelamento sobem no algoritmo de matching.

---

## 6. Mobile

### 6.1 App Cliente

- Home com ações rápidas: Seco/Express, Serviços Pesados (leilão), Veículos, GIUCAR Points.
- Tela de leilão: listar ofertas das lojas com preço, tempo, nota e fotos.
- Perfil: saldo de pontos e regras de cashback.

### 6.2 App Lavador

- Fluxo de registro com escolha de perfil (Moto/Carro/Loja).
- Home exibe pedidos filtrados pelo perfil.
- Moto Lavador vê apenas Seco/Express leves.
- Carro Lavador vê Seco/Express + limpezas profundas.
- Loja de Carwash acessa aba Leilão para enviar ofertas.

### 6.3 App Lojista

- Home com botão de acesso ao Leilão de Serviços Pesados.
- Tela de leilão: solicitações abertas, ofertas enviadas, encerradas.
- Marketplace de produtos mantido.

---

## 7. Anti-desintermediação

Estratégias combinadas:

| Mecanismo | Como funciona |
|---|---|
| **GIUCAR Points** | 5% cashback em pontos somente para pagamentos pelo app |
| **Retenção de pagamento** | Valor fica em escrow até aprovação do cliente |
| **Garantia de serviço** | Loja/lavador oferece garantia declarada na oferta |
| **Agendamento prioritário** | Clientes com pontos ativos têm prioridade na fila de matching |
| **Ranking algorítmico** | Parceiros fiéis (alta aceitação, boa nota, baixo cancelamento) recebem mais visibilidade e menores taxas |

---

## 8. CI/CD e Qualidade

- GitHub Actions para lint, typecheck, build e testes.
- Backend: `pnpm --filter api build` e `pnpm --filter api test`.
- Admin: `pnpm --filter admin-web build`.
- Mobile: `flutter analyze` (não bloqueante até geração de pastas nativas).
- Prettier e ESLint configurados no monorepo.

---

## 9. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Baixa oferta em leilões | Convite ativo de lojas e comissão competitiva |
| Desintermediação | Points + retenção + garantia + ranking |
| Matching ineficiente | Filtrar pedidos por `driverType` e raio |
| Expiração de pontos | Job noturno + notificação push antes do vencimento |

---

## 10. Próximos Passos Técnicos

1. Atualizar schema Prisma (`DriverType`, `Auction`, `AuctionBid`, `LoyaltyPoint`).
2. Criar módulos `auctions` e `loyalty` no backend.
3. Adicionar filtros de perfil no dispatch service.
4. Implementar tela de leilão no app cliente.
5. Implementar fluxo de escolha de perfil no app lavador.
6. Implementar tela de envio de ofertas no app lojista.
7. Atualizar documentação de produto (PRD) e previews HTML (concluído).

---

*Documento criado em 2026-07-29 e alinhado às 4 mudanças estratégicas confirmadas.*
