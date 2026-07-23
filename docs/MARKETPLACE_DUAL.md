# Marketplace Dual de Produtos (B2B + B2C)

## Visão geral

O marketplace é dividido em dois frentes:

| Frente | Público | Produtos permitidos |
|---|---|---|
| **Lavador (B2B)** | Profissionais de limpeza automotriz | Insumos profissionais, hidrolavadoras, aspiradoras, produtos concentrados |
| **Cliente (B2C)** | Donos de veículos | Souvenirs, aromatizantes, forros, llaveros, acessórios |

## Modelo de dados

### Supplier (Loja/Tienda)

| Campo | Descrição |
|---|---|
| `name` | Nome da loja |
| `document` | CNPJ/CPF |
| `status` | `pending`, `active`, `inactive`, `blocked` |
| `plan` | `integrated_logistics` ou `own_logistics` |
| `logisticsType` | `platform` (nossa entrega) ou `supplier` (entrega da loja) |
| `monthlyFee` | Mensalidade conforme plano |
| `takeRate` | Comissão sobre vendas |
| `minimumBilling` | Piso de faturamento para cobrar mensalidade |
| `billingActivated` | Se a mensalidade está ativa no período |

### Product

| Campo | Descrição |
|---|---|
| `status` | `draft`, `pending_approval`, `active`, `inactive`, `rejected` |
| `approvalStatus` | `pending_approval`, `approved`, `rejected` |
| `storefront` | `washer`, `customer`, `both` |
| `rejectionReason` | Motivo da rejeição |
| `approvedAt` / `approvedByUserId` | Auditoria de aprovação |

### SupplierPayout

Registra o split financeiro de cada período:

```text
netAmount = totalSales - commission - shippingCost - monthlyFee
```

- `commission` = `totalSales * takeRate`
- `monthlyFee` = `monthlyFee` se `totalSales >= minimumBilling`, senão `0`
- `shippingCost` = coberto pela plataforma apenas em `logisticsType = platform`

## Planos de monetização

| Plano | Mensalidade | Take Rate | Logística |
|---|---|---|---|
| Logística Integrada | R$ 150,00 | 23% | Plataforma faz entrega |
| Logística Própria | R$ 110,00 | 10% | Loja faz entrega |

A mensalidade só é cobrada se o faturamento do período ultrapassar o piso mínimo (padrão R$ 1.800,00).

## Fluxo de onboarding

```mermaid
graph LR
  A[Loja se registra] --> B[Status: pending]
  B --> C[Admin aprova loja]
  C --> D[Status: active]
  D --> E[Loja cadastra produtos]
  E --> F[Produto: pending_approval]
  F --> G[Admin aprova + define storefront]
  G --> H[Produto ativo no catálogo]
```

## Endpoints

### Públicos (sem autenticação)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/marketplace/stores/register` | Registro de nova loja |
| POST | `/marketplace/products/submit` | Submissão de produto |
| GET | `/marketplace/catalog/washer` | Catálogo B2B |
| GET | `/marketplace/catalog/customer` | Catálogo B2C |
| GET | `/marketplace/catalog` | Catálogo geral |
| GET | `/marketplace/catalog/:slug` | Detalhe do produto |

### Admin

| Método | Rota | Descrição |
|---|---|---|
| GET | `/admin/marketplace/products/pending` | Produtos pendentes de aprovação |
| POST | `/admin/marketplace/products/:id/approve` | Aprovar/rejeitar produto |
| PATCH | `/admin/marketplace/suppliers/:id/onboarding` | Aprovar/rejeitar loja |
| PATCH | `/admin/marketplace/suppliers/:id/plan` | Alterar plano de monetização |
| GET | `/admin/marketplace/suppliers/:id/payouts` | Histórico de repasses |
| POST | `/admin/marketplace/suppliers/:id/payouts` | Gerar repasse do período |

## Exemplo de split

Venda de R$ 1.000,00 em um produto no plano Logística Integrada:

```text
totalSales     = 1000.00
commission     = 1000.00 * 0.23 = 230.00
shippingCost   = 0.00 (plataforma)
monthlyFee     = 150.00 (se faturamento >= 1800.00 no período)
netAmount      = 1000.00 - 230.00 - 0.00 - 150.00 = 620.00
```

No plano Logística Própria:

```text
commission     = 1000.00 * 0.10 = 100.00
shippingCost   = 0.00 (loja)
monthlyFee     = 110.00 (se atingiu piso)
netAmount      = 1000.00 - 100.00 - 0.00 - 110.00 = 790.00
```

## Próximos passos

- Criar tela de registro de loja no app/preview.
- Criar tela de cadastro de produtos para lojistas.
- Criar fila de aprovação no admin-web.
- Integrar com gateway de pagamentos para cobrança automática de mensalidade.
- Criar job periódico para gerar payouts automaticamente.

