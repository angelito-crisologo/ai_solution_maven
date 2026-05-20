# PlanSight AI — Services & Components

The full landscape of third-party services PlanSight depends on, what tier
we're on, what each one costs, and where the scaling cliffs are.

**Maintain this file** whenever a service is added, removed, or moves to a
paid tier. Stale infra docs are dangerous.

---

## At-a-glance summary

- **Fixed monthly cost today: ~$0** (plus ~$10–15/yr for the domain).
- **Only meaningful variable cost: Anthropic.** Everything else is either
  free-tier-with-hard-cap or per-transaction.
- **First service likely to force a paid upgrade:** Render (cold-start
  UX) → Supabase (DB/MAU) → Vercel (bandwidth or 10 s timeout).
- **Breakeven on Vercel Pro ($20/mo) ≈ 2 Pro subs.** Full paid stack
  (Vercel Pro + Supabase Pro + Render Starter ≈ $52/mo) ≈ 3 Pro subs at
  $18.15 net.

---

## Service inventory

| # | Service | Category | Role in PlanSight | Plan | Cost today | Wired via (env / file) | Free-tier ceiling | What breaks first if you grow | Cost-lever rating | Upgrade path |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Vercel** | Compute / hosting | Hosts the Next.js 14 App Router site + all serverless API routes (`/api/plansight/*`, `/api/billing/*`, `/api/contact`, `/api/feedback`) | **Hobby** | $0/mo | `NEXT_PUBLIC_APP_URL` · whole `app/` tree | 100 GB bandwidth/mo · 100 GB-hr functions · **10 s** serverless timeout | AI route hitting the 10 s wall on big plans, or share-view bandwidth on a viral plan | 🟡 Medium — fixed unless you outgrow Hobby | Pro $20/mo |
| 2 | **Supabase** | Data + auth | Postgres (plans, shares, `product_activations`, `user_billing`, `ai_usage_log`, `upload_events`, `share_views`) + Auth (OTP / password / magic link) + RLS deny-all with service-role bypass | **Free** | $0/mo | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` · `lib/supabase/*`, `supabase/migrations/` | 500 MB DB · 1 GB storage · 2 GB egress · 50 K MAU · paused after 7d inactivity | DB row count from accumulated free signups + saved plans; the 24-hr anonymous-plan TTL is the relief valve | 🟡 Medium — knobs: TTL, payload size on plan rows | Pro $25/mo |
| 3 | **Render** | Compute (microservice) | Java `.mpp` parser microservice (`services/plansight-import/`) — Vercel can't run the JVM, so Next calls this over HTTP | **Free** (`plan: free` in `render.yaml`) | $0/mo | `PLANSIGHT_IMPORT_SERVICE_URL` · `services/plansight-import/`, called from `app/api/plansight/import-mpp/route.ts` | 750 instance-hrs/mo · sleeps after ~15 min idle (cold start) · 512 MB RAM | Cold-start latency on import (already tracked in admin) — felt before any quota is hit | 🟡 Medium — keep-warm ping today; otherwise pay | Starter ~$7/mo · Railway Hobby ~$5/mo (alternative noted in archive/upload-telemetry brief) |
| 4 | **UptimeRobot** | Monitoring / keep-warm | HTTP ping every ~5 min to the Render parser's `/api/health` to prevent the Render Free instance from sleeping. Cold-start time is the dominant parse-time outlier (`upload_events.parser_duration_ms`) | **Free** | $0/mo | Configured in the UptimeRobot dashboard (not in this repo). Target: `https://<render-service>/api/health` | 50 monitors · 5-min interval · email/webhook alerts | n/a — one monitor is all that's needed | 🟢 None — but a silent failure here (paused monitor, suspended account) makes the parser cold-start on real users. Tripwire: `parser_queue_ms > 3000` on >5% of uploads in a 7-day window | Paid ~$7/mo for 1-min checks, SMS |
| 5 | **Anthropic API** | AI inference | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — AI analysis, weekly narrative, Explain-this-Task. Called via raw `fetch` to `api.anthropic.com/v1/messages` (no SDK) | **Pay-as-you-go** (no subscription) | Variable — bounded to ~$3/user/mo by spend-alert | `ANTHROPIC_API_KEY` · `lib/plansight-ai/ai.ts`, `explain-task.ts`, `ai-payload/`, `ai-usage/` | No quota — just $/token | **Spend.** All other services have hard caps; this is the only one that grows linearly with usage | 🔴 **High — the only real variable-cost lever.** Mitigations shipped: bounded payload (v2), content-hash result cache, `MAX_OUTPUT_TOKENS=800`, free-tier 1-run-per-session gate, per-user rate-limit, $3/user/mo spend alert | N/A — controlled by payload/cache discipline |
| 6 | **Stripe** | Payments | Pro tier — Checkout (monthly $19, annual $190, URL-param promo codes via `?promo=CODE`), Customer Portal (cancellation + interval switching), webhook driving `product_activations.tier`, `user_billing`, dispute auto-revoke, and `stripe_events` dedupe | **Standard** account (no monthly fee) | Per-charge fee only (~2.9 % + $0.30) | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_PRICE_ID_ANNUAL`, `STRIPE_WEBHOOK_SECRET` · `lib/billing/stripe.ts`, `lib/billing/operator-alert.ts`, `app/api/billing/{checkout,portal,webhook}` | N/A | N/A — revenue side | 🟢 Net per Pro user ≈ **$18.15/mo** monthly or ~**$184.49/yr** annual (before income tax). **Refund policy: operator-driven, with a 14-day money-back guarantee on first Pro subscription** (per [`/products/plansight-ai/legal/refunds`](/products/plansight-ai/legal/refunds)). Refund via Stripe Dashboard's "Refund and cancel subscription" — fires `customer.subscription.deleted` and the webhook flips the tier. Honour the 14-day window when a first-time Pro customer requests within 14 days of their first payment. **Dispute policy:** `charge.dispute.created` revokes Pro and cancels the subscription immediately; operator gets a Resend email. **Promo campaigns:** create Coupon + Promotion Code in Stripe Dashboard, share `/products/plansight-ai/upgrade?promo=<CODE>` — no code change per campaign. | N/A |
| 7 | **Resend** | Transactional email | Contact-form delivery + operator spend-alert emails when any user crosses $3/mo Anthropic spend | **Free tier** (only `RESEND_API_KEY` set) | $0/mo | `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`, `OPERATOR_ALERT_EMAIL`, `OPERATOR_ALERT_FROM` · `lib/plansight-ai/ai-usage/spend-alert.ts`, `app/api/contact/route.ts` | 100 emails/day · 3 K/mo · 1 verified domain | Contact-form volume spike or spend-alert fan-out across many users in one day | 🟢 Low — volume tiny today | $20/mo (50 K emails) |
| 8 | **Google Analytics 4** | Analytics | Pageview + event tracking on marketing + product surfaces. No-ops when env unset, so safe in preview/dev | **Free** | $0/mo | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` · `lib/analytics/gtag.ts` | Effectively unlimited at this scale | n/a | 🟢 None | N/A |
| 9 | **GitHub** | Source / CI trigger | Repo hosting; Vercel and Render both deploy on push | **Free** (public repo) | $0/mo | n/a | n/a | n/a | 🟢 None | N/A |
| 10 | **Domain — `aisolutionmaven.com`** | DNS / brand | Public origin; SEO; deliverability anchor for Resend sender | Paid annual (registrar not visible in repo) | ~$10–15/yr | DNS → Vercel | n/a | n/a | 🟢 Fixed trivial | N/A |
| 11 | **Operator (self)** | Admin gate | Admin dashboard access at `/products/plansight-ai/admin` is gated on a single user id | n/a | $0 | `ADMIN_USER_ID` · `app/products/plansight-ai/admin/` | n/a | n/a | 🟢 None | N/A |

---

## Considered but not used

- **Railway** — listed in `docs/plansight-ai/archive/UPLOAD_TELEMETRY_IMPLEMENTATION_BRIEF.md` and `supabase/migrations/10_phase10_upload_events.sql` as a future upgrade target for the parser (Railway Hobby ~$5/mo, no cold starts). Not wired up; the upload telemetry exists specifically to make the Render-Free → Railway/Render-Starter decision data-driven.

---

## How the cost levers actually behave today

**Anthropic is the only meaningful variable cost** while traffic is low.
Everything else is either fixed-and-tiny (domain) or sitting on a free
tier with hard caps. The architecture already does the right things to
keep Anthropic spend bounded:

- `buildAIPayload` builds a bounded payload (token-estimated before send)
- Results are cached by content hash on the plan row — repeat views never re-spend
- Free anonymous users get one AI run per session; saving / regen is Pro-only
- `ai-usage/rate-limit.ts` per-user throttling
- `ai-usage/spend-alert.ts` emails the operator when any single user crosses $3/mo

**The next thing to break is whichever free tier you outgrow first.**
Most likely order, given the current shape:

1. **Render** cold-start pain (already visible in admin pipeline metrics) — felt before any quota is hit. ~$7/mo (Render Starter) or ~$5/mo (Railway Hobby) fix.
2. **Supabase free tier** — DB rows or MAU as signups accumulate. The 24h TTL on anonymous plans buys headroom; tune that knob before paying.
3. **Vercel Hobby** — function execution, bandwidth, or the 10 s timeout if a share link goes viral or an AI route runs long.
4. **Anthropic** — would only spike if Pro users regenerate aggressively; the per-user $3 alert is the tripwire.

Resend, GA4, GitHub, Stripe-as-cost: not worth thinking about at this stage.

---

## Out-of-repo configuration to remember

Most service config lives in this repo (env vars, `render.yaml`,
migrations). These do not — write them down if you ever rotate or
migrate:

- **UptimeRobot** monitor on Render `/api/health` (5-min ping). Account-level dashboard config.
- **Stripe** product, price, and webhook endpoint configured in the Stripe dashboard; only the IDs are in env.
- **Stripe customer email templates** (receipts, dunning, cancellation) — Dashboard → Settings → Customer emails. Add a footer line listing the three PlanSight legal URLs (`/products/plansight-ai/legal/{terms,privacy,refunds}`). See [stripe-setup.md §7.3](stripe-setup.md) for the exact snippet. This is the only customer-facing email surface PlanSight emits, since all in-code email paths (`app/api/contact`, `lib/billing/operator-alert`, `lib/plansight-ai/ai-usage/spend-alert`) target the operator, not customers.
- **Supabase Auth email templates** (signup confirmation, password reset) — Dashboard → Authentication → Email Templates. Two required changes:
  1. **Token-hash URLs** — the confirmation link must use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup` (signup) and `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` (password reset) instead of `{{ .ConfirmationURL }}`. This routes through `app/auth/confirm/route.ts` which uses `verifyOtp` — no browser-local PKCE verifier required, so links work when opened in a different browser than the one that initiated the flow.
  2. **Legal footer line** — add the same footer line as the Stripe templates listing the three PlanSight legal URLs.
- **Resend** verified sending domain DNS records (SPF/DKIM).
- **GA4** property + measurement ID created in the Google Analytics console.
- **Supabase** project URL, anon key, and service-role key are dashboard-managed.
- **Render** service URL pinned via `PLANSIGHT_IMPORT_SERVICE_URL` on Vercel.
- **Domain registrar** for `aisolutionmaven.com` (not recorded in this repo).
- **`SHARE_COOKIE_SECRET`** — server-only env var (min 32 chars). Used by `lib/plansight-ai/share-security.ts` to sign HMAC session cookies issued by `/api/plansight/share/verify` for password-protected shares. Generate with `openssl rand -hex 32`. Different value per environment (test, preview, production). The `share_access_attempts` Supabase table (created by migration 15) is the rate-limit + audit log; nothing user-facing reads it.
