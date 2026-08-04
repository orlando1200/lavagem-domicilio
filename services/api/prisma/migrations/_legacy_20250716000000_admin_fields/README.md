# Admin fields migration

Adds columns required by the admin-web integration:

- `service_categories.icon`
- `service_categories.sort_order`
- `service_categories.slug` (unique)
- `coverage_zones.neighborhoods` (text array)

These are additive, nullable/default changes and should be safe to apply to existing data. Existing category rows get their `slug` backfilled from `name`.

Apply with:

```bash
cd services/api
pnpm exec prisma migrate deploy
```

Or let the production Docker entrypoint run it automatically.

