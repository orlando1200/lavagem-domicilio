# Product Requirements Document (PRD) — GIUCAR

## 1. Visão Geral

O **GIUCAR** é um marketplace de lavagem automotiva a domicílio. No MVP, a plataforma foca em dois serviços rápidos e de baixo impacto ambiental — **Lavado a Seco** e **Lavado Express** — executados por lavadores autônomos. Serviços pesados e de alta complexidade são direcionados a **Lojas de Carwash** cadastradas por meio de um **leilão no formato InDrive**.

A retenção de clientes e parceiros é reforçada pelo programa de pontos **GIUCAR Points**, que converte 5% do valor pago em pontos (1 ponto = R$ 1, válido por 6 meses), combinado com retenção de pagamento, garantia de serviço, agendamento prioritário e ranking algorítmico.

---

## 2. Mudanças Estratégicas Confirmadas

### 2.1 Modelo de Lavado — MVP

| Serviço | Descrição | Executor | Preço de referência | Duração |
|---|---|---|---|---|
| **Lavado a Seco** | Limpeza de carroceria e vidros com produtos biodegradáveis, sem uso de água corrente | Moto Lavador / Carro Lavador | R$ 59,90 | ~30 min |
| **Lavado Express** | Limpeza externa + aspirado interno leve + acondicionador de pneus | Moto Lavador / Carro Lavador | R$ 89,90 | ~45 min |
| **Serviços Pesados** | Polimento, cristalização, descontaminação, lavado de chassi | Loja de Carwash via leilão | a partir de R$ 499,90 | conforme oferta |

### 2.2 Perfis de Lavador

No registro, o parceiro escolhe um dos três perfis:

1. **Moto Lavador**
   - Alta mobilidade urbana.
   - Kit leve no baú: produtos a seco, panos de microfibra, aspirador portátil.
   - Serviços habilitados: Seco e Express.

2. **Carro Lavador**
   - Equipamento maior: hidrolavadora autônoma, tanque pequeno, aspiradora/gerador.
   - Serviços habilitados: Seco, Express e limpezas profundas a domicílio (tapizados, estofados).

3. **Loja de Carwash**
   - Infraestrutura fixa (box, rampa, equipamento profissional).
   - Serviços habilitados: serviços pesados via leilão + marketplace de produtos B2B/B2C.
   - Recebe pedidos de alto valor no formato InDrive.

### 2.3 Leilão InDrive para Serviços Pesados

Fluxo:
1. Cliente solicita serviço pesado (ex: polimento, cristalização).
2. Lojas de Carwash cadastradas recebem a solicitação.
3. Cada loja envia oferta com **preço**, **tempo de execução**, **garantia** e **reputação**.
4. Cliente compara ofertas, fotos de trabalhos anteriores e nota.
5. Cliente escolhe a melhor opção.
6. Pagamento é retido pela plataforma até aprovação do serviço.

### 2.4 Anti-desintermediação — GIUCAR Points

- **5% de cashback** em pontos a cada serviço pago pelo app.
- **1 ponto = R$ 1**.
- **Validade:** 6 meses.
- **Combinações estratégicas:**
  - Retenção de pagamento até aprovação do cliente.
  - Garantia de serviço fornecida pela loja/lavador.
  - Agendamento prioritário via app.
  - Ranking algorítmico que beneficia parceiros fiéis (menor taxa, maior visibilidade).

---

## 3. Personas e Jornadas

### 3.1 Cliente
- Cadastra veículos e endereços.
- Escolhe entre Seco, Express ou serviço pesado (leilão).
- Acompanha pedido em tempo real.
- Acumula pontos GIUCAR e resgata em descontos futuros.
- Serviços pesados: recebe ofertas de lojas, compara e escolhe.

### 3.2 Moto Lavador
- Registra-se com perfil Moto Lavador.
- Fica online/offline.
- Recebe apenas pedidos Seco/Express compatíveis.
- Ganha por serviço e acumula pontuação de fidelidade/freqüência.

### 3.3 Carro Lavador
- Registra-se com perfil Carro Lavador.
- Pode aceitar Seco, Express e limpezas profundas a domicílio.
- Equipamento declarado no cadastro.

### 3.4 Loja de Carwash
- Registra-se como Loja de Carwash.
- Cadastra produtos no marketplace (B2B/B2C).
- Recebe solicitações de leilão e envia ofertas.
- Executa serviços pesados; pagamento retido até aprovação.

---

## 4. Requisitos Funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | Catálogo de serviços deve exibir apenas Seco e Express no fluxo rápido | Alta |
| RF-02 | Serviços pesados devem ser redirecionados para tela de leilão | Alta |
| RF-03 | Registro do lavador deve exigir escolha entre Moto, Carro ou Loja | Alta |
| RF-04 | Pedidos disponíveis devem ser filtrados pelo perfil do lavador | Alta |
| RF-05 | Lojas devem receber notificações de novos leilões | Alta |
| RF-06 | Lojas devem enviar ofertas com preço, prazo e garantia | Alta |
| RF-07 | Cliente deve visualizar ofertas ordenadas por preço, nota e tempo | Alta |
| RF-08 | Cliente deve aceitar uma oferta e confirmar pagamento | Alta |
| RF-09 | Pagamento de serviços pesados fica retido até aprovação do cliente | Alta |
| RF-10 | Cashback de 5% em pontos após confirmação de pagamento | Alta |
| RF-11 | Pontos com validade de 6 meses e conversão 1 ponto = R$ 1 | Alta |
| RF-12 | Ranking algorítmico favorece parceiros com taxa de aceite/qualidade alta | Média |
| RF-13 | Agendamento prioritário para clientes com pontos ativos | Média |
| RF-14 | Histórico de pedidos exibe pontos ganhos por lavagem | Média |
| RF-15 | Loja de Carwash pode cadastrar produtos no marketplace | Média |

---

## 5. Requisitos Não Funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Pagamento via Mercado Pago (PIX/cartão/carteira interna) |
| RNF-02 | Geolocalização e cálculo de distância para matching |
| RNF-03 | WebSocket para tracking e notificações de leilão |
| RNF-04 | Upload de fotos antes/depois com URL pré-assinada (S3) |
| RNF-05 | LGPD: consentimento no cadastro |

---

## 6. Modelo de Dados (resumo)

- `DriverProfile.driverType`: `moto_washer`, `car_washer`, `carwash_shop`
- `Service.type`: `dry_wash`, `express_wash`, `heavy_service`
- `Auction` / `AuctionBid`: leilão InDrive
- `LoyaltyPoint`: transações de pontos GIUCAR
- `Order.serviceChannel`: `on_demand` (app) vs `auction`

---

## 7. Métricas de Sucesso

- Taxa de conversão de cotação → pedido.
- Número de ofertas por leilão.
- Taxa de retenção de clientes (pontos resgatados).
- Taxa de desintermediação medida por repetição de endereço/telefone sem pedido.
- NPS de clientes e lavadores.

---

## 8. Próximos Passos

1. Atualizar schema Prisma com `DriverType` e tabelas de leilão/pontos.
2. Implementar endpoints de leilão (`/auctions`, `/auctions/:id/bids`).
3. Implementar cálculo e expiração de pontos.
4. Adaptar apps Flutter para novos perfis e leilão.
5. Atualizar previews HTML (concluído nesta rodada).

---

*Documento criado em 2026-07-29 e alinhado às 4 mudanças estratégicas confirmadas.*
