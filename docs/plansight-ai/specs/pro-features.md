# PlanSight AI — Pro Features

**Tagline:** Pro turns PlanSight from a tool you try on one project into the tool you use every week.

**Price:** $19/month or $190/year (save ~17% — two months free)

**Positioning:** Free is enough to view and share a single plan. Pro is for project managers who run multiple plans, communicate weekly with stakeholders, and want PlanSight integrated into their workflow rather than visited occasionally.

---

## Tier comparison

Shipped (live in production):

| Capability | Free (signed-up) | **Pro** |
|---|---|---|
| Upload `.mpp` files, view, deterministic insights | ✓ | ✓ |
| Stakeholder share link (read-only) | ✓ | ✓ |
| Excel export | ✓ | ✓ |
| AI analysis | First generation, cached | **Regenerate any time** |
| Plans saved | 1 visible (most recent) | **Unlimited** |
| My Plans dashboard | – | ✓ |
| Weekly status snapshot (PDF, landscape) | – | ✓ |
| "Explain this task" inline AI | – | ✓ |
| PDF export | – | ✓ |
| Upload size cap | 5 MB | **25 MB** |

Deferred to Pro v1.1 — see the section at the end of this doc.

---

## Pro features in detail

### 1. Unlimited plans + My Plans dashboard — **shipped**

**What it does.** Upload as many plans as you want and see them all in one place at `/products/plansight-ai/my-plans`. Rename, archive, or delete from a single workspace. Free signed-in users have a single plan visible — additional plans show as "Pro only" rows that unlock on upgrade.

**Why a PM cares.** Most PMs run more than one project at a time. The single-plan limit on Free isn't a quota wall — it's a workflow constraint. Pro removes that constraint and gives the PM a home base for everything they're managing. This is the feature that turns PlanSight from "tool I tried" into "tool I use."

**Implementation.** `app/products/plansight-ai/my-plans/page.tsx`; tier gate at `isPro = activation.tier === "pro"`; free users see `hiddenCount = plans.length - 1` locked rows.

---

### 2. Regenerate AI analysis — **shipped**

**What it does.** Re-run the Claude analysis on demand after a plan update. Free tier sees only the first cached generation; Pro can regenerate any time the plan changes.

**Why a PM cares.** Plans evolve weekly. The AI summary that was accurate two weeks ago is stale today. Regenerate keeps the AI insights synchronized with the current state of the project, so the PM is never showing stakeholders an out-of-date analysis.

**Implementation.** `app/api/plansight/ai-analysis/route.ts` — Pro gate at `activation.tier !== "pro"` rejects non-Pro callers. UI in `components/plansight-ai/PlanSightAIAnalysisPanel.tsx` shows an upgrade modal for non-Pro users. Each call is logged to `ai_usage_log` (see [abuse-mitigation.md](abuse-mitigation.md)).

---

### 3. Weekly status snapshot (PDF) — **shipped**

**What it does.** One click generates a one-page PDF status report: top-line health (RAG), what slipped this week, what's at risk, milestones hitting this week, milestones coming next week. Suitable for emailing directly to stakeholders.

**Why a PM cares.** Weekly status reports are something almost every PM produces manually, every week, taking 30–60 minutes each time. The data is already in PlanSight — Pro just packages it into the format the PM was going to produce anyway. This is the single highest-time-saved feature in Pro and arguably justifies the subscription on its own.

**Implementation.** `app/api/plansight/weekly-snapshot/route.ts` with Pro gate. Week start day is user-configurable (Mon/Sun) and stored in `users.week_start_day` (phase 8). PDF rendered via `@react-pdf/renderer` in `lib/plansight-ai/pdf/weekly-report.tsx`.

---

### 4. "Explain this task" inline AI — **shipped**

**What it does.** Click any task to get a short AI-generated explanation: why it matters, what depends on it, what its slipping would mean, where the risk sits. Single-turn, scoped to one task — not a full chat.

**Why a PM cares.** Two audiences benefit. Stakeholders get instant context on a task without having to ask the PM. PMs get a sanity-check on tasks they may not have looked at closely in a while. Different from the broad project-level AI analysis: this is task-level, on-demand, and bounded.

**Implementation.** `app/api/plansight/explain-task/route.ts` calling `claude-haiku-4-5-20251001`. Per-task cache keyed on `(plan_content_hash, task_id)` in `explain_task_cache` — generated once per plan content, served free on every subsequent click. See [abuse-mitigation.md](abuse-mitigation.md) for rate limits and spend alerts.

---

### 5. PDF export — **shipped**

**What it does.** Export the share-page snapshot or the weekly status snapshot as a clean, well-formatted, landscape PDF.

**Why a PM cares.** Stakeholders forward PDFs. They don't forward links — links require the recipient to click, load, possibly authenticate, and trust the source. PDFs land in inboxes and get read. For executive communication, PDF is the format of record.

**Implementation.** `app/api/plansight/export-pdf/route.ts` with Pro gate. `@react-pdf/renderer` server-side; landscape orientation set in `lib/plansight-ai/pdf/share-view.tsx` (`orientation="landscape"`).

---

### 6. Higher upload limits — **shipped**

**What it does.** Raises the file size cap (5 MB → 25 MB) for Pro users. This is a **parsing and rendering** cap — what the MPP parser proxy will accept and what the workspace UI can render performantly. It is **not** an AI-cost cap: the bounded AI payload (see [ai-payload.md](ai-payload.md)) keeps AI cost roughly flat regardless of plan size.

**Why a PM cares.** Most plans fit comfortably under the existing free-tier cap. The ones that don't — large enterprise programs, consolidated portfolio plans, multi-year roadmaps — belong to exactly the kind of PM most likely to pay. Higher limits are invisible to free users and meaningful to the segment with the highest willingness to pay.

**Implementation.** `getLimitsForTier` keyed off `product_activations.tier`, applied at `app/api/plansight/import-mpp/route.ts:170`.

---

## On the roadmap (Pro v1.1)

These are strong features deferred from v1 because they cost more to build than they pay back at launch. Worth shipping once Pro has paying users asking for them.

### Version compare

Upload an updated plan and see what changed since the last version — task moves, critical-path shifts, slipping milestones, added/removed scope. Best paired with AI narration ("Since last week, the launch milestone slipped 9 days because Task 47 is now blocking three downstream tasks that were previously parallel") rather than a raw diff table.

**Why deferred.** ID-matching across re-imports is a hard problem (MS Project task IDs aren't stable when the WBS is reorganized), and most PMs use this feature occasionally rather than daily. It's a retention feature, not a conversion driver. Build it once paying users ask for it.

### AI chat with plan

Conversational interface where the PM or stakeholder can ask Claude questions about the plan ("which tasks are blocking the launch?", "what would happen if Task 47 slips a week?", "summarize the QA phase").

**Why deferred.** Cost scales with engagement and requires careful infrastructure (prompt caching on plan context, per-user token quotas, abuse prevention, conversation persistence). Worth building only after validating that paying users will pay extra for it. When it ships, it likely justifies a higher tier ($29/mo) or a metered add-on rather than being bundled into base Pro.

---

## What Pro deliberately is *not*

- **Not a project editing tool.** PlanSight does not compete with MS Project on its home turf. Pro adds analysis, communication, and workflow features — never editing.
- **Not a real-time collaboration platform.** Stakeholders view, they don't co-edit.
- **Not a team product (yet).** Pro is single-seat. Team plans with multiple seats and shared workspaces are a future tier, not Pro.
- **Not an alerts/monitoring product.** Plans don't change unless re-uploaded, so automated alerting has weak triggers. The weekly snapshot covers the same need with simpler infrastructure.

---

## Pricing rationale (one paragraph)

$19/month sits in the band where PMs can expense the tool without manager approval, signals "real product" rather than side project, and prices below the per-seat cost of Asana, Monday, or MS Project Plan 1. Unit economics are healthy at this price: marginal cost per Pro user is dominated by the bounded Haiku AI calls — `claude-haiku-4-5-20251001` via the regenerate and weekly-snapshot paths, plus the per-task explain cache. Actual per-user spend is now tracked in `ai_usage_log` and visible on `/products/plansight-ai/admin` under "Cost / active Pro". The annual option (~17% discount) funds 6+ months of infrastructure in a single transaction, which matters when running solo.
