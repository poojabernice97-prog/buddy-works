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

Documentation: [README](../README.md)
