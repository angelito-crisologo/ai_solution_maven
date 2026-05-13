# PlanSight AI — Product Overview

PlanSight AI turns MS Project `.mpp` files into an AI-analyzed,
shareable project view. Project managers upload their plan, get a
deterministic insights pass plus an AI narrative, and can share a
read-only link with stakeholders who don't own MS Project.

Live at **https://aisolutionmaven.com/products/plansight-ai**.

---

## What's shipped

**Free for anyone (no signup):**
- `.mpp` upload + parse (5 MB cap; Pro gets 25 MB)
- Interactive Gantt chart (day / week / month zoom) and task table
- Deterministic insights (critical path, late tasks, RAG status, milestones)
- One free AI analysis per session
- Read-only share link
- Ephemeral storage (24-hour TTL on anonymous plans)

**Free signed-in tier (`product_activations.tier = "free"`):**
- Everything above, plus
- 1 saved plan visible in **My Plans** (`/products/plansight-ai/my-plans`)
- Persistent share links across sessions
- **Revoke / restore share link** — turn a shared URL off (and back on)
  without deleting the plan
- Sign-up via Supabase email + password

**Pro tier (`product_activations.tier = "pro"`, Stripe-backed):**
- Unlimited saved plans
- **Regenerate AI analysis** any time the plan changes
- **Explain this task** — per-task AI explanations (Haiku 4.5, cached)
- **Weekly status report** — one-click, ready to send
- **PDF export** — landscape, ready to forward
- **Password-protected share links** — opt-in per share, scrypt-hashed,
  HMAC-signed session cookies, rate-limited verify attempts
- $19/month or $190/year (~17% off) via Stripe Checkout + Stripe
  Customer Portal. Interval switching is self-serve from the portal.

---

## Architecture at a glance

```
Next.js 14 App Router (Vercel Hobby)
  ↓
Supabase Postgres (RLS deny-all + service-role bypass)
  ↓
Render-hosted .mpp parser microservice (keep-warm pinged)
  ↓
Anthropic API — claude-haiku-4-5-20251001 (via @anthropic-ai/sdk)
  ↓
Stripe (checkout + customer portal + webhooks)
```

Key route surfaces:
- `app/products/plansight-ai/` — workspace, my-plans, admin
- `app/api/plansight/` — import-mpp, ai-analysis, explain-task, weekly-snapshot, export-pdf, share, activate
- `app/api/billing/` — checkout, portal, webhook

---

## Operational visibility

`/products/plansight-ai/admin` (gated on `ADMIN_USER_ID` env var) shows:
- Pipeline health (parse times, failure stages, cold-start proxy)
- AI cost (total, per-feature, per-user top spenders)
- Funnel (users → activations → Pro)
- Engagement (share views, top-viewed plans)

Backed by three telemetry tables: `upload_events`, `ai_usage_log`, `share_views`.

---

## Strategic positioning

PlanSight is **not** a project-management tool — no editing, no
assignment changes, no resource management. It's a **plan visibility
and communication layer** for plans built elsewhere. The wedge is:
project managers already own the plan; PlanSight lets them share it
without forcing the recipient to install MS Project.

---

## Where to read more

- **[specs/pro-features.md](specs/pro-features.md)** — every Pro feature, gate, and cost model
- **[specs/SECURE_SHARE_LINKS_SPEC.md](specs/SECURE_SHARE_LINKS_SPEC.md)** — revoke/restore + password protection (Phase 15, v1.2 shipped subset)
- **[specs/IN_PRODUCT_DISCLAIMERS_SPEC.md](specs/IN_PRODUCT_DISCLAIMERS_SPEC.md)** — AI disclaimer copy and placement
- **[specs/ai-payload.md](specs/ai-payload.md)** — what gets sent to Claude, payload caps, caching
- **[specs/telemetry.md](specs/telemetry.md)** — `upload_events`, `ai_usage_log`, `share_views` contracts
- **[specs/insights.md](specs/insights.md)** — deterministic insights engine (critical path, RAG, etc.)
- **[specs/abuse-mitigation.md](specs/abuse-mitigation.md)** — rate limits, soft caps, spend alerts
- **[stripe-setup.md](stripe-setup.md)** — Stripe Dashboard configuration walkthrough
- **[CHANGELOG.md](CHANGELOG.md)** — versioned notable changes
- **[archive/](archive/)** — historical implementation briefs (kept for context, not maintained)
