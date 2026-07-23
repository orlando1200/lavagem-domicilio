# Revisao Completa de Arquitetura - Lavagem a Domicilio

## Resumo Executivo

Este documento apresenta uma revisao arquitetural completa do projeto **Lavagem a Domicilio**, um marketplace de lavagem automotiva a domicilio. O projeto esta estruturado como monorepo com pnpm workspaces + Turbo, contemplando backend NestJS, admin web Next.js e apps mobile Flutter (cliente e lavador).

**Status atual**: Fundacao implementada (Fase 1 concluida). Backend robusto (~11K linhas TS), admin web funcional (~9K linhas) e app mobile cliente estruturado (~9K linhas Dart). Motorista movel ainda em fase inicial.

---

## 1. Visao Geral da Arquitetura

### 1.1 Stack Tecnologico

### Backend (services/api)
| Componente | Tecnologia | Versao |
|---|---|---|
| Framework | NestJS | 10.3 |
| ORM | Prisma | 5.8 |
| Database | PostgreSQL + PostGIS | 15+
| Cache/Filas | Redis + BullMQ | 7 / 5.1 |
| Auth | JWT + Passport | - |
| Docs | Swagger/OpenAPI | 7.2 |
| Payments | Mercado Pago | API v1 |
| Push | Firebase Admin | 12 |
| Storage | AWS S3 | SDK v3 |
| AI/Compliance | AWS Rekognition | SDK v3 |
| Validation | class-validator + Zod | - |

### Admin Web (apps/admin-web)
| Componente | Tecnologia | Versao |
|---|---|---|
| Framework | Next.js | 14.1 |
| UI Library | React | 18.2 |
| Styling | Tailwind CSS | 3.4 |
| Components | Radix UI + shadcn/ui pattern | - |
| State | Zustand | 4.5 |
| Data Fetching | TanStack Query | 5.17 |
| Forms | React Hook Form + Zod | 7.49 / 3.22 |
| Charts | Recharts | 2.12 |
| Auth | jose (JWT client-side) | 5.2 |

### Mobile Cliente (apps/mobile-client)
| Componente | Tecnologia | Versao |
|---|---|---|
| SDK | Flutter | >=3.2 |
| State | flutter_riverpod | 2.5 |
| Router | go_router | 14.0 |
| HTTP | dio + retrofit | 5.4 / 4.1 |
| Maps | google_maps_flutter | 2.5 |
| Geolocation | geolocator | 11.0 |
| Push | firebase_messaging | 14.7 |
| Storage | flutter_secure_storage | 9.0 |
| Code Gen | freezed + json_serializable + riverpod_generator | - |

### Monorepo Tooling
| Ferramenta | Versao |
|---|---|
| Package Manager | pnpm 8.15 |
| Task Runner | Turbo 1.12 |
| Formatter | Prettier 3.2 |
| TypeScript | 5.3 |

---

## 2. Estrutura de Diretorios

```
C:\Users\orlan\Projects\lavagem-domicilio
|
├── apps/
│   ├── admin-web/          # Next.js 14 - Painel Admin
│   ├── mobile-client/      # Flutter - App do Cliente (~62 arquivos .dart)
│   ├── mobile-driver/      # Flutter - App do Lavador (incompleto)
│   └── preview/            # App de preview (vazio)
│
├── services/
│   └── api/                # NestJS - Backend API (~113 arquivos .ts, ~11K loc)
│       ├── prisma/
│       │   └── schema.prisma   # 50+ modelos, 60+ enums, 1499 linhas
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── database/prisma/
│       │   ├── common/       # Guards, decorators, interceptors, utils
│       │   └── modules/      # 25 dominios implementados
│       └── tsconfig.json
│
├── packages/               # Referenciado em pnpm-workspace.yaml (vazio!)
│   # shared-types, shared-utils, api-client NAO EXISTEM
│
├── infra/
│   └── docker/
│       └── docker-compose.dev.yml   # Postgres + Redis
│
├── docs/
│   └── SETUP.md            # Documentacao de setup
│
├── package.json            # Root scripts
├── pnpm-workspace.yaml     # apps/*, services/*, packages/*
├── turbo.json              # Pipeline build/lint/clean
└── .prettierrc
```

### Estatisticas de Codigo
| Projeto | Arquivos | Linhas aprox. |
|---|---|---|
| Backend API | 113 .ts | ~11,200 |
| Admin Web | 59 .ts/.tsx | ~9,200 |
| Mobile Cliente | 62 .dart | ~9,000 |
| **Total** | **~234** | **~29,400** |

---

## 3. Backend API - Analise Detalhada

### 3.1 Modulos Implementados (25 dominios)

```
services/api/src/modules/
├── auth/              # Implementado completo
├── users/             # Stub
├── drivers/           # Stub (apenas module)
├── services-catalog/  # Stub
├── pricing/           # Stub + spec
├── zones/             # Stub + spec
├── orders/            # Implementado completo
├── payments/          # Implementado completo (Mercado Pago)
├── wallet/            # Stub + spec
├── payouts/           # Stub + spec
├── coupons/           # Stub + spec
├── dispatch/          # Implementado completo
├── tracking/          # Gateway + module
├── chat/              # Gateway + controller + service
├── push/              # Module + service + processor + FCM
├── photos/            # Module + controller + service
├── compliance/        # Module + controller + service + transitions
├── face-check/        # Module + controller + service
├── document-verification/ # Module + controller + service
├── marketplace/       # Module + controller + service
├── rental/            # Module + controller + service
└── starter-kit/       # Module + controller + service + guard + spec
```

**Status**: 7 modulos implementados (~30%), 18 stubs (~70%). Os stubs possuem estrutura basica (Module/Controller/Service) mas sem logica de negocio completa.

### 3.2 Banco de Dados (Prisma Schema)

**Estatisticas**:
- **50+ modelos/tabelas**
- **60+ enums**
- **Extensões PostgreSQL**: PostGIS (geolocalizacao), citext (case-insensitive), pgcrypto
- **Mapeamento snake_case** consistente via `@map`
- **Soft delete** implementado via `deletedAt` no modelo User

**Principais Dominios**:
| Dominio | Modelos |
|---|---|
| Identidade | User, UserProfile, UserDevice, SocialAccount, Address |
| Cliente | ClientProfile, Vehicle |
| Motorista | DriverProfile, DriverDocument, DriverBackgroundCheck, DriverFaceCheck, DriverBankAccount, DriverLocation, DriverAvailabilitySlot |
| Servicos | ServiceCategory, Service, ServiceVehicleRule, ServiceAddon, ServiceRegion |
| Zonas | CoverageZone, ZonePricingRule |
| Pedidos | Quote, QuoteItem, Order, OrderItem, OrderStatusHistory, OrderPhoto, DispatchAttempt |
| Tracking | LiveTrackingSession |
| Chat | ChatConversation, ChatMessage |
| Pagamentos | PaymentTransaction, WalletAccount, WalletLedgerEntry, DriverPayout |
| Cupons | Coupon, CouponRedemption, Promotion |
| Reviews | Review, ReviewReport |
| Marketplace | Supplier, Product, ProductImage, StarterKitConfig, MarketplaceOrder, MarketplaceOrderItem |
| Aluguel | RentalPartner, RentalOffer, RentalLead |
| Suporte | SupportTicket |
| Admin | AdminAuditLog |
| Arquivos | File |

### 3.3 Pontos Fortes do Backend

1. **Autenticacao JWT completa**: Login, refresh token, registro separado de cliente/motorista, guards e strategies configurados
2. **Validacao global**: `ValidationPipe` com whitelist, forbidNonWhitelisted e transformacao automatica
3. **Soft delete**: Modelo User possui campo `deletedAt`
4. **Auditoria**: `AdminAuditLog` com before/after data e IP
5. **WebSockets**: Chat e Tracking com Socket.io
6. **Swagger docs**: Documentacao completa com tags organizadas
7. **Prisma logging**: Queries logadas em desenvolvimento
8. **Idempotencia**: Chaves de idempotencia em pagamentos Mercado Pago
9. **CORS configurado**: Origens especificas por ambiente
10. **Path mapping**: `tsconfig` com aliases `/common`, `/modules`, `/config`, `/database`

### 3.4 Pontos de Atencao do Backend

| # | Problema | Severidade | Evidencia |
|---|---|---|---|
| 1 | **Dispersao entre stubs e implementacoes** | Media | 18 de 25 modulos sao stubs |
| 2 | **Dispatch com polling DB** | Media-Alta | `waitForResponse` faz polling a cada 5s no banco |
| 3 | **Sem rate limiting** | Alta | Nenhum `ThrottlerModule` ou middleware de rate limit |
| 4 | **Sem testes unitarios substanciais** | Media | Apenas 3 arquivos `.spec.ts` vazios/gerados |
| 5 | **Sem tratamento de excecao global** | Media | Ausencia de `AllExceptionsFilter` customizado |
| 6 | **Payments: circular dependency workaround** | Baixa | `@Optional() @Inject(STARTER_KIT_SERVICE)` usa Symbol para evitar circular dep |
| 7 | **CleanDatabase sem restricao completa** | Baixa | `cleanDatabase()` usa `Reflect.ownKeys` que pode falhar em modelos ocultos |
| 8 | **ENUMS em strings sem type safety** | Baixa | Alguns campos de status string em vez de enum Prisma |
| 9 | **Falta paginacao padrao** | Baixa | Alguns endpoints podem retornar grandes listas |

### 3.5 Servicos Criticos Analisados

#### AuthService (`services/api/src/modules/auth/auth.service.ts`)
- **OK**: bcrypt hash, validacao de status, refresh token rotation, LGPD consent
- **ATENCAO**: Refresh token nao e invalidado apos uso (nao ha blacklist/whitelist de refresh tokens)

#### PaymentsService (`services/api/src/modules/payments/payments.service.ts`)
- **OK**: Integracao Mercado Pago via fetch, PIX QR code, cartao, wallet interno, webhook, idempotencia
- **OK**: Sistema de ledger para carteira digital
- **ATENCAO**: Token MP obtido de config sem fallback seguro; sem retry em falhas de rede
- **ATENCAO**: `markOrderPaid` credita driver wallet mesmo se o pedido ainda nao foi concluido (hold pending)

#### DispatchService (`services/api/src/modules/dispatch/dispatch.service.ts`)
- **OK**: Algoritmo de scoring (distancia 60% + rating 40%), haversine distance, tentativas sequenciais
- **ATENCAO**: Loop while pode ficar preso se sempre houver candidatos; polling DB e ineficiente para espera de resposta do driver
- **SUGESTAO**: Usar Redis pub/sub ou BullMQ para timeout de ofertas

---

## 4. Admin Web - Analise Detalhada

### 4.1 Estrutura

```
apps/admin-web/src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout com Inter font
│   ├── page.tsx              # Landing/Login redirect
│   ├── providers.tsx         # TanStack Query provider
│   ├── globals.css           # Tailwind globals
│   ├── login/                # Pagina de login
│   └── (admin)/              # Route group protegido
│       ├── layout.tsx
│       ├── dashboard/
│       ├── pedidos/
│       ├── lavadores/
│       ├── usuarios/
│       ├── servicos/
│       ├── categorias/
│       ├── cupons/
│       ├── repasses/
│       ├── relatorios/
│       ├── compliance/
│       ├── kit-inicial/
│       ├── marketplace/
│       ├── aluguel-motos/
│       └── zonas/
├── components/
│   ├── layout/               # header.tsx, sidebar.tsx
│   ├── orders/               # OrderDetailModal, Chat, Timeline, Photos, Map
│   └── ui/                   # shadcn/ui components (Button, Dialog, Table, etc.)
├── hooks/                    # 14 custom hooks (use-categories, use-orders, etc.)
├── lib/
│   ├── api.ts                # Axios instance com interceptores
│   └── utils.ts              # cn() helper
├── store/
│   └── auth.ts               # Zustand auth store
├── types/
│   └── index.ts              # Tipos compartilhados
└── middleware.ts             # Middleware de autenticacao
```

### 4.2 Pontos Fortes
- **App Router**: Next.js 14 com route groups `(admin)` e segmentacao adequada
- **State Management**: Zustand com persistencia no localStorage + cookie espelhado
- **Data Fetching**: TanStack Query para cache e sincronizacao
- **Componentes UI**: Padrao shadcn/ui com Radix primitives
- **Middleware**: Protecao de rotas com redirecao para login

### 4.3 Pontos de Atencao

| # | Problema | Severidade | Evidencia |
|---|---|---|---|
| 1 | **Middleware: cookie espelhado** | Alta | `middleware.ts` tenta ler auth do localStorage via cookie `admin-auth` como workaround para SSR |
| 2 | **Sem protecao de rotas por role** | Alta | Middleware nao verifica role do usuario (admin vs read-only) |
| 3 | **API URL hardcoded fallback** | Baixa | `lib/api.ts` usa `http://localhost:3001` como fallback |
| 4 | **Sem tratamento de erro global** | Media | Nenhum Error Boundary ou tratamento de falhas de API |
| 5 | **Logout sem invalidacao server-side** | Media | Logout limpa apenas store local, nao invalida token no backend |

### 4.4 Middleware de Autenticacao

```ts
// C:\Users\orlan\Projects\lavagem-domicilio\apps\admin-web\src\middleware.ts
// PROBLEMA: Leitura do localStorage via cookie espelhado e fragil
// O middleware server-side nao tem acesso ao localStorage.
// A solucao atual depende de sincronizacao manual cookie <-> localStorage,
// que pode ficar desincronizada (ex: cookie expira, localStorage nao).
```

**Recomendacao**: Mover auth para cookies HTTP-only server-readable ou usar JWT session cookie.

---

## 5. Mobile Cliente - Analise Detalhada

### 5.1 Estrutura

```
lib/
├── main.dart                 # Entry point com ProviderScope
├── core/
│   ├── constants/
│   ├── infrastructure/         # API client, secure storage
│   ├── router/               # Go Router
│   ├── theme/                # AppTheme, AppColors
│   └── widgets/              # AppScaffold, Skeleton, SectionCard
└── features/
    ├── addresses/            # Data + Presentation (Repository, Provider, Page)
    ├── auth/
    ├── catalog/
    ├── home/
    ├── marketplace/
    ├── moto_rental/
    ├── orders/
    ├── quote/
    ├── shared/
    └── vehicles/
```

### 5.2 Arquitetura Features
Cada feature segue **Clean Architecture simplificada**:
- `data/` - Repositories e Models
- `presentation/` - Pages e Providers (Riverpod)

### 5.3 Pontos Fortes
- **Separation of concerns**: Features isoladas com proprias camadas
- **State Management**: Riverpod com geracao de codigo (`riverpod_generator`)
- **HTTP**: Dio + Retrofit para API REST tipada
- **Seguranca**: `flutter_secure_storage` para tokens
- **Routing**: Go Router para navegacao declarativa
- **Code Generation**: freezed, json_serializable, retrofit_generator

### 5.4 Pontos de Atencao

| # | Problema | Severidade |
|---|---|---|
| 1 | **Assets/fonts comentados** | Baixa | Nenhuma imagem ou fonte carregada no pubspec |
| 2 | **Sem testes visiveis** | Media | Apenas `flutter_test` em dev_dependencies, sem testes na estrutura |
| 3 | **Pubspec version desatualizada** | Baixa | `1.0.0+1` - versao precisa de strategy |

---

## 6. Infraestrutura e DevOps

### 6.1 Docker Compose Local
```yaml
# infra/docker/docker-compose.dev.yml
services:
  postgres: postgis/postgis:15-3.4  # PostgreSQL 15 + PostGIS 3.4
  redis: redis:7-alpine
```
- Healthchecks configurados
- Volumes persistentes nomeados
- **Faltando**: container para a propria API, app Next.js

### 6.2 Variaveis de Ambiente
- `.env.local.example` existe para admin-web
- `.env.example` deve ser criado para API (referenciado no SETUP.md)
- MongoDB nao e usado (confirmado)

### 6.3 Ausencias Criticas
- **Sem CI/CD**: Nenhum GitHub Actions, GitLab CI ou similar
- **Sem Terraform**: Diretorio `infra/terraform` nao existe apesar de ser mencionado no README
- **Sem scripts de deploy**: Nenhum Dockerfile para producao
- **Sem logs centralizados**: Sem configuracao de Winston/Pino estruturado
- **Sem metricas**: Sem OpenTelemetry, Prometheus ou similar

---

## 7. Seguranca

### 7.1 Implementado
- Senhas com bcrypt (10 rounds)
- JWT com access (15m) e refresh (7d) tokens
- CORS com origens restritas
- Guards de autenticacao (JWT, Local)
- Validacao de input com class-validator
- AWS Rekognition para verificacao facial
- LGPD: Consentimento explicito no registro

### 7.2 Nao Implementado / Riscos
- **Rate Limiting**: Ausente em todas as camadas
- **SQL Injection**: Mitigado pelo Prisma, porem queries raw ausentes
- **XSS**: Next.js mitiga parcialmente, mas validacao de output ausente
- **CSRF**: Nao configurado explicitamente
- **Data Validation**: Zod usado apenas em alguns lugares, class-validator no resto
- **API Keys**: Nenhum mecanismo de API key para integracoes
- **Request Logging**: Sem log de request/response para auditoria
- **WAF/Security Headers**: Ausente
- **Helmet.js**: Nao configurado no NestJS

---

## 8. Qualidade de Codigo e Padroes

### 8.1 Lint e Formatacao
- **Prettier** configurado no root
- **ESLint** presente em API (`eslint-config-prettier`, `eslint-plugin-prettier`)
- **Next.js ESLint** presente em admin-web
- **Flutter lints** presente em mobile

### 8.2 TypeScript
- Strict null checks habilitado
- No implicit any habilitado
- Paths aliases consistentes

### 8.3 Padroes Observados
- **NestJS**: Padrao controller/service/module por dominio (bom)
- **Next.js**: App Router com server/client separation (bom)
- **Flutter**: Feature-based Clean Architecture (bom)
- **Database**: Prisma schema bem organizado por dominio

### 8.4 Testes
| Projeto | Arquivos de Teste | Status |
|---|---|---|
| API | `coupons.service.spec.ts`, `dispatch.service.spec.ts`, `payouts.service.spec.ts`, `pricing.service.spec.ts`, `services-catalog.service.spec.ts`, `starter-kit.service.spec.ts`, `users.service.spec.ts`, `wallet.service.spec.ts`, `zones.service.spec.ts` | Todos stubs vazios/gerados |
| Admin Web | 0 | Nenhum |
| Mobile | 0 | Nenhum |

**Cobertura**: ~0% de testes reais.

---

## 9. Dependencias e Pacotes Compartilhados

### 9.1 Monorepo Packages
O `pnpm-workspace.yaml` referencia `packages/*`, porem o diretorio **esta vazio**. Isso significa:
- Nao ha `shared-types` (tipos compartilhados entre API e frontend)
- Nao ha `shared-utils` (utils compartilhados)
- Nao ha `api-client` (cliente HTTP padronizado)

**Impacto**: Duplicacao de tipos no Admin Web (`apps/admin-web/src/types/index.ts`) e na API (`Prisma client`).

### 9.2 Dependencias Potencialmente Desatualizadas
- `@aws-sdk/*` ^3.523.0 (verificar atualizacoes criticas)
- `nest` 10.3.0 (nova versao 11 disponivel)
- `prisma` 5.8.0 (versao 6 disponivel)

---

## 10. Recomendacoes por Prioridade

### PRIORIDADE ALTA (Imediata)
1. **Implementar Rate Limiting**: `ThrottlerModule` no NestJS ou middleware customizado
2. **Corrigir Middleware de Auth**: Usar cookies HTTP-only ou session JWT no admin-web
3. **Adicionar Helmet.js**: Headers de seguranca no NestJS
4. **Implementar testes criticos**: Auth, Payments e Orders precisam de cobertura
5. **Adicionar Error Boundary e tratamento global**: `AllExceptionsFilter` no NestJS

### PRIORIDADE MEDIA (Proximo sprint)
6. **Refatorar Dispatch**: Substituir polling por BullMQ ou Redis pub/sub para timeout de ofertas
7. **Criar packages compartilhados**: `shared-types`, `shared-utils`, `api-client`
8. **Implementar RBAC no Admin Web**: Middleware verificar role do admin
9. **Adicionar logs estruturados**: Pino/Winston no backend
10. **Setup CI/CD basico**: GitHub Actions para lint, typecheck e testes

### PRIORIDADE BAIXA (Backlog)
11. **Completar mobile-driver**: Iniciar desenvolvimento do app do lavador
12. **Infraestrutura Terraform**: Criar IaC para AWS
13. **Dockerfile para producao**: Multi-stage builds para API e Next.js
14. **Analytics e OTel**: OpenTelemetry para tracing distribuido
15. **Documentacao de API**: Expandir docs com exemplos de requisicao

---

## 11. Conclusao

O projeto **Lavagem a Domicilio** possui uma **fundacao arquitetural solida e bem planejada**. O monorepo esta corretamente estruturado, a escolha de tecnologias e adequada para o escopo de um marketplace de servicos, e o schema de banco de dados e abrangente e bem modelado.

### Pontos Positivos
- Arquitetura modular clara no backend
- Schema Prisma robusto e completo
- Separacao de responsabilidades consistente
- Stack moderna e produtiva (NestJS, Next.js, Flutter)
- Autenticacao JWT implementada corretamente
- Integracao de pagamento funcional (Mercado Pago)

### Principais Riscos
- **Baixa cobertura de testes** (cobertura ~0%)
- **Ausencia de rate limiting** (vulnerabilidade a abuso)
- **Seguranca do admin web** (middleware inseguro)
- **Dependencia de stubs** (70% dos modulos do backend sao stubs)
- **Ausencia de CI/CD e infraestrutura como codigo**

### Recomendacao Estrategica
O projeto esta **pronto para desenvolvimento incremental**, mas precisa urgentemente de:
1. Testes automatizados (minimo de 60% cobertura em auth, payments, orders)
2. Rate limiting e headers de seguranca
3. CI/CD para prevenir regressoes
4. Finalizacao dos stubs criticos (users, drivers, wallet, payouts)

Com esses ajustes, o projeto tera uma base produtiva segura para escalar.

