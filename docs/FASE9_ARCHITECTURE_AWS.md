# Fase 9 - Arquitetura de Producao AWS (Lavagem a Domicilio / GIUCAR)

> **Desatualizado (2026-08-15)**: este documento descreve um plano de
> arquitetura AWS que nunca chegou a ser implementado. A infraestrutura
> de produção real está no Fly.io — ver `docs/DEPLOY.md` (apps
> `giucar-api`, `giucar-admin`, `giucar-db`, deployadas e verificadas
> ao vivo). Mantido aqui só como referência histórica de decisões de
> arquitetura consideradas na época.

## Visao geral

Arquitetura serverless-containers, otimizada para custo previsivel e baixa
carga operacional, usando ECS Fargate (sem gestao de EC2/nodes), RDS
gerenciado com PostGIS (geolocalizacao de motoristas/zonas) e ElastiCache
Redis (filas BullMQ, cache, sessions/rate-limit).

```
                                   ┌───────────────────────────┐
                                   │        Route 53           │
                                   │   (DNS: api / admin)      │
                                   └─────────────┬─────────────┘
                                                 │
                        ┌────────────────────────┼────────────────────────┐
                        │                         │                        │
                        ▼                         ▼                        ▼
                ┌───────────────┐        ┌────────────────┐      ┌──────────────────┐
                │   CloudFront   │        │  CloudFront    │      │   ACM (TLS certs) │
                │ (Admin Web /   │        │ (S3 - assets   │      └──────────────────┘
                │  static export)│        │  publicos)     │
                └───────┬────────┘        └───────┬────────┘
                        │                          │
                        ▼                          ▼
              ┌───────────────────┐      ┌───────────────────┐
              │  ALB (HTTPS 443)  │      │   S3 Bucket        │
              │  giucar-alb        │      │  (uploads, fotos,  │
              └─────────┬─────────┘      │  comprovantes)     │
                        │                └───────────────────┘
        ┌───────────────┼────────────────────┐
        ▼                                    ▼
┌───────────────────┐               ┌────────────────────┐
│  Target Group API │               │ Target Group Admin  │
│  (path /api/*)    │               │ (path /*)           │
└─────────┬─────────┘               └──────────┬──────────┘
          │                                    │
          ▼                                    ▼
┌────────────────────────┐         ┌────────────────────────┐
│   ECS Fargate Service   │         │   ECS Fargate Service   │
│   giucar-api (NestJS)   │         │   giucar-admin-web       │
│   task: 2 vCPU / 4GB    │         │   task: 0.5 vCPU / 1GB   │
│   desired: 2 (auto 2-6) │         │   desired: 1 (auto 1-3)  │
└────────────┬────────────┘         └─────────────────────────┘
             │
             │ (mesma imagem, comando diferente)
             ▼
┌─────────────────────────┐
│  ECS Fargate Service     │
│  giucar-workers (BullMQ) │
│  task: 1 vCPU / 2GB      │
│  desired: 1 (auto 1-4)   │
└────────────┬─────────────┘
             │
        ┌────┴─────────────────────┐
        ▼                          ▼
┌───────────────────┐    ┌───────────────────────┐
│  RDS PostgreSQL 15  │    │  ElastiCache Redis 7    │
│  + extensao PostGIS │    │  (filas BullMQ, cache,  │
│  Multi-AZ (prod)    │    │  rate-limit, sessions)  │
│  db.t4g.medium       │    │  cache.t4g.small        │
└───────────────────┘    └───────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16)                     │
│  ┌───────────────────┐   ┌───────────────────┐               │
│  │  Subnets Publicas   │   │  Subnets Privadas   │             │
│  │  (ALB, NAT GW)      │   │  (ECS, RDS, Redis)  │             │
│  └───────────────────┘   └───────────────────┘               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline (GitHub)                    │
│                                                                  │
│  GitHub Actions (ci.yml)                                        │
│   ├─ lint / typecheck / test / build (API, Admin, Mobile)       │
│   ├─ docker build (validacao)                                   │
│   └─ push-to-ecr (main branch) ──────► Amazon ECR                │
│                                          ├─ giucar-api            │
│                                          └─ giucar-admin-web      │
│                                                                  │
│  (proximo passo, fora do escopo desta fase):                     │
│  Deploy automatico ECR -> ECS via `aws ecs update-service`        │
│  ou `amazon-ecs-deploy-task-definition` action.                  │
└──────────────────────────────────────────────────────────────┘

              CloudWatch (Logs + Metrics + Alarms)
              ├─ /ecs/giucar-api        (application logs)
              ├─ /ecs/giucar-admin-web
              ├─ /ecs/giucar-workers
              ├─ Alarms: CPU > 80%, 5xx rate, RDS connections, Redis memory
              └─ Dashboards: latencia p95/p99, throughput, filas BullMQ
```

## Componentes

### Compute
- **ECS Fargate** (sem EC2 a gerenciar):
  - `giucar-api`: container NestJS (imagem `services/api/Dockerfile`),
    exposto via ALB em `/api/*`. Auto scaling por CPU/memoria (2-6 tasks).
  - `giucar-admin-web`: container Next.js standalone (imagem
    `apps/admin-web/Dockerfile`), exposto via ALB em `/*` (ou via
    CloudFront + S3 se optar por export estatico no futuro).
  - `giucar-workers`: mesma imagem da API, comando alternativo
    (`node dist/worker.js` ou equivalente) rodando consumers BullMQ
    (notificacoes, matching de motoristas, geracao de relatorios).

### Dados
- **RDS PostgreSQL 15 + PostGIS**: banco principal, com a extensao
  PostGIS habilitada para consultas geoespaciais (zonas de atendimento,
  distancia motorista-cliente). Multi-AZ em producao, backups automaticos
  (7-14 dias de retencao), subnet privada.
- **ElastiCache Redis 7**: filas BullMQ (dispatch, notificacoes push),
  cache de sessao/rate-limiting, cache de queries frequentes.
- **S3**: armazenamento de uploads (fotos de comprovante, documentos de
  motoristas para compliance/face-check), com lifecycle policy e
  criptografia SSE-S3.

### Entrega de conteudo / rede
- **ALB (Application Load Balancer)**: roteamento por path (`/api/*` para
  API, `/*` para Admin Web), TLS via ACM, health checks em `/health`
  (endpoint ja implementado em `services/api/src/modules/health`).
- **CloudFront**: CDN na frente do ALB (cache de assets estaticos do
  Admin Web) e/ou na frente de um bucket S3 dedicado a assets publicos
  (logos, imagens de marketing usadas em `apps/preview`).
- **Route 53**: DNS gerenciado (`api.giucar.com`, `admin.giucar.com`).
- **VPC**: subnets publicas (ALB, NAT Gateway) e privadas (ECS tasks, RDS,
  ElastiCache) em pelo menos 2 AZs.

### Registro de imagens e CI/CD
- **Amazon ECR**: dois repositorios (`giucar-api`, `giucar-admin-web`).
  Job `push-to-ecr` do `ci.yml` builda e publica a cada push em `main`
  (apos lint/test/build passarem nos jobs anteriores).
- **GitHub Actions**: pipeline completo lint -> typecheck -> test -> build
  -> validacao de Dockerfile -> push para ECR. Deploy real em ECS
  (`aws ecs update-service --force-new-deployment` ou action dedicada de
  deploy) e o proximo passo natural, ja esboçado (comentado) no historico
  do projeto e pode ser reativado assim que os secrets de AWS existirem no
  repositorio.

### Observabilidade
- **CloudWatch Logs**: log groups por servico ECS (`/ecs/giucar-api`,
  `/ecs/giucar-admin-web`, `/ecs/giucar-workers`), retention de 30 dias.
- **CloudWatch Alarms**: CPU/memoria dos servicos ECS, taxa de erro 5xx do
  ALB, conexoes do RDS, uso de memoria do Redis.
- **CloudWatch Dashboards**: latencia (p50/p95/p99), throughput por
  endpoint, tamanho das filas BullMQ.

## Seguranca

- Security Groups restritivos: ALB aceita 443 do mundo; ECS tasks aceitam
  trafego apenas do ALB security group; RDS/Redis aceitam apenas das ECS
  tasks (nenhum IP publico).
- Secrets (DATABASE_URL, REDIS_URL, JWT secrets, chaves de terceiros)
  geridos via **AWS Secrets Manager**, injetados como variaveis de
  ambiente nas task definitions do ECS (nunca em variaveis de CI em texto
  puro, exceto as credenciais de acesso a AWS/ECR).
- IAM roles dedicadas por servico (task role de `giucar-api` != task role
  de `giucar-workers`), seguindo principio de menor privilegio (ex.:
  apenas `giucar-workers` tem permissao de leitura/escrita no S3 de
  documentos, apenas a API tem permissao de enviar para a fila BullMQ).
- WAF (opcional, recomendado para producao) na frente do ALB/CloudFront
  para mitigar bots e ataques comuns (SQLi, XSS, rate-based rules).

## Estimativa de custo mensal (regiao us-east-1, uso moderado)

| Recurso | Configuracao | Custo aproximado/mes (USD) |
|---|---|---|
| ECS Fargate - API | 2 vCPU/4GB, 2 tasks, 24/7 | ~ $120 |
| ECS Fargate - Admin Web | 0.5 vCPU/1GB, 1 task, 24/7 | ~ $18 |
| ECS Fargate - Workers | 1 vCPU/2GB, 1 task, 24/7 | ~ $30 |
| RDS PostgreSQL (db.t4g.medium, Multi-AZ) | 2 vCPU/4GB, storage 50GB gp3 | ~ $140 |
| ElastiCache Redis (cache.t4g.small) | 1 no, single-AZ | ~ $25 |
| ALB | 1 ALB + LCU | ~ $25 |
| NAT Gateway | 1 NAT GW + trafego | ~ $35 |
| S3 | 50GB + requests | ~ $5 |
| CloudFront | trafego moderado (~100GB) | ~ $10 |
| ECR | armazenamento de imagens | ~ $2 |
| CloudWatch (logs + alarms) | retencao 30 dias | ~ $10 |
| Route 53 | hosted zone + queries | ~ $1 |
| **Total estimado** | | **~ $420/mes** |

> Estimativa simplificada, sem desconto de Savings Plans/Reserved
> Instances e sem considerar picos de trafego. Ambientes de staging podem
> reduzir custo usando Fargate Spot para workers e RDS single-AZ
> (db.t4g.micro), chegando a ~$150-180/mes.

## Passos de deploy (visao de alto nivel)

1. **Infraestrutura base** (uma vez, via Terraform/CDK ou console):
   - Criar VPC com subnets publicas/privadas em 2 AZs, Internet Gateway e
     NAT Gateway.
   - Criar cluster ECS Fargate (`giucar-cluster`).
   - Criar RDS PostgreSQL 15 com extensao PostGIS habilitada
     (`CREATE EXTENSION postgis;`) em subnet privada.
   - Criar ElastiCache Redis em subnet privada.
   - Criar bucket S3 para uploads + bucket para assets do CloudFront.
   - Criar ALB publico + target groups (`api`, `admin-web`) + listener
     HTTPS com certificado ACM.
   - Criar Route 53 hosted zone e records apontando para o ALB/CloudFront.
   - Criar repositorios ECR (`giucar-api`, `giucar-admin-web`).
   - Criar secrets no Secrets Manager (`DATABASE_URL`, `REDIS_URL`,
     `JWT_SECRET`, etc.).

2. **Primeira publicacao de imagens**:
   - Configurar secrets no GitHub (`AWS_ACCESS_KEY_ID`,
     `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECR_REPOSITORY_API`,
     `ECR_REPOSITORY_ADMIN_WEB`).
   - Push para `main` dispara `ci.yml` -> job `push-to-ecr` publica as
     imagens `:latest` e `:<sha>` no ECR.

3. **Criacao das ECS Task Definitions e Services**:
   - Task definition `giucar-api-task` (imagem do ECR, env vars via
     Secrets Manager, porta 3000, health check `/health`).
   - Task definition `giucar-admin-web-task` (imagem do ECR, porta 3000).
   - Task definition `giucar-workers-task` (mesma imagem da API, comando
     de worker).
   - Criar ECS Services associando cada task definition ao cluster, target
     group correspondente (API/Admin) e configurando auto scaling
     (target tracking por CPU 60-70%).

4. **Migrations de banco**:
   - Rodar `pnpm prisma migrate deploy` (ECS task one-off ou pipeline
     dedicado) apos o RDS estar disponivel e antes do primeiro deploy do
     servico `giucar-api`.

5. **Deploy continuo** (proximo incremento no `ci.yml`, hoje comentado):
   - Apos `push-to-ecr`, adicionar um job `deploy-ecs` usando
     `aws-actions/amazon-ecs-render-task-definition` +
     `aws-actions/amazon-ecs-deploy-task-definition` para atualizar os
     services `giucar-api-service` e `giucar-admin-web-service` com a
     nova imagem, aguardando estabilidade (`wait-for-service-stability`).

6. **Validacao pos-deploy**:
   - Checar `/health` via ALB.
   - Checar logs no CloudWatch (`/ecs/giucar-api`).
   - Checar alarmes (nenhum em estado `ALARM`).
