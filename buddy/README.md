# Buddy extension layer

OpenBot **tenant package**: [`tenant/`](tenant/)

- **buddy** — router coworker (surface persona)
- **hermes**, **athena**, **hercules** — specialist stubs registered as built-in agents

Configure:

```dotenv
TENANT_PACKAGE_DIR=../buddy/tenant
```

Phase **1a** adds:

- [`lib/pushback/`](lib/pushback/) — unit-tested pushback trigger detector
- [`lib/brief/`](lib/brief/) — trade-off brief validation
- [`server/memory-client.ts`](server/memory-client.ts) — server-side Supabase helpers (`bun install` in this folder)
- [`tenant/skills.yaml`](tenant/skills.yaml) — `pushback-engine` and `trade-off-brief` skills

Phase **1b** adds:

- [`server/memory-tools.ts`](server/memory-tools.ts) + OpenBot builtin app `buddy-memory` (minimal `server/` hooks)
- Deterministic pushback pre-flight on Buddy coworker turns
- Hermes morning check-in routine template (`MORNING_ROUTINE_TITLE`, weekday 9:00 cron)
- `buddy-uploads` Storage bucket + [`server/upload.ts`](server/upload.ts) helper

## Supabase API schema

The memory client uses **`@supabase/supabase-js` with `db.schema: "buddy"`** (not a direct Postgres connection). Add `buddy` to **Project → API → Exposed schemas** in the Supabase dashboard, or the REST client cannot reach portfolio tables. This repo's [`supabase/config.toml`](../supabase/config.toml) already lists `buddy` for local CLI.

## Morning routine (owner setup)

Create a routine via chat or the Routines page:

| Field | Value |
| --- | --- |
| Bot | Hermes |
| Title | `Morning portfolio check-in` (exact title triggers runtime enrichment) |
| Cron | `0 9 * * 1-5` (weekdays 9:00) |
| Timezone | Your IANA zone (e.g. `America/Los_Angeles`) |
| Instruction | `Run Buddy morning check-in…` (stub — server fills memory snapshot each firing) |

See [`lib/routine/morning-routine-template.ts`](lib/routine/morning-routine-template.ts).

Documentation: [README](../README.md)
