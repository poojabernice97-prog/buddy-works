# Deploy Buddy (TEST) on Fly.io

Lean **TEST** deployment: one always-on Fly Machine running the all-in-one OpenBot image (web + API + Chromium on port **3001**) with embedded PostgreSQL, Buddy tenant package, and a routines sweep every five minutes. This guide is **config and runbook only** — it does not create Fly resources for you.

**Cost notes:** The repo’s [`fly.toml`](../../fly.toml) uses **one shared vCPU with 2 GB RAM**, `auto_stop_machines = false` (routines need the app up), and a **1 GB** Postgres volume — adjust only if you accept higher spend. Prefer region **`sea`**; if Fly rejects it for your org, use **`iad`** (edit `primary_region` in `fly.toml`).

## What the image expects

| Piece | Setting |
| --- | --- |
| Memory | At least **2 GB** ([`docs/deployment.md`](../deployment.md)) |
| Postgres | `EMBEDDED_POSTGRES=on`, volume on **`/var/lib/postgresql`** (parent dir, not `/data`) |
| Buddy tenant | `TENANT_PACKAGE_DIR=../buddy/tenant` (in-image path under `/app/buddy/tenant`) |
| Intelligence | CopilotKit **managed** free tier: `INTELLIGENCE_API_URL`, `INTELLIGENCE_GATEWAY_WS_URL`, `CPK_INTELLIGENCE_API_KEY` |
| Portfolio DB | **Supabase** (schema `buddy` only) — not embedded |
| Routines | `OPENBOT_ROUTINES_CRON=on`, `SERVER_INTERNAL_URL=http://127.0.0.1:3001`, `WORKER_SHARED_SECRET` |

The Dockerfile bakes the Buddy tenant into the app build when `TENANT_PACKAGE_DIR=../buddy/tenant` is passed at build time (`fly.toml` already sets this under `[build.args]`).

## 1. Install flyctl and log in

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

## 2. Create the app and volume (no deploy yet)

From the repository root:

```bash
fly launch --no-deploy
```

- Accept or change the app name (default in `fly.toml`: `buddy-openbot-test`).
- Confirm **region** `sea` or switch to `iad` if needed.
- When asked about Postgres, **decline** Fly Postgres — this image uses **embedded** Postgres with a Fly **volume**.

Create the data volume in the **same region** as the app (name matches `fly.toml`: `openbot_pgdata`):

```bash
fly volumes create openbot_pgdata --region sea --size 1
```

Use `--region iad` if you changed `primary_region`.

## 3. CopilotKit Intelligence (managed)

On a machine with a browser (laptop is fine):

```bash
npx --yes copilotkit@latest login
npx --yes copilotkit@latest project select
```

That writes `CPK_INTELLIGENCE_API_KEY` (and related values) into your local `.env`. Copy **only the key** into Fly secrets in the next step — do not commit it.

Optional: `bun scripts/setup-learning.ts` after `bun install` ensures the `openbot` Learning container exists (same as local Buddy).

## 4. Set Fly secrets

Set every secret below **without values in git**. Run one `fly secrets set` with all names you need.

### Always required (TEST)

| Secret | Purpose |
| --- | --- |
| `KEY_ENCRYPTION_KEY` | Credential vault encryption (`openssl rand -base64 32`) |
| `CPK_INTELLIGENCE_API_KEY` | CopilotKit managed Intelligence (from `project select`) |
| `WORKER_SHARED_SECRET` | Routines sweep → API (`openssl rand -base64 32`) |
| `OPENAI_API_KEY` | Default model key (or another provider key you configured) |
| `SUPABASE_URL` | Hosted Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Buddy memory (service role; **never** expose to browsers) |

### Supabase client (if you use publishable key in your project setup)

| Secret | Purpose |
| --- | --- |
| `SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key when your deployment reads it from the environment |

### Auth — pick **one** mode

**A. Single-user (private URL only)** — suitable for a TEST machine reachable only on VPN/Tailscale/home LAN, **not** on the public internet:

| Secret | Value |
| --- | --- |
| `OPENBOT_SINGLE_USER` | `true` |

Do **not** set `OPENBOT_PUBLIC_URL`, `OPENBOT_APP_URL`, or public `TRUSTED_ORIGINS` with this flag on a routable public host — the server refuses to start ([`docs/deployment.md`](../deployment.md)).

**B. Google OAuth (public `https://<app>.fly.dev`)** — register redirect URI  
`https://<app>.fly.dev/api/auth/callback/google` in Google Cloud Console:

| Secret | Purpose |
| --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth secret |
| `BETTER_AUTH_URL` | `https://<app>.fly.dev` (API origin, no trailing slash) |
| `BETTER_AUTH_SECRET` | Session signing (`openssl rand -base64 32`, ≥32 chars) |
| `TRUSTED_ORIGINS` | `https://<app>.fly.dev` |
| `OPENBOT_PUBLIC_URL` | `https://<app>.fly.dev` |
| `OPENBOT_APP_URL` | `https://<app>.fly.dev` (same origin when app and API share one host) |
| `INITIAL_ADMIN_EMAILS` | Comma-separated admin emails (e.g. `you@example.com`) |

Example (replace placeholders; run once):

```bash
# Generate KEY_ENCRYPTION_KEY and WORKER_SHARED_SECRET with: openssl rand -base64 32
fly secrets set \
  KEY_ENCRYPTION_KEY=... \
  CPK_INTELLIGENCE_API_KEY=... \
  WORKER_SHARED_SECRET=... \
  OPENAI_API_KEY=... \
  SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  OPENBOT_SINGLE_USER=true
```

For public Google OAuth, omit `OPENBOT_SINGLE_USER` and include the Google and `BETTER_AUTH_*` / `TRUSTED_ORIGINS` / `OPENBOT_*_URL` / `INITIAL_ADMIN_EMAILS` secrets instead.

Non-secret URLs for Intelligence are already in `fly.toml` under `[env]`.

## 5. First deploy

```bash
fly deploy
```

HTTPS is terminated by Fly (`force_https = true` in `fly.toml`). Health check: **`GET /health`** on port 3001.

After deploy:

```bash
fly status
fly logs
```

Open `https://<app>.fly.dev` (or your private URL).

## 6. Supabase schema (owner)

Apply migrations to your hosted project (not Fly):

```bash
supabase link --project-ref <your-ref>
supabase db push
```

In Supabase **Project → API → Exposed schemas**, include **`buddy`** so the REST client can reach portfolio tables ([`buddy/README.md`](../../buddy/README.md)).

## Routines worker (in the same Machine)

With `OPENBOT_ROUTINES_CRON=on`, **supercronic** inside the container runs:

```text
*/5 * * * *  bun scripts/fire-routines.ts
```

from `/app/server`, with the same environment as the API (including `SERVER_INTERNAL_URL` and `WORKER_SHARED_SECRET`). No second Fly process group and no second server — only the sweep script.

Hermes morning check-in still needs a **routine** created in the UI (see [`buddy/README.md`](../../buddy/README.md)).

## Optional: GitHub Actions deploy

Workflow [`.github/workflows/buddy-fly-deploy.yml`](../../.github/workflows/buddy-fly-deploy.yml) runs on **`workflow_dispatch` only** (never on push). Add repository secret `FLY_API_TOKEN` from `fly tokens create deploy -x 999999h`.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| 502 after deploy | Volume mounted at **`/var/lib/postgresql`**, not `/var/lib/postgresql/data` |
| Routines never fire | `fly secrets list` includes `WORKER_SHARED_SECRET`; logs show supercronic when `OPENBOT_ROUTINES_CRON=on` |
| Buddy memory tools missing | `SUPABASE_*` secrets; `buddy` schema exposed in Supabase API |
| Boot refuses public single-user | Remove public URLs or switch to Google OAuth |

See also: [`docs/deployment.md`](../deployment.md), [`docs/configuration.md`](../configuration.md).
