# Contributing to Buddy

Thank you for helping build Buddy on OpenBot.

## Where to change what

| Area | Location |
| --- | --- |
| Coworkers, channels, prompts | `buddy/tenant/` |
| Buddy tests | `buddy/tests/` |
| Portfolio schema | `supabase/migrations/` |
| Product docs | `docs/buddy/` |
| OpenBot core (avoid) | Prefer upstream PRs to [CopilotKit/openbot](https://github.com/CopilotKit/openbot) |

Phase 0 intentionally does **not** modify OpenBot’s server auth, approvals, audit, or routines.

## Development workflow

1. Fork and branch from `main` (naming: `cursor/<short-description>-<suffix>` if using Cloud Agents).
2. Install: `bun install --frozen-lockfile`
3. Run checks: `bun test buddy/tests`, `bunx biome check buddy/`, and Supabase migration validation in CI.
4. Open a pull request with a clear description and link any issue.

## Code style

Match the surrounding OpenBot tree: Biome for format/lint, TypeScript strictness in packages that
typecheck. YAML tenant files follow the style of `examples/fintech`.

## Community

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security issues: [SECURITY.md](SECURITY.md).
