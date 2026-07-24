# Backend Recovery Audit — `services/api`

## Contexto

Esta auditoria foi feita no inicio de uma nova rodada de recuperacao do backend
(`services/api`, NestJS + Prisma). Antes de iniciar qualquer reconstrucao,
verificou-se que **uma rodada anterior de recuperacao (Fase 9) ja havia sido
executada** neste ambiente: parte do scaffolding base, o isolamento dos
modulos corrompidos e um schema Prisma minimo/valido ja estavam presentes
(arquivos untracked no git, criados em 23/07/2026). Esta auditoria consolida
o estado real encontrado, evita retrabalho e direciona o que ainda falta.

Ferramentas Node/npm/pnpm **nao estao instaladas** nesta maquina, portanto
toda verificacao de sintaxe abaixo foi feita por leitura manual de arquivo e
contagem de chaves (`{`/`}`), sem `tsc`/`eslint`/`jest` reais.

## 1. Estado do Scaffolding (antes desta rodada)

| Arquivo | Status | Observacao |
|---|---|---|
| `services/api/package.json` | SANO | NestJS 10, Prisma 5, TypeScript 5, Jest, ESLint ja configurados. Faltam libs de dominio (class-validator, class-transformer, @nestjs/config, @nestjs/jwt, bcryptjs) usadas pelos modulos ainda isolados — adicionadas nesta rodada. |
| `services/api/tsconfig.json` | SANO | `include` restrito a `main.ts`, `app.module.ts`, `database/**`, `modules/health/**`; `exclude` isola os 18 modulos corrompidos. |
| `services/api/tsconfig.build.json` | SANO | Estende `tsconfig.json`. |
| `services/api/nest-cli.json` | SANO | Aponta para `tsconfig.build.json`. |
| `services/api/.eslintrc.js` | SANO | `ignorePatterns` isola os mesmos 18 modulos. |
| `services/api/jest.config.js` | SANO | `testPathIgnorePatterns` isola os mesmos modulos. |
| `services/api/.gitignore` | SANO | `node_modules`, `dist`, `coverage`, `.env`. |
| `services/api/src/main.ts` | SANO | Bootstrap minimo, prefixo `api/v1`, exclui `health`. |
| `services/api/src/app.module.ts` | SANO | Importa apenas `DatabaseModule` + `HealthModule`. |
| `services/api/src/database/database.module.ts` | SANO | Modulo global exportando `PrismaService`. |
| `services/api/src/database/prisma.service.ts` | SANO | Extende `PrismaClient`, lifecycle hooks corretos. |
| `services/api/src/modules/health/*` | SANO | Controller + service + module completos e testados (`test/health.controller.spec.ts`). |
| `services/api/prisma/schema.prisma` | SANO (mas minimo) | Reduzido para `generator` + `datasource` + `model HealthCheck` apenas, para permitir `prisma generate` no CI. Nao reflete o dominio real. |
| `services/api/prisma/schema.prisma.corrupted-backup` | PRESERVADO | Schema original de ~1447 linhas, ~82% em branco, preservado para referencia manual (nao deletado). |
| `services/api/prisma/migrations/20250101000000_init` | PARCIAL | So contem `README.md` com instrucoes; sem `migration.sql` real (banco nunca foi migrado de fato). |
| `services/api/prisma/migrations/20250716000000_admin_fields` | SANO | `migration.sql` valido (ALTER TABLE em `service_categories`/`coverage_zones`), mas depende de tabelas que nao existem na migration inicial. |
| `.github/workflows/ci.yml` | SANO (mas desatualizado) | Pipeline com jobs `api`/`admin-web`/`mobile`/`docker`; nao inclui `docs`/gh-pages. Corrigido nesta rodada para instalar tambem libs novas e continuar isolando modulos corrompidos. |
| `.github/workflows/deploy.yml` | CORROMPIDO | Blocos de step duplicados/colados (ex.: `Build API` duas vezes, `Build and push Admin Web image` com fragmentos soltos fora de posicao). Corrigido nesta rodada. |
| `docs/FASE9_ARCHITECTURE.md` | SANO | Documenta o pipeline de CI (nao AWS). |
| `docs/MARKETPLACE_DUAL.md` | SANO | Documenta o modelo de dominio ANTIGO (Supplier/Product/StorePlan) — mantido como referencia historica; o novo modelo (Store/LAVADOR/CLIENTE) e documentado nesta auditoria e no schema novo. |

## 2. Auditoria de `src/modules/*` (18 modulos, 74 arquivos `.ts`)

Cada arquivo foi lido por completo e verificado quanto a: balanceamento de
chaves `{`/`}`, imports quebrados ou ausentes, classes referenciadas por
`*.module.ts` mas nunca declaradas, e blocos de dezenas/centenas de linhas em
branco no meio do arquivo (assinatura tipica de truncamento).

| Arquivo | Linhas | Status | Observacao |
|---|---|---|---|
| `analytics/analytics.module.ts` | 13 | SUSPEITO | Importa `AnalyticsController` de `./analytics.controller` — arquivo **nao existe**. |
| `analytics/analytics.service.ts` | 257 | CORROMPIDO | Chaves desbalanceadas (82/80). `getFinancialReport` declarado 4x, corpo final truncado. |
| `analytics/dashboard.admin.controller.ts` | 16 | CORROMPIDO | Sem imports, sem decorators de controller. |
| `analytics/dto/analytics.dto.ts` | 145 | CORROMPIDO | Comeca no meio de uma classe; `TransactionsReportQueryDto` declarada 2x. |
| `compliance/compliance.admin.controller.ts` | 168 | SUSPEITO | Balanceado, mas acessa campo privado via `this.complianceService['prisma']`. |
| `compliance/compliance.controller.ts` | 49 | CORROMPIDO | So exporta `AdminComplianceController`; `ComplianceController` (usado pelo module) nunca declarado. |
| `compliance/compliance.module.ts` | 15 | SUSPEITO | Depende da classe ausente acima. |
| `coupons/coupons.admin.controller.ts` | 176 | CORROMPIDO | Funcoes/metodos duplicados; `create` sem `return`. |
| `coupons/coupons.module.ts` | 14 | SUSPEITO | Importa `CouponsController` de `./coupons.controller` — arquivo **nao existe**. |
| `coupons/coupons.service.ts` | 25 | CORROMPIDO | Comeca no meio de um metodo; `findAll` truncado. |
| `coupons/dto/coupons.dto.ts` | 29 | CORROMPIDO | Comeca no meio de uma classe, sem imports. |
| `dispatch/dispatch.module.ts` | 12 | SUSPEITO | Importa `DispatchController` — arquivo **nao existe**. |
| `dispatch/dispatch.service.ts` | 158 | CORROMPIDO | ~100 linhas em branco consecutivas; arquivo termina no meio de uma instrucao. |
| `dispatch/driver-notifications.gateway.ts` | 64 | SANO | Completo e balanceado. |
| `document-verification/document-verification.controller.ts` | 7 | CORROMPIDO | Sem imports; construtor truncado sem metodos. |
| `drivers/drivers.controller.ts` | 17 | CORROMPIDO | Comeca no meio de um metodo; termina no meio de uma assinatura. |
| `drivers/drivers.module.ts` | 14 | SANO | Completo e balanceado. |
| `drivers/drivers.service.ts` | 249 | CORROMPIDO | ~115 + ~60 linhas em branco; `getDriverById` duplicado. |
| `drivers/washers.admin.controller.ts` | 50 | SANO | Completo e balanceado. |
| `drivers/dto/driver-availability.dto.ts` | 7 | SANO | Completo. |
| `face-check/face-check.controller.ts` | 7 | CORROMPIDO | Sem imports; sem metodos. |
| `loyalty/loyalty.admin.controller.ts` | 109 | SANO | Completo e balanceado. |
| `loyalty/loyalty.module.ts` | 12 | SANO | Completo e balanceado. |
| `loyalty/loyalty.service.ts` | 97 | CORROMPIDO | `getSummary` corrompido; `deleteCampaign` duplicado, arquivo corta no meio. |
| `loyalty/dto/loyalty-campaign.dto.ts` | 122 | SANO | Completo. |
| `marketplace/marketplace.admin.controller.ts` | 238 | CORROMPIDO | Helpers duplicados (2 versoes com campos diferentes); parametro sem metodo. |
| `marketplace/marketplace.controller.ts` | 177 | CORROMPIDO | ~100 linhas em branco onde deveriam estar `SuppliersController`/`ProductsController`; `MarketplaceOrdersController` nunca declarado. |
| `marketplace/marketplace.module.ts` | 25 | SUSPEITO | Importa 5 classes do controller, 3 nao existem. |
| `marketplace/marketplace.service.ts` | 531 | CORROMPIDO | Metodos duplicados 2-4x (`listSuppliers`, `listProducts`, etc.); comeca no meio de um import. |
| `marketplace/dto/marketplace.dto.ts` | 347 | CORROMPIDO | Multiplas classes duplicadas com campos conflitantes. |
| `orders/orders.admin.controller.ts` | 15 | CORROMPIDO | Comeca/termina no meio de metodos, sem classe. |
| `orders/orders.controller.ts` | 83 | CORROMPIDO | Importa `./dto/create-order.dto` e `./dto/list-orders.dto` — **nao existem**. Gap de 42 linhas em branco. |
| `orders/orders.module.ts` | 12 | SANO | Balanceado, mas depende do controller quebrado. |
| `orders/orders.service.ts` | 596 | CORROMPIDO | Pior arquivo do projeto: chaves 95/103 (8 de sobra), 4 gaps de linhas em branco, `mapVehicleSize` declarado 3x com mapas conflitantes. |
| `orders/dto/admin-order.dto.ts` | 47 | SANO | Completo. |
| `orders/dto/admin-orders.dto.ts` | 66 | SANO | Completo. |
| `orders/dto/chat.dto.ts` | 8 | SANO | Completo. |
| `payouts/payouts.module.ts` | 15 | SUSPEITO | Importa `PayoutsController` — arquivo **nao existe**. |
| `payouts/payouts.service.ts` | 90 | CORROMPIDO | Comeca no meio de uma template string; `approvePayout` duplicado. |
| `payouts/repayments.admin.controller.ts` | 91 | SANO | Completo e balanceado. |
| `payouts/dto/payouts.dto.ts` | 72 | CORROMPIDO | Gap de ~22 linhas em branco dentro de uma classe. |
| `rental/moto-rental.admin.controller.ts` | 229 | CORROMPIDO | Fragmentos e decorators duplicados; helpers declarados 2x. |
| `rental/rental.module.ts` | 23 | SUSPEITO | Importa 3 classes de `./rental.controller` — arquivo **nao existe**. |
| `rental/rental.service.ts` | 136 | CORROMPIDO | Chaves 47/45; gap de ~46 linhas; `findOneOffer` sem corpo. |
| `rental/dto/rental.dto.ts` | 195 | CORROMPIDO | Gaps de ~55 e ~73 linhas em branco dentro de classes. |
| `services-catalog/categories.admin.controller.ts` | 89 | CORROMPIDO | Metodos duplicados; chave extra apos fechamento da classe. |
| `services-catalog/services-catalog.controller.ts` | 66 | CORROMPIDO | Imports/decorators fora de ordem; chaves 12/15. |
| `services-catalog/services-catalog.module.ts` | 18 | SANO | Completo e balanceado. |
| `services-catalog/services-catalog.service.ts` | 274 | CORROMPIDO | Chaves 101/103; metodos duplicados varias vezes. |
| `services-catalog/services.admin.controller.ts` | 140 | CORROMPIDO | Decorators orfaos ao final; funcao solta entre classes. |
| `services-catalog/dto/services-catalog.dto.ts` | 253 | CORROMPIDO | `CreateServiceCategoryDto` declarada 3x; gaps de ~42 e ~43 linhas. |
| `starter-kit/starter-kit.controller.ts` | 30 | CORROMPIDO | Sem imports nem decorator de controller. |
| `starter-kit/starter-kit.service.ts` | 62 | CORROMPIDO | Comeca no meio de instrucao; chave duplicada em objeto literal. |
| `starter-kit/dto/starter-kit.dto.ts` | 48 | CORROMPIDO | Gap de ~14 linhas em branco; campo de outra DTO vazado. |
| `support/support.admin.controller.ts` | 54 | CORROMPIDO | Sem imports/decorator; codigo orfao apos fechamento da classe. |
| `support/support.controller.ts` | 10 | CORROMPIDO | Comeca no meio de metodo, sem classe. |
| `support/support.module.ts` | 12 | SANO | Completo e balanceado. |
| `support/support.service.ts` | 171 | CORROMPIDO | Chaves 51/59; gap de ~80 linhas; codigo duplicado apos fechamento da classe. |
| `support/dto/support.dto.ts` | 84 | CORROMPIDO | `IsUUID` importado 2x; decorators Swagger usados mas nunca importados. |
| `tracking/tracking.controller.ts` | 100 | SANO | Completo e balanceado. |
| `tracking/tracking.module.ts` | 12 | SANO | Completo e balanceado. |
| `tracking/dto/tracking.dto.ts` | 21 | SANO | Completo. |
| `users/users.admin.controller.ts` | 50 | SANO | Completo e balanceado. |
| `users/users.module.ts` | 12 | SANO | Completo e balanceado. |
| `users/users.service.ts` | 261 | CORROMPIDO | Maior gap encontrado (~230 linhas em branco); `getUserById` declarado 3x seguidas, arquivo corta no meio. |
| `zones/zones.admin.controller.ts` | 96 | SANO | Completo e balanceado. |
| `zones/zones.controller.ts` | 50 | CORROMPIDO | BOM UTF-8 no inicio; classe `ZonesController` declarada 2x sobrepostas. |
| `zones/zones.module.ts` | 11 | SANO | Completo e balanceado. |
| `zones/zones.service.ts` | 109 | CORROMPIDO | `getZone` declarado 3x; gaps de ~24 e ~6 linhas. |
| `zones/dto/zones.dto.ts` | 191 | CORROMPIDO | Gaps de ~21, ~23 e ~62 linhas em branco dentro de DTOs. |

### Contagem agregada

- **SANO**: 21 arquivos (a maioria `*.module.ts` pequenos, alguns controllers/DTOs completos, e o modulo `tracking` inteiro).
- **CORROMPIDO**: 46 arquivos (maioria — truncamento, duplicacao, classes ausentes ou chaves desbalanceadas).
- **SUSPEITO**: 7 arquivos (`*.module.ts` internamente sadios, mas dependem de arquivos irmaos ausentes).

**Modulo integro**: `tracking` (3/3 arquivos sanos).
**Modulos mais corrompidos**: `orders`, `users`, `marketplace`, `services-catalog`, `zones`.

**Arquivos totalmente ausentes** (quebram a compilacao se importados):
`analytics/analytics.controller.ts`, `dispatch/dispatch.controller.ts`,
`payouts/payouts.controller.ts`, `rental/rental.controller.ts`,
`coupons/coupons.controller.ts`, `orders/dto/create-order.dto.ts`,
`orders/dto/list-orders.dto.ts`.

## 3. Decisao de Recuperacao

Dado o volume de corrupcao (46 de 74 arquivos, ~62%) e a impossibilidade de
rodar `tsc`/`jest` localmente (sem Node instalado) para validar reparos
incrementais, a estrategia adotada foi:

1. **Nao apagar nada.** Os 18 modulos continuam fisicamente em
   `src/modules/*`, apenas isolados via `tsconfig.json` (`exclude`),
   `.eslintrc.js` (`ignorePatterns`) e `jest.config.js`
   (`testPathIgnorePatterns`) — jah configurado na rodada anterior e mantido
   nesta.
2. **Reescrever do zero apenas o que e necessario para o objetivo desta
   rodada**: o modulo `marketplace` (que se sobrepunha ao novo modelo
   Store/LAVADOR/CLIENTE) foi totalmente reescrito contra o novo schema, e um
   novo modulo `store` foi criado. Os outros 17 modulos corrompidos
   **permanecem isolados** — sua reconstrucao esta fora do escopo desta
   tarefa e listada em `docs/FASE9_CORRUPTED_MODULES.md`.
3. **Schema Prisma**: reconstruido do zero como schema unificado e valido,
   cobrindo o dominio completo pedido (User/Order/Store/Product/etc.),
   sem tentar "remendar" o arquivo de 1447 linhas truncado (preservado como
   `schema.prisma.corrupted-backup` para eventual consulta manual futura).

## 4. O que foi feito nesta rodada

Ver `docs/FASE9_CORRUPTED_MODULES.md` para o estado atualizado pos-rodada e
`docs/FASE9_ARCHITECTURE_AWS.md` para a arquitetura de deploy proposta.

- `services/api/prisma/schema.prisma`: reescrito, schema unificado com todos
  os modelos pedidos, `CommissionPlan` com as 4 tarifas (LAVADOR/CLIENTE x
  INTEGRATED/OWN), enums `StoreType`/`LogisticsPlan`/`CatalogTarget`.
- `services/api/prisma/migrations/20250101000000_init/migration.sql`: gerada
  manualmente (SQL escrito a mao, ja que `prisma migrate dev` exige Node) a
  partir do novo schema.
- `services/api/src/modules/marketplace/*`: reescrito do zero, sem
  duplicacoes, contra o novo modelo `Store`/`Product`/`CatalogTarget`.
- `services/api/src/modules/store/*`: novo modulo criado (cadastro de loja,
  cadastro/listagem de produtos por loja).
- `services/api/src/app.module.ts`, `tsconfig.json`, `.eslintrc.js`,
  `jest.config.js`: atualizados para incluir `marketplace` e `store` na
  compilacao/lint/test, mantendo os outros 17 modulos isolados.
- `services/api/.env.example`: criado.
- `services/api/package.json`: dependencias de dominio adicionadas
  (class-validator, class-transformer, @nestjs/config, @nestjs/jwt,
  @nestjs/passport, passport-jwt, bcryptjs, @nestjs/swagger).
- `.github/workflows/ci.yml`: atualizado para refletir os novos modulos
  incluidos e dependencias novas.
- `.github/workflows/deploy.yml`: corrigido (removidos blocos duplicados que
  quebravam o YAML).
- `.github/workflows/gh-pages.yml`: criado para publicar os previews HTML de
  `docs/`/`apps/preview` automaticamente.

## 5. Pendencias / Riscos conhecidos

- **Sem Node/npm/pnpm nesta maquina**: nenhum comando (`prisma generate`,
  `tsc`, `eslint`, `jest`, `nest build`) pode ser executado localmente para
  validar a compilacao real. Toda validacao foi manual (leitura de arquivo +
  contagem de chaves). **Recomenda-se rodar o CI (GitHub Actions) ou
  `pnpm install && pnpm db:generate && pnpm type-check && pnpm test && pnpm build`
  em uma maquina com Node 20 assim que possivel** para confirmar.
- A migration inicial (`20250101000000_init`) foi escrita manualmente sem
  `prisma migrate dev` (que geraria SQL a partir do diff real do banco);
  deve ser revisada/validada em ambiente com Postgres real antes de aplicar
  em producao.
- Os 17 modulos ainda isolados (`analytics`, `compliance`, `coupons`,
  `dispatch`, `document-verification`, `drivers`, `face-check`, `loyalty`,
  `orders`, `payouts`, `rental`, `services-catalog`, `starter-kit`,
  `support`, `tracking`, `users`, `zones`) **nao foram reconstruidos** —
  continuam fora do build. Ver `docs/FASE9_CORRUPTED_MODULES.md`.
- `docs/MARKETPLACE_DUAL.md` documenta o modelo antigo (Supplier/Product/
  StorePlan) e ficou desatualizado; mantido apenas como referencia
  historica, não removido por instrução de não deletar conteúdo.
