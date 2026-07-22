# Bubblecast on shared Supabase

This app is a **tenant** on a multi-app free Supabase project.

## Isolation contract

| Owns | Does not touch |
|------|----------------|
| Schema `bubblecast.*` | Other apps’ schemas/tables/functions |
| Views `public.bubblecast_*` | Shared Auth internals (except reading `auth.uid()`) |
| Table `bubblecast.schema_migrations` | Project-wide extensions/roles |

Migrations in this folder are the source of truth for Bubblecast. Apply only these SQL files (or via Supabase MCP with the same content). Never run migrations that alter unrelated objects.

## Dashboard one-time setup

1. **Authentication → Providers → Anonymous** — enable Anonymous sign-ins (lazy device identity, no password).
2. **Authentication → Providers → Email** — enable magic link (optional multi-device accounts).
3. **Authentication → URL configuration** — site URL + redirect allow-list for production and localhost.
4. Optional: add schema `bubblecast` under **Settings → API → Exposed schemas** if you later query the schema directly (views already work via `public`).

## Env vars (Vercel + `.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable key>
```

No service role key is required for the MVP client path.

## Migration log

Applied migrations are also recorded in `bubblecast.schema_migrations` so Bubblecast does not depend on another app’s migration tool.
