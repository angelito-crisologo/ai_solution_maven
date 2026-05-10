# Data display

Conventions for the parts of the product that show project data: the Gantt chart, the task table, RAG indicators, and metric cards. These are the screens where the brand earns or loses credibility with PMs.

## The split-pane workspace

The core product surface: hierarchical task table on the left, synchronized Gantt chart on the right. Both scroll vertically together; the timeline has its own horizontal scroll.

### Pane proportions

- Default split: **40% table / 60% Gantt** on desktop ≥1280px.
- Resizable via a drag handle in the divider — slate-200 1px line, cursor `col-resize`.
- Below 1024px: stack vertically, table on top, Gantt below with sticky day/week labels.

### The divider

```tsx
<div className="w-px bg-slate-200 hover:bg-cyan-400 cursor-col-resize transition-colors" />
```

## Task table

### Column conventions

| Column | Width | Alignment | Format |
|---|---|---|---|
| Outline number | 56px | left | mono, slate-500 |
| Task ID | 80px | left | mono `t-NNNN`, slate-500 |
| Task name | flex | left | sans, slate-900 (slate-100 on dark) |
| Duration | 80px | right | mono `5d` / `2w`, slate-700 |
| Start | 100px | right | mono ISO date `2026-05-10`, slate-700 |
| Finish | 100px | right | mono ISO date, slate-700 |
| % complete | 64px | right | mono `45%`, slate-700 |
| Predecessors | 120px | left | mono `t-0042, t-0047`, slate-500 |
| Status | 96px | left | RAG badge (see below) |

Task IDs use the format `t-NNNN` (zero-padded to 4 digits). All numeric columns are mono and right-aligned.

### Row hierarchy

- **Summary tasks** (parents with children): font-weight 600, slate-900.
- **Leaf tasks**: font-weight 400, slate-700.
- **Critical-path tasks**: subtle red text-red-700, OR a red left border indicator (1.5px) on the row. Don't double-encode.
- **Late tasks**: red status badge in the Status column. Don't recolor the whole row.
- **Selected row**: bg-cyan-50, left border 2px cyan-400.
- **Hover**: bg-slate-50.

### Indentation

8px per level. Don't use chevron icons larger than 12px. Use a small triangle (▸ collapsed, ▾ expanded) in slate-500.

### Header row

Sticky, slate-50 background, 1px slate-200 border-bottom, micro typography (uppercase 11px tracking-wider, slate-500). Sortable columns get an arrow indicator on hover.

```tsx
<thead className="bg-slate-50 sticky top-0 z-10">
  <tr className="border-b border-slate-200">
    <th className="px-3 h-9 text-left text-[11px] font-semibold tracking-wider uppercase text-slate-500">
      Task
    </th>
    {/* ... */}
  </tr>
</thead>
```

## Gantt chart

### Bar colors by status

| Status | Fill | Hover |
|---|---|---|
| On track | cyan-400 (`#22D3EE`) | cyan-500 |
| Watch | amber-400 (`#FBBF24`) | amber-500 |
| At risk / Late | red-400 (`#F87171`) | red-500 |
| Completed | emerald-400 (`#34D399`) | emerald-500 |
| Critical-path | cyan-400 with red-500 1.5px border | red-600 border |
| Future / not-started | cyan-400 at 55% opacity | cyan-400 at 75% |
| Summary task | slate-700 thin bar (4px tall, no rounded corners) | slate-800 |
| Milestone | rotated diamond, cyan-700 (`#0891B2`), 12×12 | cyan-800 |

Bar height: 16px for leaf tasks, 4px for summary tasks (intentionally thin — they aggregate, they don't dominate).

Bar corner radius: 3px on leaf tasks, 0 on summary bars.

### Progress fill

Show % complete as a darker overlay on the same bar — same hue, deeper stop.

```
[████████░░░░░░░░░░]  45%
 cyan-700  cyan-400
```

Don't use a separate striped pattern; it's too noisy at scale.

### Dependency lines

- Color: slate-400 (`#94A3B8`) at 60% opacity.
- Stroke width: 1px.
- Style: orthogonal (right-angle elbows), not curved.
- Arrowhead: small, 4×4px, slate-500 solid.
- On hover of either endpoint task: highlight the line in cyan-400, full opacity.

### Today line

Vertical line at the current date.
- Color: cyan-400 (`#22D3EE`)
- Stroke width: 1.5px
- Style: dashed (4 on, 4 off)
- Label: small "Today" pill at top, cyan-700 text on cyan-50 fill, mono date below it.

### Timeline header

Two-row header for hierarchical zoom:
- Top row: larger unit (Q1 2026 / Jan / Week 18) — slate-700 font-semibold text-xs.
- Bottom row: smaller unit (Jan / W18 / Mon Tue Wed) — slate-500 font-mono text-[11px].

Border-bottom: 1px slate-200.

### Zoom levels

| Level | Top row | Bottom row | Bar width per unit |
|---|---|---|---|
| Year | Year | Quarter | 80px / quarter |
| Quarter | Quarter | Month | 80px / month |
| Month | Month | Week | 60px / week |
| Week | Week | Day | 32px / day |
| Day | Day | Hour | 24px / hour (rare) |

Default to **Week** view on initial load.

## RAG indicator

The big-picture project health pill. Always one of three, computed by the deterministic engine.

```tsx
// On track
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
  <span className="w-2 h-2 rounded-full bg-emerald-500" />
  <span className="text-sm font-semibold text-emerald-800">On track</span>
</div>

// Watch
<div className="bg-amber-100 border-amber-200 ...">
  <span className="bg-amber-500 ..." />
  <span className="text-amber-800">Watch</span>
</div>

// At risk
<div className="bg-red-100 border-red-200 ...">
  <span className="bg-red-500 ..." />
  <span className="text-red-800">At risk</span>
</div>
```

Always include the dot — it's a redundant cue for color-blind users.

Place the RAG indicator in the page header, top-right of the workspace. Don't embed it inside cards; it's the global health signal.

## Metric cards

For dashboard summaries: tasks at risk, completion %, days remaining, etc.

```tsx
<div className="bg-slate-50 rounded-lg p-4">
  <p className="text-xs text-slate-500 leading-[18px]">Tasks at risk</p>
  <p className="text-3xl font-semibold leading-10 text-slate-900 mt-1 font-mono tabular-nums">12</p>
  <p className="text-xs text-slate-500 mt-1">
    of <span className="font-mono">147</span> total
  </p>
</div>
```

Key details:
- Background: slate-50, no border. Distinct from raised cards (white + border).
- Number: `text-3xl font-semibold font-mono tabular-nums`. Tabular-nums prevents jitter when the value updates.
- Label above, secondary value below. Both small and slate-500.
- Grid layout: `grid grid-cols-2 md:grid-cols-4 gap-3`.

For a number that's "good," accent it cyan-700. For "bad" (e.g. tasks at risk), accent it red-700. Use sparingly — the default slate-900 is right for most.

## Sparklines and trend indicators

Avoid adding sparklines unless the data has a clear time series (e.g. % complete over time). When you do:

- Stroke: 1.5px, cyan-700 on light bg.
- No fill area beneath the line. (No gradient flourishes.)
- No axis labels — they're called sparklines for a reason.
- Endpoint dot: 3px filled circle in cyan-700.

## Tooltips on bars

When hovering a Gantt bar:

- Background: white with 1px slate-200 border, rounded-md, custom shadow.
- Padding: 12px.
- Content order: task name (font-semibold), task ID (mono slate-500), then a 2-column grid of metadata: Start/Finish/Duration/% complete/Status.
- Position: above the bar, with a small caret pointing down.

## Empty states

For "no plans yet" / "no analysis run yet" / "no risks identified":

- Centered in the available space.
- Icon: 48×48 monogram-simplified or a relevant lucide icon, slate-300.
- Heading: text-lg slate-700 font-semibold.
- Body: text-sm slate-500, max-w-sm centered.
- Single primary CTA below.

Don't use illustrations. The brand is restrained.

## Loading states

For long operations (parsing, analysis):

- Indeterminate progress bar: 2px tall, slate-200 track, cyan-400 indicator that slides.
- Below: text-sm slate-700 describing the step ("Parsing plan...", "Computing critical path...").
- For analysis specifically, include the time hint: "Generating analysis (5–8s)...".

Skeleton loaders for the task table: slate-100 fills, animated pulse at 1.5s ease-in-out. Shape-of-data, not generic blocks.

## Don'ts

- ✗ No 3D bars, no isometric Gantt views.
- ✗ No animations on Gantt bar appearance — they appear instantly.
- ✗ No emojis as status (no 🟢🟡🔴 — use the actual badge components).
- ✗ No celebratory states ("All on track! 🎉") — match RAG calmly.
- ✗ No marketing-style number animations (no count-up from zero).
- ✗ No comparison with industry benchmarks unless you actually have benchmark data.

## Related docs

- `colors.md` — full RAG color spec including 800-stop text colors
- `typography.md` — tabular-nums, mono pairing
- `components.md` — base button/card patterns this builds on
