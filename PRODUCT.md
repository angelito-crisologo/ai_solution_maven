# AI Solution Maven

A freelance/portfolio brand and a SaaS product, built in the same repo.

## What we're building

**AI Solution Maven** is the public face of an independent AI builder: the marketing site at the company URL serves as both portfolio (to generate freelance leads) and demo surface (to showcase real working products). It is not a venture-backed startup; it's a passive-income SaaS effort with a freelance practice running alongside it.

The site has two halves:

1. **Marketing / portfolio** — homepage, services, projects, contact. The goal is convert visitors into freelance clients or product signups.
2. **Product (PlanSight AI)** — a working app embedded directly in the same Next.js codebase under `/products/plansight-ai`. Visitors can use it without leaving the site.

The bet is that a working, embedded flagship product is a more credible portfolio piece than a list of past projects, and that the same product can become its own paid SaaS over time.

## PlanSight AI — the initial product

**Tagline:** Upload, visualize, share, and understand project plans with AI insights.

### The problem

Project managers work in MS Project / Smartsheet / Excel. Their stakeholders mostly do not. Sharing a `.mpp` file with an executive sponsor or a non-technical stakeholder is high-friction: they don't have MS Project installed, the file is dense and hard to read, and the data underneath isn't easy to summarize. The result: project plans get underutilized, misunderstood, or ignored.

PlanSight AI exists to make that gap disappear. The PM uploads. The stakeholder views in their browser. The AI explains.

### What PlanSight does

1. **Imports** an `.mpp` (Microsoft Project) file. XLSX and Smartsheet adapters are on the roadmap.
2. **Renders** an interactive split-pane workspace: hierarchical task table on the left, synchronized Gantt chart on the right. Day / week / month timeline views, expand/collapse outline, dependency lines.
3. **Computes deterministic insights** with a PMP-aligned engine: critical path (early/late start, total float), late tasks, at-risk tasks, lagging tasks, dependency bottlenecks, and an overall RAG (red/amber/green) project health.
4. **Generates AI analysis** — a Claude-powered narrative summary, identified risks (with the specific task IDs each references), and prescriptive recommendations the PM can act on.
5. **Shares** a public read-only stakeholder view via an unguessable URL — no login required for the viewer.
6. **Exports** the plan to a clean `.xlsx` workbook with a summary block and outline grouping.

PlanSight is explicitly **not** a project management tool — not a competitor to Asana, Monday, or MS Project itself. It is a *visibility, analysis, and communication* layer over the project plans PMs already have.

### Tier model

The model is a clean three-step ladder. Each tier solves a different problem.

| Capability | Anonymous | Free (signed-in) | Paid (Pro) |
|---|---|---|---|
| Upload, view workspace + Insights + AI Analysis on the page | yes | yes | yes |
| AI analysis (Claude) — first generation, cached | yes | yes | yes |
| Stakeholder share link (read-only Gantt + table) | yes | yes | yes |
| Excel export (tasks-only) | yes | yes | yes |
| **Last imported plan still loaded when you return** | **no — must re-import** | **yes — single plan slot** | yes |
| **Number of plans retained** | **0 (ephemeral session)** | **1 (only the last one)** | **unlimited** |
| "My Plans" dashboard | no | no | yes |
| Plan management (rename, archive, delete) | no | no | yes |
| Regenerate AI analysis on demand | no | no | yes |
| Plan version history & compare | no | no | yes |
| Stakeholder share view analytics | no | no | yes |
| Plan health email alerts | no | no | yes |
| Weekly plan-health digest | no | no | yes |
| Custom-branded share pages & exports | no | no | yes |
| Password-protected shares | no | no | yes |
| XLSX / Smartsheet import | no | no | yes (roadmap) |
| Delay simulation / what-if | no | no | yes (roadmap) |
| Natural-language Q&A over plan | no | no | yes (roadmap) |
| Custom AI analysis prompt presets | no | no | yes (roadmap) |

**Tier framing:**
- **Anonymous** is a tryout. The PM uses the full workspace (table, Gantt, Insights, AI Analysis) on the page, but the moment they navigate away, the session is gone. The plan still exists in Supabase for the 14-day stakeholder TTL, but the PM has no UI to find it again unless they kept the share URL.
- **Free signed-in** is the single-plan workflow. The PM signs in and gets persistence of *one* plan — the most recently imported one. Importing a new plan silently replaces the previous one in their workspace; the old plan stays accessible via its share URL until TTL.
- **Pro** is the multi-plan workflow. Dashboard with all plans, regeneration, version compare, analytics, alerts, branding, and the rest of the workspace tools that make PlanSight a daily PM tool.

**Stakeholder share views stay simple at every tier.** Read-only Gantt + task table — no Insights, no AI Analysis. The AI commentary is for the PM, not the audience. This keeps share links focused, avoids leaking the PM's analysis to all stakeholders, and avoids accidental Claude cost from viewer traffic.

Future tier above Pro (Team / Pro+):
- Team workspaces with multiple PMs
- Role-based access (admin/editor/viewer)
- API access for integrations
- SSO

### Why this product

- **It solves a real problem** PMs encounter weekly.
- **It demonstrates AI capability** in a context that matters to the customer (project communication), not as a feature for its own sake.
- **It's defensible at MVP scope** — we don't compete with MS Project; we sit alongside it.
- **It has a viral loop**: PM uploads, sends a share link to stakeholders, some of those stakeholders are also PMs, some of those become users.

## Architecture

### Stack

- **Next.js 14 App Router**, TypeScript, Tailwind, shadcn/ui, Lucide icons.
- **Supabase** (Postgres) for plan storage and AI analysis cache. Anon key = read-only via RLS; service-role key = server-only writes.
- **Anthropic Claude Haiku 4.5** for AI analysis, called from a Vercel Edge function.
- **Java MPXJ parser service** for `.mpp` parsing — runs as a separate Render-hosted service because Vercel can't host a JVM.

### Hosting

- **Vercel Hobby** — Next.js app, all API routes (including Edge runtime for the AI analysis call).
- **Render Free** — parser service, kept warm via UptimeRobot ping every 5 min so the parser doesn't cold-start during demos.
- **Supabase Free** — Postgres database with RLS.
- **UptimeRobot Free** — uptime monitor + parser pinger.

Total infra cost during validation: **$0/mo**. Migrating to Railway Hobby ($5/mo) for the parser is the planned upgrade once paying users justify it.

### Security posture

- All write paths to the database go through Next.js server routes using Supabase's service-role key, which bypasses RLS.
- The anon Supabase key (which is in every browser) has SELECT-only permissions.
- Share IDs are 128-bit `crypto.randomUUID()` values — unguessable, not derivable from plan content.
- API routes validate input with Zod, cap body size (5 MB) and task count (5000), and check magic bytes on uploaded `.mpp` files.
- The MPP parser proxy enforces a 25 MB upload cap and a 25-second AbortController timeout.

## Implementation phases

The product is being built in phased increments. Each phase ships independently.

### Phase 1 — Security hardening (shipped)

Fixed a critical RLS issue where any browser holding the anon key could read, write, or overwrite any plan in the database. Tightened RLS, switched share IDs to UUIDs, moved all writes server-side via service-role key, added input validation and rate caps to API routes.

### Phase 2 — Excel export (shipped)

Single-sheet `.xlsx` export with a summary block (plan name, dates, total/not-started/in-progress/completed/late/at-risk/critical task counts), frozen header, outline grouping for summary tasks, and consistent date formatting. Ships per `EXCEL_EXPORT_SPEC.md`.

### Phase 3 — Real AI analysis with Claude (in progress)

Replaces a previously-templated "AI analysis" panel with actual Claude integration. Edge runtime, two sequential Haiku calls (findings → recommendations) for reliable structured output, prompt caching on the system prompt, content-hash response cache so re-views never re-burn tokens.

The two-call architecture was chosen after iteration: a single call consistently produced empty recommendations because the model treated risks as covering both descriptive and prescriptive concerns. Splitting the calls — one tool for summary+risks, a separate tool whose only output is recommendations — eliminated the failure mode.

A follow-up bounded-payload refactor (see `branding/plansight-ai/AI_PAYLOAD_SPEC.md`) keeps AI cost and latency roughly flat across plan sizes — a 25,000-task plan analyzes for the same cost as a 100-task plan. Measured cost: 3–8¢ per first generation. Cached re-views (content-hash cache on `public.plans.ai_analysis`) are free — no Claude call. Latency: 5–8s end-to-end on first generation, sub-second on cached views.

The Regenerate button is gated as a Pro-tier feature. A preview-only env var (`NEXT_PUBLIC_PLANSIGHT_DEV_REGENERATE`) bypasses the gate during development.

### Phase 4 — Auth & "My Plans" dashboard (planned)

Supabase Auth (email magic-link), `owner_user_id` populated on new plans, "claim guest plans" flow, signed-in dashboard at `/dashboard`, server-side enforcement of the Regenerate gate via session check, free-tier limits enforced (3-plan cap, 5 AI/day for free signed-up).

### Phase 5 — Stripe & paid tier (planned)

Stripe Checkout for Pro upgrade, webhook updates user tier in DB, paywall on Pro features replaces the "coming soon" placeholder. Goal: revenue.

## Status snapshot

| Concern | Status |
|---|---|
| Marketing site | Live |
| `.mpp` import + parser service | Live |
| Stakeholder share link (read-only) | Live |
| Deterministic insights engine (PMP-aligned CPM) | Live |
| Excel export (tasks-only) | Live |
| AI analysis with Claude | In active development |
| User authentication | Not started (Phase 4) |
| Paid tier / Stripe | Not started (Phase 5) |

## What's next

1. Finalize and ship Phase 3 (AI analysis).
2. Demo the product publicly via the marketing site to validate interest and gather feedback.
3. Build Phase 4 (auth) once enough validation signal exists to justify the work.
4. Build Phase 5 (Stripe) once at least one validated user is willing to pay.

## Reference

| Document | What it covers |
|---|---|
| `PlanSightAI.md` | Product strategy and positioning |
| `INSIGHTS_SYSTEM.md` | PMP-aligned insights engine spec (CPM math, RAG thresholds) |
| `branding/plansight-ai/AI_PAYLOAD_SPEC.md` | Bounded AI payload contract (sections, caps, sort orders, token budget) |
| `branding/plansight-ai/TELEMETRY_SPEC.md` | Upload telemetry contract (schema, failure-stage taxonomy, fire-and-forget rule) |
| `EXCEL_EXPORT_SPEC.md` | Excel export acceptance criteria |
| `PLANSIGHT_MIGRATION_MAP.md` | Migration map from the original `mpp_viewer` codebase |
| `branding/<product>/BRANDKIT.md` | Per-product design system (colors, typography, voice). AISM brand at `branding/ai-solution-maven/BRANDKIT.md`. Tokens in `lib/branding/`. |
| `AGENTS.md` | Original project instructions |
| `IMPLEMENTATION_PLAN.md` | Phase-by-phase work tracker |
| `README.md` | Dev environment, deployment, env vars |
