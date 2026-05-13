# AI Solution Maven

AI Solution Maven is a Next.js site for a freelance AI builder portfolio and lead-generation site.

## Local Development

```bash
npm install
npm run dev
```

For local `.mpp` imports, run the parser service on port `3005`. The Next app falls back to `http://localhost:3005` in development if `PLANSIGHT_IMPORT_SERVICE_URL` is not set.

## Production Build

```bash
npm run build
npm run start
```

## Vercel Deployment

This project is ready for Vercel.

1. Push the repository to GitHub.
2. Import `angelito-crisologo/ai_solution_maven` into Vercel.
3. Add these environment variables in Vercel:
   - `RESEND_API_KEY`
   - `CONTACT_FROM_EMAIL`
   - `CONTACT_TO_EMAIL`
   - `PLANSIGHT_IMPORT_SERVICE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, do **not** prefix with `NEXT_PUBLIC_`)
   - `ANTHROPIC_API_KEY` (server-only, do **not** prefix with `NEXT_PUBLIC_`)
   - `STRIPE_SECRET_KEY` (server-only)
   - `STRIPE_PRICE_ID` — monthly recurring Price id (`price_…`) for PlanSight Pro
   - `STRIPE_PRICE_ID_ANNUAL` — annual recurring Price id (`price_…`) for PlanSight Pro
   - `STRIPE_WEBHOOK_SECRET` (server-only) — endpoint signing secret; test- and live-mode values differ
   - `SHARE_COOKIE_SECRET` (server-only) — ≥32 char HMAC key signing the share-link password session cookie. Generate with `openssl rand -hex 32`. Different value per environment.
   - `NEXT_PUBLIC_APP_URL` — public origin used to build Stripe Checkout success / cancel URLs (e.g. `https://aisolutionmaven.com`)
   - `OPERATOR_ALERT_EMAIL` (server-only) — inbox that receives dispute auto-revoke and per-user AI spend alerts. **If unset, both alert paths fall through silently** — set this before going live.
   - `OPERATOR_ALERT_FROM` (server-only, optional) — sender address on alert emails. Defaults to `alerts@aisolutionmaven.com`; must exist on your Resend verified domain.
   - `ADMIN_USER_ID` (server-only) — Supabase user id that can access `/products/plansight-ai/admin`. Anyone else hitting that path gets a 404.
4. Deploy the project.

Recommended values:
- `CONTACT_FROM_EMAIL`: a verified sender address in Resend
- `CONTACT_TO_EMAIL`: your inbox address
- `PLANSIGHT_IMPORT_SERVICE_URL`: the deployed MPP parser service URL
- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase dashboard → Project Settings → API → `service_role` secret
- `ANTHROPIC_API_KEY`: from https://console.anthropic.com → Settings → API Keys

### AI Analysis

PlanSight AI calls `claude-haiku-4-5-20251001` via the Anthropic API and caches each result by content hash on the plan row, so repeat views never re-spend tokens. `ANTHROPIC_API_KEY` must be set in Vercel for the AI features to work. See [`docs/plansight-ai/specs/ai-payload.md`](docs/plansight-ai/specs/ai-payload.md) for the bounded payload contract and [`docs/plansight-ai/specs/abuse-mitigation.md`](docs/plansight-ai/specs/abuse-mitigation.md) for rate limits and spend alerts.

## Supabase Setup

1. Open your Supabase project.
2. Go to the SQL editor and run `supabase/schema.sql` for a fresh setup.
3. Existing installations: apply migrations under `supabase/migrations/` in numeric order (`01` through `11`). They are idempotent. Migrations cover RLS lockdown, the AI analysis cache, users + per-product activation, Stripe billing, week-start preference, AI usage logging, upload telemetry, and share-view telemetry.
4. Add the env vars above to `.env.local` for local development and to Vercel for production.

### RLS posture

After Phase 1, the anonymous Supabase key is **read-only**. All writes (saving a shared plan, deleting expired plans) go through Next.js server routes using `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. The service-role key must never reach the browser.

## MPP Import Deployment

PlanSight AI keeps the Next.js app on Vercel, but the `.mpp` parser must run in a separate service because Vercel does not host the Java runtime used by the parser.

The parser service now lives in `services/plansight-import/` and is deployed with the root `render.yaml`.

Deploy that service to Render, then point `PLANSIGHT_IMPORT_SERVICE_URL` at the resulting service URL.

## Authentication

Supabase Auth (email/password + magic link) is wired up. Sign-in / sign-up flows live under `/signin`, `/signup`, `/forgot-password`, `/reset-password`. Anonymous use is intentionally supported for stakeholder share pages.

## Brand Assets

Brand and metadata assets live in `app/`:
- `app/icon.svg`
- `app/apple-icon.svg`
- `app/opengraph-image.tsx`
- `app/manifest.ts`
- `app/robots.ts`
- `app/sitemap.ts`
