# Migracoes legadas (nao aplicadas)

As pastas `_legacy_20250101000000_init` e `_legacy_20250716000000_admin_fields`
pertencem ao schema antigo (pre-recuperacao), que referenciava tabelas como
`service_categories` e `coverage_zones` que nao existem no schema unificado
atual (`services/api/prisma/schema.prisma`).

**Correcao (2026-08-10):** a afirmacao original abaixo — de que renomear com
prefixo `_legacy_` bastava pro Prisma ignorar essas pastas — estava **errada**.
So foi possivel descobrir isso na primeira vez que `prisma migrate deploy`
rodou contra um Postgres de verdade nesta maquina (nenhuma migration desta
recuperacao tinha sido aplicada de fato ate entao): o `migrate deploy` escaneia
QUALQUER subdiretorio dentro de `prisma/migrations/` como candidato a
migration, independente do nome bater com o padrao `<timestamp>_<nome>` — a
renomeacao com `_legacy_` nao tem efeito nenhum sobre isso. `_legacy_20250101000000_init`
nem tem `migration.sql` (so os `.md` de documentacao), o que fazia
`migrate deploy` falhar com `P3015` ao tentar processa-la.

Corrigido movendo as duas pastas pra fora de `prisma/migrations/`
inteiramente (`prisma/_legacy-migrations-reference/`, fora do diretorio que o
Prisma escaneia) — preservadas pra referencia historica, como o texto
original ja pretendia, so que agora de fato fora do alcance do Prisma.

~~Elas foram renomeadas (prefixo `_legacy_`) para deixarem de corresponder ao
padrao `<timestamp>_<nome>` que o Prisma usa para descobrir migrations, e
portanto **nao sao mais aplicadas** por `prisma migrate deploy`/`dev`.~~
(❌ nao procede — ver correcao acima)

A migration ativa e unica a partir desta rodada de recuperacao e:

- `20260723000000_init_unified_schema/migration.sql`

Ela cria do zero todas as 27 tabelas e 19 enums do schema atual. Como o
banco de dados real nunca chegou a ser migrado com o schema antigo em
producao (a migration `20250101000000_init` original so continha um
`README.md`, sem `migration.sql`), nao ha risco de quebrar dados existentes
ao adotar a nova migration como baseline.
