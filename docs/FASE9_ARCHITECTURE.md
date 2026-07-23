# Fase 9: DevOps e Integração Contínua

## Objetivo

Estabelecer a primeira camada de automação de qualidade (CI) para o monorepo
**Lavagem a Domicílio**, cobrindo os três blocos de código do projeto:

- **Backend API** (`services/api` - NestJS + Prisma)
- **Admin Web** (`apps/admin-web` - Next.js)
- **Apps móveis** (`apps/mobile-client`, `apps/mobile-driver` - Flutter)

Este documento descreve o pipeline criado em `.github/workflows/ci.yml`, o
racional das decisões tomadas e os gaps conhecidos que devem ser endereçados
em fases futuras.

## Estado do repositório (referência)

O projeto é um monorepo `pnpm` + `Turbo` sem `packages/*` reais (diretório
vazio) e sem `.git` remoto no momento da criação deste pipeline. Principais
constatações usadas para desenhar o CI:

| Área | Observação | Impacto no CI |
|---|---|---|
| `services/api` | NestJS 10, Prisma 5, ~148 arquivos `.ts`, 11 arquivos `*.spec.ts` (Jest) | Job dedicado com lint, typecheck, testes e build |
| `apps/admin-web` | Next.js 14, ~64 arquivos `.ts/.tsx`, scripts `lint`/`type-check`/`build` | Job dedicado com lint, typecheck e build |
| `apps/mobile-client` | Flutter, 65 arquivos `.dart`, sem pasta `test/` | Job `flutter analyze` (não bloqueante) |
| `apps/mobile-driver` | Flutter, 47 arquivos `.dart`, sem pasta `test/` | Job `flutter analyze` (não bloqueante) |
| `apps/preview` | Diretório vazio | Fora do pipeline |
| `packages/*` | Referenciado no `pnpm-workspace.yaml`, mas inexistente | Nenhum job dedicado |
| ESLint config | Nenhum `.eslintrc*`/`eslint.config.*` encontrado em `services/api` ou `apps/admin-web`, apesar dos scripts `lint` existirem | Lint marcado `continue-on-error` até a config ser adicionada |
| Flutter | Sem `analysis_options.yaml` e sem `test/` em nenhum dos dois apps | `flutter analyze` roda com defaults e é não bloqueante |
| Banco de dados | Prisma usa `DATABASE_URL` via `env()`; sem migrations aplicadas (`prisma/migrations` inexistente) | CI apenas roda `prisma generate` (não conecta a um banco real) |

## Pipeline (`.github/workflows/ci.yml`)

### Gatilhos

- `push` para `main` e `develop`
- `pull_request` para `main` e `develop`
- `concurrency` com `cancel-in-progress` por branch/ref, para evitar runs
  redundantes em pushes sucessivos.

### Job `api` (services/api)

Etapas: checkout → setup `pnpm`/Node 18 → `pnpm install` na raiz (necessário
por ser workspace) → `prisma generate` → lint → `tsc --noEmit` → `jest --ci
--coverage` → `nest build`.

Decisões:
- **`prisma generate` antes de qualquer typecheck/test**: o Prisma Client é
  gerado localmente e importado em quase todos os módulos; sem isso o
  `tsc`/Jest falham por tipos ausentes.
- **Sem banco de dados no CI**: como não há migrations versionadas
  (`prisma/migrations` não existe) e os testes unitários usam mocks do
  `PrismaService` (confirmado em `pricing.service.spec.ts` e demais
  `*.spec.ts`), não é necessário provisionar Postgres/Redis para os testes
  atuais. Isso deverá ser revisto quando testes de integração forem
  adicionados.
- **Lint não bloqueante**: não existe arquivo de configuração ESLint
  commitado em `services/api`, então `pnpm lint` falharia/travaria em CI.
  Marcado como `continue-on-error` até a Fase 9 (ou próxima) adicionar o
  `.eslintrc.json`.

### Job `admin-web` (apps/admin-web)

Etapas: checkout → setup `pnpm`/Node 18 → `pnpm install` na raiz → lint →
`pnpm type-check` → `pnpm build`.

Decisões:
- **`API_URL` fake em build**: `next.config.js` já tem fallback para
  `http://localhost:3000/api/v1`, mas o valor é passado explicitamente no
  step de build para deixar a intenção clara e evitar builds
  ambiente-dependentes.
- **Lint não bloqueante**: mesma razão do job `api` — `next lint` sem
  `.eslintrc.json` local pede configuração interativa, o que quebra em CI
  não interativo.

### Job `mobile` (matrix: mobile-client / mobile-driver)

Etapas: checkout → setup Flutter estável → `flutter pub get` → `flutter
analyze` (não bloqueante).

Decisões:
- **Sem `flutter test`**: nenhum dos dois apps possui diretório `test/`
  (confirmado via busca no filesystem), portanto o step de testes foi
  omitido para não falhar por ausência de suíte.
- **`flutter analyze` não bloqueante**: sem `analysis_options.yaml`
  customizado, o analyzer usa apenas as regras padrão do `flutter_lints`
  declarado no `pubspec.yaml`; mantido como sinal informativo até o time
  confirmar o nível de rigor desejado.
- **Matrix strategy**: os dois apps têm `pubspec.yaml` quase idênticos
  (mesma versão de SDK e dependências), então uma única definição de job
  parametrizada evita duplicação.

## Gaps conhecidos / Próximos passos (Fase 9.x)

1. **Adicionar `.eslintrc.json`** em `services/api` e `apps/admin-web` para
   tornar o lint bloqueante (hoje é apenas informativo).
2. **Adicionar `analysis_options.yaml`** e uma pasta `test/` mínima em
   `apps/mobile-client` e `apps/mobile-driver`.
3. **Banco de dados de teste no CI**: quando surgirem testes de integração
   reais (ex.: `orders`, `dispatch`, `payments` com Prisma real), adicionar
   um serviço `postgis/postgis` + `redis` ao job `api`, seguindo o mesmo
   padrão do `infra/docker/docker-compose.dev.yml`.
4. **Criar `packages/*` compartilhados** (`shared-types`, `shared-utils`)
   apontados no `pnpm-workspace.yaml` mas inexistentes; isso deve virar um
   job próprio de build assim que existirem.
5. **Dockerfiles de produção**: não existem hoje (`infra/docker` só tem
   `docker-compose.dev.yml`); uma fase futura deve adicionar
   build-and-push de imagens ao pipeline.
6. **Cache de dependências Flutter/pub** e **cache de build do Next.js**
   podem ser adicionados para reduzir tempo de execução, uma vez que o
   pipeline básico esteja estável.

## Referências

- Pipeline: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- Revisão de arquitetura anterior: [`ARQUITETURA_REVISAO.md`](../ARQUITETURA_REVISAO.md)
- Setup local: [`docs/SETUP.md`](SETUP.md)

