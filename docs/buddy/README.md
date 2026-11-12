# Buddy

**Buddy** is an open-source AI program-management coworker: a senior-PM thought partner
that remembers your portfolio, challenges vague plans, and (in later phases) acts across
calendar, Slack, email, and tickets with OpenBot’s approval gate.

This repository (**buddy-works**) layers Buddy on [OpenBot](https://github.com/CopilotKit/openbot)
v1.0.2 (MIT). OpenBot provides the workspace runtime: auth, approvals, audit, routines, and
tooling. Buddy adds a tenant package and Supabase-backed portfolio memory without forking those
core services.

See [NOTICE](../../NOTICE) for licensing and the **CopilotKit Intelligence** disclosure:
Intelligence is a separate commercial product and is **not** included or sublicensed here.

## Architecture (Phase 0)

```text
┌─────────────────────────────────────────────────────────────┐
│  OpenBot app + server (upstream, unchanged in Phase 0)     │
│  - approvals, audit, auth, routines, handoff desk          │
└───────────────────────────┬─────────────────────────────────┘
                            │ TENANT_PACKAGE_DIR=buddy/tenant
┌───────────────────────────▼─────────────────────────────────┐
│  Buddy tenant package                                       │
│  - buddy (router coworker)                                  │
│  - hermes, athena, hercules (built-in stubs)                │
└───────────────────────────┬─────────────────────────────────┘
                            │ Phase 1+ wiring
┌───────────────────────────▼─────────────────────────────────┐
│  Supabase (buddy schema)                                    │
│  projects · raid_items · decisions · event webhook (stub)   │
└─────────────────────────────────────────────────────────────┘
```

Routing uses OpenBot’s **handoff** mechanism (documented in
[docs/architecture.md](../architecture.md)): the PM talks to **Buddy**; Buddy delegates to
specialists using the same approval and audit paths as any other coworker.

## Local setup

Prerequisites: [Bun](https://bun.sh) 1.4.x (see root `packageManager`), Docker (for OpenBot
Postgres), and optionally [Supabase CLI](https://supabase.com/docs/guides/cli) for migrations.

1. Clone and install:

   ```bash
   git clone https://github.com/poojabernice97-prog/buddy-works.git
   cd buddy-works
   cp .env.example .env
   ```

2. Point OpenBot at the Buddy tenant package in `.env`:

   ```dotenv
   TENANT_PACKAGE_DIR=../buddy/tenant
   ```

3. Add model credentials (same as upstream OpenBot). For a quick local smoke test, keep
   `OPENBOT_SINGLE_USER=true` from `.env.example`.

4. Start OpenBot (see [docs/development.md](../development.md)):

   ```bash
   bash scripts/start.sh
   ```

5. Run Buddy tests:

   ```bash
   bun test buddy/tests
   ```

### Supabase (portfolio memory)

Hosted project ref (non-secret): `zkpvtzefdtovhyoybbdq` (us-west-2).

Local migrations:

```bash
supabase start          # optional; requires Docker
supabase db reset       # applies supabase/migrations
```

Set in `.env` when connecting (no real values in git):

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only
```

The edge function `buddy-event-webhook` is a Phase 0 stub (`501`).

## Cloud deployment notes

- **OpenBot**: deploy the root application the same way as upstream (Docker Compose or
  Kubernetes chart under `charts/openbot`). Override `TENANT_PACKAGE_DIR` to the Buddy tenant
  path in the image or mount `buddy/tenant` as a volume.
- **Supabase**: link the CLI to project `zkpvtzefdtovhyoybbdq` and push migrations when ready.
  Do not commit keys; use project secrets or your host’s secret store.
- **Intelligence**: optional CopilotKit Intelligence is **not** required for self-hosted Buddy.
  If you enable it, that relationship is under CopilotKit’s terms, not this repo’s MIT license.

## Upstream upgrades

See [UPSTREAM.md](../../UPSTREAM.md).
