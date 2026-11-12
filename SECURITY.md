# Security policy

## Supported versions

Buddy-works tracks OpenBot releases imported on `main`; security fixes for Buddy-specific code are
applied on the default branch and released with the next tagged Buddy release.

## Reporting a vulnerability

**Do not open public GitHub issues for security vulnerabilities.**

Email the repository maintainers with:

- Description of the issue and impact
- Steps to reproduce
- Affected paths (Buddy tenant, Supabase migrations, CI, etc.)

We will acknowledge receipt and work on a fix. Please allow reasonable time before public disclosure.

## Secrets

Never commit `.env`, API keys, `SUPABASE_SERVICE_ROLE_KEY`, or OAuth client secrets. Use
`.env.example` for variable names only.

## Supabase

Row Level Security is enabled on all `buddy` schema tables. Server-side code that uses the service
role must run only on trusted hosts, never in the browser.

## Upstream

Vulnerabilities in OpenBot core should also be reported to [CopilotKit/openbot](https://github.com/CopilotKit/openbot)
when they affect the imported tree.
