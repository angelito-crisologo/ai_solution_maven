# PlanSight AI — Documentation

This folder is the **product/engineering documentation** for PlanSight AI.
Brand assets (voice, colors, typography, logos) live under
`/branding/plansight-ai/` per the repo's branding convention.

## Map

- **[PRODUCT.md](PRODUCT.md)** — high-level product overview: what
  PlanSight is, what's shipped, who it's for, links to the specs below.

- **[services.md](services.md)** — full inventory of third-party services
  PlanSight depends on (Vercel, Supabase, Render, UptimeRobot, Anthropic,
  Stripe, Resend, …), tiers, costs, and scaling cliffs.

- **[stripe-setup.md](stripe-setup.md)** — step-by-step Stripe Dashboard
  configuration: products, prices, webhooks, Customer Portal, Checkout,
  emails, branding, GST, promotion codes, going-live checklist, gotchas.

- **[CHANGELOG.md](CHANGELOG.md)** — notable shipped + in-progress
  changes, organised by version. Add an entry when you ship anything
  worth remembering.

- **[specs/](specs/)** — living contracts. Each file is the source of
  truth for one domain and should be kept aligned with the code.
  - [pro-features.md](specs/pro-features.md) — Pro tier features, gates,
    cost model
  - [pricing-section.md](specs/pricing-section.md) — marketing pricing
    table, dialog content, anonymous TTL + claim-on-signup mechanic
  - [ai-payload.md](specs/ai-payload.md) — what gets sent to Claude,
    payload caps, prompt caching, v1 rollback
  - [telemetry.md](specs/telemetry.md) — `upload_events`,
    `ai_usage_log`, `share_views` schemas + retention
  - [insights.md](specs/insights.md) — deterministic insights engine
    (critical path, RAG, late tasks, milestones)
  - [abuse-mitigation.md](specs/abuse-mitigation.md) — rate limits, soft
    caps, spend alerts on AI features

- **[archive/](archive/)** — historical design artifacts (implementation
  briefs, migration map, mockups). Kept for context but not maintained
  against current code. If a brief is still useful, promote what's
  relevant to a spec instead of updating the brief.

## When to update

When you ship a change that affects an area documented here, update the
relevant spec in the same PR. Stale specs are worse than missing ones —
readers trust them.
