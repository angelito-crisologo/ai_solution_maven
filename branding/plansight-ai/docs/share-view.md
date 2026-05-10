# Share view

The public read-only page stakeholders see when a PM shares a link. **This is a marketing surface as well as a product surface** — it should look polished, lightly branded, and good enough that a stakeholder asks "what tool is this?"

## What's different from the in-product view

- No login, no signup prompt, no nav chrome.
- Slightly larger, more breathable layout — stakeholders aren't power users.
- Less PMP jargon in labels (e.g. "Behind schedule" instead of "Negative float").
- AI summary is the **first thing** above the workspace, not buried in a sidebar.
- Subtle "View on PlanSight" badge in the corner — the viral hook.

## Layout

```
┌────────────────────────────────────────────────────┐
│  [PlanSight wordmark]              [View on PS] →  │  ← compact header
├────────────────────────────────────────────────────┤
│                                                    │
│  Project: <Name from .mpp>                         │  ← title + RAG
│  <Project narrative summary, 2–3 sentences>        │
│  [On track 🟢]   <metrics row>                      │
│                                                    │
│  Risks                                             │  ← AI risks card
│  ┌──────────────────────────────────────────────┐  │
│  │ • Risk 1 (refs t-0042, t-0089)               │  │
│  │ • Risk 2 (refs t-0014)                       │  │
│  │ • Risk 3 ...                                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Plan                                              │  ← workspace below
│  ┌──────────────────────┬───────────────────────┐  │
│  │  task table          │  Gantt                │  │
│  │                      │                       │  │
│  └──────────────────────┴───────────────────────┘  │
│                                                    │
├────────────────────────────────────────────────────┤
│  Built on PlanSight AI · Your data isn't training… │  ← footer
└────────────────────────────────────────────────────┘
```

## Header

- Background: white (or deep slate in dark mode — both viable; default to light for stakeholder familiarity).
- Height: 56px.
- Left: primary horizontal lockup, 32px tall, linking to https://plansightai.com (marketing site).
- Right: a "View on PlanSight" pill button (ghost style, cyan-700 text, opens the marketing site in a new tab).
- Border-bottom: 1px slate-200.

```tsx
<header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between">
  <a href="https://plansightai.com">
    <Image src="/brand/plansight-logo-primary.svg" alt="PlanSight AI" width={140} height={28} />
  </a>
  <a
    href="https://plansightai.com"
    target="_blank"
    rel="noopener"
    className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
  >
    View on PlanSight →
  </a>
</header>
```

## Project header section

Generous padding (`py-12 px-6`), constrained max-width (`max-w-6xl mx-auto`).

```tsx
<section className="max-w-6xl mx-auto px-6 py-12">
  <div className="flex items-start justify-between gap-6 flex-wrap">
    <div>
      <p className="text-xs font-semibold tracking-wider uppercase text-cyan-700">
        Project plan
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {planName}
      </h1>
      <p className="mt-3 text-base text-slate-700 max-w-2xl leading-7">
        {aiNarrativeSummary}
      </p>
    </div>
    <RagIndicator status={ragStatus} />
  </div>

  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
    <MetricCard label="Total tasks" value={totalTasks} />
    <MetricCard label="At risk" value={atRiskCount} accent={atRiskCount > 0 ? "red" : "default"} />
    <MetricCard label="On critical path" value={criticalPathCount} />
    <MetricCard label="Days remaining" value={daysRemaining} />
  </div>
</section>
```

## Risks card

The AI-generated risks list, presented as the headline insight. Each risk references specific task IDs in monospace.

```tsx
<section className="max-w-6xl mx-auto px-6 pb-12">
  <h2 className="text-lg font-semibold text-slate-900 mb-4">Risks identified</h2>

  <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
    {risks.map(risk => (
      <div key={risk.id} className="p-5 flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-900 leading-6">{risk.description}</p>
          {risk.taskRefs.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              References:{" "}
              {risk.taskRefs.map(id => (
                <code key={id} className="font-mono bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                  {id}
                </code>
              ))}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
</section>
```

If there are no risks, show a green-tinted empty state: "No risks identified. The plan looks healthy."

## Workspace (read-only Gantt + table)

Same patterns as `data-display.md`, with a few stakeholder-mode tweaks:

- All editing affordances hidden (no row hover handles, no "+" buttons, no kebab menus).
- Filter / search bar above the workspace is OK — stakeholders may want to find a specific task.
- "Critical path" toggle is visible and prominent — it's the most useful filter for non-PMs.
- Default zoom: **Week**.
- Default scroll position: today's date centered.

## Footer

A quiet trust strip — no marketing pitch, just a calm signal that PlanSight is professional.

```tsx
<footer className="border-t border-slate-200 py-8 px-6 mt-16">
  <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
    <div className="flex items-center gap-3">
      <Image src="/brand/plansight-monogram-light.svg" alt="" width={20} height={20} />
      <p className="text-xs text-slate-500">
        Built on <a href="https://plansightai.com" className="text-cyan-700 hover:text-cyan-800 font-semibold">PlanSight AI</a> · Your data isn't training data
      </p>
    </div>
    <p className="text-xs text-slate-400 font-mono">
      Last updated {lastUpdatedISO}
    </p>
  </div>
</footer>
```

## OG / social card metadata

When the share link is pasted into Slack, email, or social, the unfurl should read well. Set OG meta on every share page:

```tsx
<head>
  <title>{planName} — PlanSight AI</title>
  <meta name="description" content={aiNarrativeSummary.slice(0, 160)} />
  <meta property="og:title" content={`${planName} — PlanSight AI`} />
  <meta property="og:description" content={aiNarrativeSummary.slice(0, 160)} />
  <meta property="og:image" content={`/api/og?planId=${planId}`} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
```

The `/api/og` route should generate a 1200×630 image with: stacked logo top-left, plan name large, RAG indicator, and 4 metrics. Match the brand exactly — not a generic auto-card.

## Robots and indexing

Share pages should **not** be indexed by search engines (the URL is unguessable on purpose, and indexing would defeat the privacy model).

```tsx
<meta name="robots" content="noindex, nofollow" />
```

## Mobile

Stack everything vertically. Workspace becomes: filter bar, RAG, metrics, risks, then a tabbed view of "Tasks | Gantt" since both don't fit comfortably side by side. Default to "Tasks" tab on mobile — easier to scan.

## Don'ts

- ✗ No "Sign up to see more" gating. The whole point of the share view is frictionless access.
- ✗ No popups, no chat widgets, no "Made with [tool] 💚" cookie-cutter footers.
- ✗ No tracking pixels for ads (analytics OK, but minimal).
- ✗ No upsell to "claim this plan" if the viewer is signed in — that goes elsewhere.
- ✗ No "stakeholder mode" theme switcher. There is one share view.

## Related docs

- `data-display.md` — Gantt and table conventions, applied here
- `voice.md` — narrative tone, especially for the AI summary
- `logo.md` — wordmark sizing for the header
