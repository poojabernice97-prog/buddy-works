# Buddy

**Buddy** is an open-source AI program-management coworker for the PM who runs several projects alone and needs a senior peer—not another chatbot with a folder.

Buddy **remembers** your portfolio, **challenges** vague plans before anything becomes a ticket, and (in later phases) **acts** across calendar, Slack, email, and tickets—with every outward change going through approval and audit. You talk to one partner on the surface; Buddy routes work to specialist coworkers behind the scenes.

License: MIT (this repo). See [NOTICE](NOTICE) for OpenBot attribution and the **CopilotKit Intelligence** disclosure below.

## What Buddy does for a program manager

| Differentiator | Today (Phase 0) | Planned |
| --- | --- | --- |
| **Acts** on your behalf (schedule, nudge, gather context) | Stubs + OpenBot approval model only | Hermes + integrations (Phase 2+) |
| **Remembers** across projects (RAID, decisions, collisions) | Supabase schema + stubs; not wired to chat | Portfolio graph in Supabase (Phase 1+) |
| **Pushes back** before create (dates, owners, trade-offs) | Buddy router prompt + handoff to specialists | Full pushback engine + trade-off briefs (Phase 1+) |

### Coworkers (one surface, three specialists)

You only configure **Buddy**. OpenBot’s handoff desk routes internally to built-in coworkers:

| Coworker | Role | Typical work | Phase 0 |
| --- | --- | --- | --- |
| **Buddy** | Router & thought partner | Challenge before create; trade-off briefs; delegate | **Live** (tenant prompts) |
| **Hermes** | Proactive operator | Morning check-in, nudges, ticket hygiene, stakeholder drafts | **Stub** (no live connectors) |
| **Athena** | Contingency strategist | What-if, Plan A/B/C + tripwires, capacity heat map | **Stub** (reasoning only) |
| **Hercules** | Unblocker | Classify blockers, paths with costs, escalations | **Stub** (advise/draft only) |

Tenant definitions: [`buddy/tenant/agents.yaml`](buddy/tenant/agents.yaml).

### Phased roadmap (from product proposal)

| Phase | Focus | Status |
| --- | --- | --- |
| **0 — Foundation** | OpenBot base, Buddy tenant, Supabase schema, docs, CI | **This repo today** |
| **1 — Thinking partner** | Pushback instructions, project memory, morning check-in (paste/upload) | Planned |
| **2 — Read-only reach** | Calendar & Slack read, collision radar on portfolio data | Planned |
| **3 — Act with approvals** | Draft → approve → act; audit & undo | Planned |
| **4 — Full program chief of staff** | Meeting autopilot, tripwire plans, cross-project collision radar | Planned |

PMBOK 8–inspired checks (schedule, scope, risk, stakeholders, etc.) are encoded as **original rules** in Buddy prompts and later logic—not PMI copyrighted text. Verify PMI licensing before commercial use.

## Architecture at a glance

```text
┌──────────────────────────────────────────────────────────────┐
│  OpenBot workspace (v1.0.2) — auth, approvals, audit,       │
│  routines, tool connectors, handoff desk                      │
└────────────────────────────┬─────────────────────────────────┘
                             │ TENANT_PACKAGE_DIR=buddy/tenant
┌────────────────────────────▼─────────────────────────────────┐
│  Buddy tenant package                                         │
│  buddy · hermes · athena · hercules (built-in coworkers)      │
└────────────────────────────┬─────────────────────────────────┘
                             │ Phase 1+ (service role, server-side)
┌────────────────────────────▼─────────────────────────────────┐
│  Supabase — schema `buddy`                                    │
│  projects · raid_items · decisions · event webhook (stub)     │
└──────────────────────────────────────────────────────────────┘
```

Buddy does **not** fork OpenBot’s server, auth, approvals, audit, or routines. Extensions live in `buddy/` and `supabase/`. Deeper OpenBot architecture: [docs/architecture.md](docs/architecture.md).

## Quick start

**Prerequisites:** [Bun](https://bun.sh) 1.4.x (`packageManager` in `package.json`), Docker (OpenBot Postgres), optional [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
git clone https://github.com/poojabernice97-prog/buddy-works.git
cd buddy-works
cp .env.example .env
```

In `.env`:

```dotenv
TENANT_PACKAGE_DIR=../buddy/tenant
# Model credentials (e.g. openai-api-key) — see .env.example
# OPENBOT_SINGLE_USER=true   # convenient for local smoke tests
```

```bash
bun install --frozen-lockfile
bash scripts/start.sh          # full stack — see docs/development.md
bun test buddy/tests           # Buddy tenant package tests
```

Open the app (default [http://localhost:3010](http://localhost:3010)), start a **Buddy** channel, and chat with the router coworker.

## Supabase setup

**Hosted project ref (non-secret):** `zkpvtzefdtovhyoybbdq` (us-west-2).

| Piece | Purpose |
| --- | --- |
| `supabase/migrations/` | `buddy` schema: `projects`, `raid_items`, `decisions`; RLS owner-scoped |
| `supabase/functions/buddy-event-webhook/` | External event webhook (**stub**, returns 501) |

**Local:**

```bash
supabase start          # Docker
supabase db reset       # apply migrations
```

**Link to hosted project (owner):**

```bash
supabase link --project-ref zkpvtzefdtovhyoybbdq
supabase db push        # when ready — uses your login, not repo secrets
```

Add to `.env` (never commit real values):

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only
```

## Built on OpenBot

Buddy-works imports **[OpenBot](https://github.com/CopilotKit/openbot) v1.0.2** (MIT) as its runtime: modular, self-hostable AI coworkers with enterprise-grade approvals and audit.

- **Upstream upgrades:** [UPSTREAM.md](UPSTREAM.md) (`git remote` name: `upstream`)
- **Original OpenBot README (downloads, K8s, full feature list):** [docs/openbot/README.md](docs/openbot/README.md)
- **Licensing:** OpenBot’s [LICENSE](LICENSE) and copyright remain intact; [NOTICE](NOTICE) explains derivation.

**CopilotKit Intelligence** is a separate commercial product. It is **not** included in this repository and **not** sublicensed here. Self-hosted Buddy does not require Intelligence; if you connect it, that is under CopilotKit’s terms for that product.

## Contributing & security

[CONTRIBUTING.md](CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) · [SECURITY.md](SECURITY.md)
