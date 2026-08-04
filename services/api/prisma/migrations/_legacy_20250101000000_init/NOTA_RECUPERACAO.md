# Migracoes legadas (nao aplicadas)

As pastas `_legacy_20250101000000_init` e `_legacy_20250716000000_admin_fields`
pertencem ao schema antigo (pre-recuperacao), que referenciava tabelas como
`service_categories` e `coverage_zones` que nao existem no schema unificado
atual (`services/api/prisma/schema.prisma`).

Elas foram renomeadas (prefixo `_legacy_`) para deixarem de corresponder ao
padrao `<timestamp>_<nome>` que o Prisma usa para descobrir migrations, e
portanto **nao sao mais aplicadas** por `prisma migrate deploy`/`dev`.
Foram preservadas (nao deletadas) apenas para referencia historica.

A migration ativa e unica a partir desta rodada de recuperacao e:

- `20260723000000_init_unified_schema/migration.sql`

Ela cria do zero todas as 27 tabelas e 19 enums do schema atual. Como o
banco de dados real nunca chegou a ser migrado com o schema antigo em
producao (a migration `20250101000000_init` original so continha um
`README.md`, sem `migration.sql`), nao ha risco de quebrar dados existentes
ao adotar a nova migration como baseline.
