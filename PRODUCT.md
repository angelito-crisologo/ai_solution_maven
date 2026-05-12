# AI Solution Maven

AI Solution Maven (AISM) is a one-person AI freelance brand and SaaS
shop, built in a single Next.js repo. The same site is both **portfolio
and product surface** — visitors can use the flagship product without
leaving the marketing site.

Live at **https://aisolutionmaven.com**.

---

## Two halves of the business

1. **Freelance / portfolio.** Homepage, services, projects, contact
   form. Goal: convert visitors into freelance leads. Outcome-focused
   copy, embedded product preview, real working demos.

2. **Product (SaaS).** Currently one product, **PlanSight AI**, live
   under `/products/plansight-ai`. Currently monetized at $19/month
   via Stripe.

The thesis: a working, embedded flagship product is a more credible
portfolio piece than a list of past engagements, and the same product
can carry passive revenue as a SaaS over time.

---

## Products

- **PlanSight AI** — MS Project (`.mpp`) viewer + AI analysis +
  shareable stakeholder views. Free + Pro tiers. See
  [`docs/plansight-ai/PRODUCT.md`](docs/plansight-ai/PRODUCT.md) for
  the full product overview, shipped state, and architecture.

Future products would slot under `/products/<slug>` with their own
brand kit, design tokens, and `product_activations.product_slug`
identifier.

---

## Stack at a glance

- **Next.js 14 App Router** on **Vercel Hobby** ($0/mo)
- **Supabase** Postgres + Auth ($0/mo, free tier)
- **Anthropic Claude** via the AI SDK for product AI features
- **Render Free** for the Java `.mpp` parser microservice
- **Stripe** for product billing
- **Resend** for transactional email (contact form, billing alerts)

Total infra cost during validation: **$0/mo** plus per-call Claude
token usage. Bootstrap-friendly by design.

---

## Where to read more

- [`README.md`](README.md) — local development, env vars, deployment
- [`docs/plansight-ai/`](docs/plansight-ai/) — PlanSight product
  overview and engineering specs (pro features, AI payload, telemetry,
  insights engine, abuse mitigation)
- [`branding/`](branding/) — brand documentation (per-product voice,
  colors, typography, assets)
- [`context/build-log/`](context/build-log/) — dated session logs;
  authoritative history of what shipped when and why
- [`docs/archive/`](docs/archive/) — early-phase scaffolding briefs,
  kept for historical context
