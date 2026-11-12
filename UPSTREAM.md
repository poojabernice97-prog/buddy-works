# Upstream OpenBot

Buddy is built on [OpenBot](https://github.com/CopilotKit/openbot) (MIT).

| Item | Value |
| --- | --- |
| Upstream repository | https://github.com/CopilotKit/openbot |
| Git remote name | `upstream` |
| Base import tag | `v1.0.2` |

## Configure the remote

```bash
git remote add upstream https://github.com/CopilotKit/openbot.git
git fetch upstream --tags
```

## Merge upstream releases

```bash
git fetch upstream
git checkout main
git merge --no-ff v1.0.3   # example: replace with the target OpenBot tag
# Resolve conflicts; keep Buddy files under buddy/ and docs/buddy/
```

Buddy-specific changes live outside OpenBot core paths where possible:

- `buddy/tenant/` — tenant package (coworkers, channels, model)
- `buddy/tests/` — Buddy-focused tests
- `supabase/` — portfolio memory schema (separate from OpenBot's Postgres)
- `docs/buddy/` — Buddy product documentation

Do not fork OpenBot's server auth, approvals, audit, or routines layers for
Buddy features; extend through the tenant package and external data stores.
