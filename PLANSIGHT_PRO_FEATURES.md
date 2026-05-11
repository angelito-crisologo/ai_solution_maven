# PlanSight AI — Pro Features

**Tagline:** Pro turns PlanSight from a tool you try on one project into the tool you use every week.

**Price:** $19/month or $190/year (save ~17% — two months free)

**Positioning:** Free is enough to view and share a single plan. Pro is for project managers who run multiple plans, communicate weekly with stakeholders, and want PlanSight integrated into their workflow rather than visited occasionally.

---

## Tier comparison

| Capability | Free (signed-up) | **Pro** |
|---|---|---|
| Upload `.mpp` files, view, deterministic insights | ✓ | ✓ |
| Stakeholder share link (read-only) | ✓ | ✓ |
| Excel export (tasks-only) | ✓ | ✓ |
| AI analysis | First generation, cached | **Regenerate any time** |
| Plans saved | 1 (most recent) | **Unlimited** |
| My Plans dashboard | – | ✓ |
| Saved filtered views + per-filter share URLs | – | ✓ |
| Task annotations | – | ✓ |
| Weekly status snapshot (PDF) | – | ✓ |
| "Explain this task" inline AI | – | ✓ |
| PDF export | – | ✓ |
| Custom branding | – | ✓ |
| Higher upload limits | – | ✓ |

---

## Pro features in detail

### 1. Unlimited plans + My Plans dashboard

**What it does.** Upload as many plans as you want and see them all in one place. Rename, archive, or delete from a single workspace. Free signed-in users have a single plan slot — importing a new plan replaces the previous one.

**Why a PM cares.** Most PMs run more than one project at a time. The single-plan limit on Free isn't a quota wall — it's a workflow constraint. Pro removes that constraint and gives the PM a home base for everything they're managing. This is the feature that turns PlanSight from "tool I tried" into "tool I use."

**Build cost.** Low. Standard CRUD with Supabase Auth and `owner_user_id` filtering.

---

### 2. Regenerate AI analysis

**What it does.** Re-run the Claude analysis on demand after a plan update. Free tier sees only the first cached generation; Pro can regenerate any time the plan changes.

**Why a PM cares.** Plans evolve weekly. The AI summary that was accurate two weeks ago is stale today. Regenerate keeps the AI insights synchronized with the current state of the project, so the PM is never showing stakeholders an out-of-date analysis.

**Build cost.** Already built in Phase 3. The gate is a session check, nothing more.

---

### 3. Saved filtered views + per-filter share URLs

**What it does.** Filter the plan by assignee, date range, status (late / at-risk / critical), summary level (milestones only), or custom tag. Save the filter. Each saved filter gets its own share URL the PM can send to a specific stakeholder.

**Why a PM cares.** Different stakeholders need different views of the same plan. The exec sponsor wants milestones. The team lead wants their team's tasks. Finance wants budget-flagged items. Today the PM either sends everyone the whole plan (overwhelming) or builds a custom report for each (time-consuming). Saved filtered views let one source of truth produce many targeted views, each with its own share link.

**Build cost.** Low-medium. Filter logic exists; this adds save + share-URL generation per filter.

---

### 4. Task annotations

**What it does.** Add per-task commentary the MPP file doesn't carry — context, caveats, status notes. Visible on the share page so stakeholders see what the PM wants them to see.

**Examples of what gets annotated.**
- "This date is aspirational, real target is +2 weeks"
- "Waiting on legal sign-off"
- "Sarah is on leave, watch this one"
- "Blocked by vendor; escalated Monday"

**Why a PM cares.** MS Project carries the structured data — tasks, dates, dependencies — but not the narrative. The narrative is what makes the plan actually useful in conversations. Annotations capture the PM's tacit knowledge alongside the data, so when a stakeholder views the share page, they see both. This also gives stakeholders something to engage with, which lifts share-link engagement.

**Build cost.** Low. One additional table in Supabase, simple inline UI.

---

### 5. Weekly status snapshot (PDF)

**What it does.** One click generates a one-page PDF status report: top-line health (RAG), what slipped this week, what's at risk, milestones hitting this week, milestones coming next week. Suitable for emailing directly to stakeholders.

**Why a PM cares.** Weekly status reports are something almost every PM produces manually, every week, taking 30–60 minutes each time. The data is already in PlanSight — Pro just packages it into the format the PM was going to produce anyway. This is the single highest-time-saved feature in Pro and arguably justifies the subscription on its own.

**Build cost.** Medium. A structured AI prompt over the existing insights engine plus PDF rendering. Pairs naturally with the PDF export feature (same rendering pipeline).

---

### 6. "Explain this task" inline AI

**What it does.** Click any task to get a short AI-generated explanation: why it matters, what depends on it, what its slipping would mean, where the risk sits. Single-turn, scoped to one task — not a full chat.

**Why a PM cares.** Two audiences benefit. Stakeholders get instant context on a task without having to ask the PM. PMs get a sanity-check on tasks they may not have looked at closely in a while. Different from the broad project-level AI analysis: this is task-level, on-demand, and bounded.

**Build cost.** Low. A focused Haiku prompt with the task plus its dependency neighborhood. Predictable token cost (no chat history to grow).

---

### 7. PDF export

**What it does.** Export the AI analysis, the share-page snapshot, or the weekly status snapshot as a clean, well-formatted PDF.

**Why a PM cares.** Stakeholders forward PDFs. They don't forward links — links require the recipient to click, load, possibly authenticate, and trust the source. PDFs land in inboxes and get read. For executive communication, PDF is the format of record. PlanSight needs to produce one.

**Build cost.** Low. `@react-pdf/renderer` or Puppeteer. Half-day build using server-side rendering of the existing share-page or analysis components.

---

### 8. Custom branding

**What it does.** PM uploads their company logo, sets brand colors, and adds a footer. Stakeholder share pages and exported PDFs render with the PM's branding instead of PlanSight's.

**Why a PM cares.** Two reasons. First, it makes the share link look like it belongs to the PM's company, not a third-party tool — which raises stakeholder trust. Second, for consultants and freelancers, branded outputs are the difference between "I used a tool" and "I delivered a polished artifact." This is a classic SaaS upgrade lever: high perceived value, near-zero marginal cost to the platform.

**Build cost.** Low. Logo upload (Supabase Storage), color theming via CSS variables, footer text field.

---

### 9. Higher upload limits

**What it does.** Raises the file size cap (5 MB → 25 MB) and task count cap (5,000 → 25,000) for Pro users. These are **parsing and rendering** caps — what the MPP parser proxy will accept and what the workspace UI can render performantly. They are **not** AI-cost caps: the bounded AI payload (see `branding/plansight-ai/AI_PAYLOAD_SPEC.md`) keeps AI cost roughly flat regardless of plan size.

**Why a PM cares.** Most plans fit comfortably under the existing free-tier caps. The ones that don't — large enterprise programs, consolidated portfolio plans, multi-year roadmaps — belong to exactly the kind of PM most likely to pay. Higher limits are invisible to free users and meaningful to the segment with the highest willingness to pay.

**Build cost.** Trivial. A config change keyed off user tier.

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

$19/month sits in the band where PMs can expense the tool without manager approval, signals "real product" rather than side project, and prices below the per-seat cost of Asana, Monday, or MS Project Plan 1. Unit economics are healthy at this price: marginal cost per Pro user is roughly $1/month (mostly fixed infrastructure amortized across users, plus negligible Haiku token cost on cached AI analysis). The annual option ($190, ~17% discount) funds 6+ months of infrastructure in a single transaction, which matters when running solo.
