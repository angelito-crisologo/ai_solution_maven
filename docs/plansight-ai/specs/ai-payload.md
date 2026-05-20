# PlanSight AI — Bounded AI Payload Specification

This is the formal contract for the JSON object sent to Claude for AI analysis.

The whole point: **AI cost and latency are constant regardless of plan size.** A 100-task plan and a 25,000-task plan produce roughly the same payload size, the same number of tokens, and the same per-generation cost.

Design context lives in [`../archive/AI_PAYLOAD_IMPLEMENTATION_BRIEF.md`](../archive/AI_PAYLOAD_IMPLEMENTATION_BRIEF.md) (the brief that drove this work). This document is the contract.

**Model:** `claude-haiku-4-5-20251001` for all paths (regenerate analysis, weekly snapshot, explain task). Set in `lib/plansight-ai/ai.ts`.

---

## Where it lives

```
lib/plansight-ai/ai-payload/
├── types.ts              — AIPayload type + PAYLOAD_CAPS constants
├── build-ai-payload.ts   — pure function buildAIPayload(plan, insights, opts)
├── token-estimate.ts     — estimatePayloadTokens(payload) heuristic
└── __tests__/
    ├── fixtures.ts                 — seeded plan generator (100 / 1.5k / 10k tasks)
    └── build-ai-payload.test.ts    — 22 contract tests
```

The builder is consumed by `lib/plansight-ai/ai.ts:generateAiAnalysis()`.

---

---

## Architectural rule

Claude's job is **narrative and judgment**, not data crunching. The deterministic insights engine (`lib/plansight-ai/analysis.ts`) identifies *what matters* (critical path, late tasks, at-risk tasks, RAG status, bottlenecks). The payload builder packages a bounded summary of those findings plus four additional sections (milestones, upcoming work, WBS structure, resources) drawn directly from the parsed plan. Claude generates the summary, risks, and recommendations over that summary.

**The raw task array is never sent to Claude.** This is the architectural invariant. If the payload size ever scales with plan size, we have a bug.

---

## Top-level shape

```ts
type AIPayload = {
  meta: AIPayloadMeta;
  health: AIPayloadHealth;
  criticalTasks: AIPayloadTask[];      // ≤ 20
  lateTasks: AIPayloadTask[];           // ≤ 20
  atRiskTasks: AIPayloadTask[];         // ≤ 20
  milestones: AIPayloadTask[];          // ≤ 15
  bottlenecks: AIPayloadTask[];         // ≤ 10
  upcoming: AIPayloadTask[];            // ≤ 30, next 30 days
  structure: AIPayloadStructureNode[];  // ≤ 50, WBS levels 1–3
  resources: AIPayloadResource[];       // ≤ 10
  referencedTaskIds: number[];
};
```

Caps live as the `PAYLOAD_CAPS` constant in `types.ts` and are exercised by the test suite. To change a cap, change it in one place; the tests will tell you if the new cap pushes the payload over the 10k-token ceiling.

---

## meta

Project-level identity and headline state. One object, no array.

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Plan title (carried straight from the parsed plan). |
| `startDate` | `string \| null` | ISO date (`YYYY-MM-DD`). |
| `finishDate` | `string \| null` | ISO date. |
| `totalTasks` | `number` | All tasks including summaries (`plan.tasks.length`). |
| `percentComplete` | `number \| null` | 0–100, rounded. Ratio of leaf tasks with `percentComplete >= 100`. `null` when there are no leaves. |
| `ragStatus` | `"green" \| "amber" \| "red"` | From `insights.summary.healthStatus`. |
| `criticalPathDurationDays` | `number \| null` | Sum of `durationDays` along the longest critical path. `null` in approximate mode (no zero-slack path to compute). |
| `mode` | `"cpm" \| "approximate"` | `"approximate"` when no dependencies are declared on any task. |

---

## health

Counts and a one-liner. One object, no array.

| Field | Type | Notes |
|---|---|---|
| `lateCount` | `number` | Leaf tasks past finish date and < 100% complete. |
| `atRiskCount` | `number` | Leaf tasks due within 14 days and < 100% complete. |
| `criticalCount` | `number` | Critical / potentially-critical task count from insights. |
| `laggingCount` | `number` | Leaf tasks behind expected linear progress for their date range. |
| `bottleneckCount` | `number` | Tasks blocking ≥ 2 downstream tasks. |
| `riskSummary` | `string` | One-line stamp like `"5 late, 12 at-risk, 3 bottlenecks"` — or `"no active risks detected"` if all counts are zero. |

---

## Task sections

Each task in the per-task sections (`criticalTasks`, `lateTasks`, `atRiskTasks`, `milestones`, `bottlenecks`, `upcoming`) follows the same per-entry shape:

```ts
type AIPayloadTask = {
  id: number;
  name: string;
  start: string | null;     // ISO date
  finish: string | null;
  durationDays: number;     // 0 for milestones
  percentComplete: number | null;
  flags: {
    critical: boolean;
    late: boolean;
    atRisk: boolean;
    milestone: boolean;
    bottleneck: boolean;
  };
  predecessorIds: number[]; // ≤ 5, deduped, in declaration order
};
```

Flags are computed once from insight ID-sets and applied to every task entry across all sections, so the same task in `lateTasks` and `atRiskTasks` carries identical flags.

### criticalTasks (cap 20)

- **CPM mode** (`meta.mode === "cpm"`): sourced from `insights.criticalTasks` (zero-slack tasks). Sorted by `durationDays` desc, then `id` asc. All slack is by definition 0 in CPM mode, so duration is the meaningful tiebreaker.
- **Approximate mode**: sourced from `insights.potentialCriticalTasks` (heuristic critical set used when no dependencies are present). Sorted by `daysFromProjectEnd` asc, then `durationDays` desc, then `id` asc.

### lateTasks (cap 20)

Tasks past their finish date and not 100% complete. Sorted by `daysLate` desc, then `id` asc. Insights' own sort matches this; we pass it through.

### atRiskTasks (cap 20)

Tasks finishing within the next 14 days and < 100% complete. Sorted by `daysRemaining` asc, then `id` asc.

### milestones (cap 15)

Plan tasks where `milestone === true`. Sorted: critical-flagged first, then by `finish` date asc, then `id` asc. Duration is 0; `start` is `null` for milestones.

### bottlenecks (cap 10)

Tasks blocking ≥ 2 downstream tasks. Sorted by `dependentTaskCount` desc, then `id` asc. Insights' own sort.

### upcoming (cap 30, next 30 days)

Leaf tasks (not summaries) with `start` OR `finish` falling within `[today, today + 30 days]` (UTC midnight comparisons). Sorted by earliest of (`start`, `finish`) asc, then `id` asc. The 30-day window is `UPCOMING_WINDOW_DAYS` in `types.ts`.

---

## structure (cap 50)

WBS summary nodes at outline levels 1–3 only. Leaf tasks are excluded — they appear elsewhere via the task sections.

```ts
type AIPayloadStructureNode = {
  id: number;
  outlineNumber: string | null;
  level: number;            // 1, 2, or 3
  name: string;
  leafTaskCount: number;    // descendant leaves under this summary
};
```

Sorted by `outlineNumber` (locale-aware numeric comparison: "1.10" sorts after "1.2"), then `id` asc.

`leafTaskCount` is computed via a single memoized post-order traversal in `buildLeafCountByTaskId()`. O(V) total.

---

## resources (cap 10)

Resources aggregated from `task.resourceNames` across all leaf tasks (summaries don't count).

```ts
type AIPayloadResource = {
  name: string;
  taskCount: number;
  overallocated: boolean;
};
```

- `taskCount`: number of leaf tasks the resource is assigned to.
- `overallocated`: `true` when the resource is assigned to **2+ currently-active tasks**, where active = today between `start` and `finish` AND `percentComplete < 100`. This is a rough proxy for "this person is stretched right now"; we don't have per-resource available-hours data to do a true allocation check.

Sorted by `taskCount` desc, then `name` asc.

---

## referencedTaskIds

```ts
type AIPayload = { /* ... */ referencedTaskIds: number[] };
```

Sorted-ascending array of every distinct task ID that appears as a `predecessorId` across all included task entries — **including predecessors that themselves got trimmed by their section's cap**.

This is the mechanism that lets Claude name task IDs by number even when the task itself isn't in the included sections. Example: `criticalTasks` may include Task 47 with `predecessorIds: [44, 45]`. Even if Task 44 isn't in any included section, its ID appears in `referencedTaskIds`. Claude can then write "Task 44 (a predecessor of the critical-path Task 47) is …" without us needing to pre-include every blocked task.

---

## Token budget

The architectural target is **3,000–10,000 input tokens** for any plan from 50 to 25,000 tasks. Estimated via Anthropic's 4-chars-per-token heuristic on compact (`JSON.stringify`, no pretty-print) serialization.

Measured against the seeded fixture generator:

| Fixture | Tokens (est.) |
|---|---|
| 100 tasks | ~1.2k |
| 1,500 tasks | ~3.5k |
| 10,000 tasks | ~4.5k |

We're ~5,000 tokens below the ceiling at the largest fixture, which leaves headroom to widen caps in a future iteration if Claude wants more context.

A dev-mode `console.warn` fires in `generateAiAnalysis()` if a real payload exceeds 9k tokens — early signal that caps need tightening. In production the test suite + the per-section caps are the safety net.

---

## Prompt caching

The v2 Claude call structures the request body to maximize cache hits:

```
system: [
  { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
  { type: "text", text: PAYLOAD_SCHEMA_HEADER, cache_control: { type: "ephemeral" } }
]
tools: [FINDINGS_TOOL]   // auto-included in the cached prefix
messages: [
  { role: "user", content: "Project plan payload (JSON):\n\n{...}\n\n..." }
]
```

- The **role/style prompt** and the **PAYLOAD_SCHEMA_HEADER** are stable across all requests — both cached.
- Anthropic includes the **tool definitions** in the cached prefix when at least one system block carries `cache_control`.
- The **user message body** (the actual payload JSON) varies per plan — never cached.

The 5-minute ephemeral cache TTL means cache hits between back-to-back generations within the same session, and between the findings → recommendations calls of the same generation.

---

## Decoupling from upload caps

Tier-based upload caps live in `lib/plansight-ai/limits.ts`:

| Tier | File size | Task count |
|---|---|---|
| Free | 5 MB | 5,000 |
| Pro | 25 MB | 25,000 |

These are **parsing and rendering** caps — what the MPP parser proxy will accept and what the workspace UI can render performantly. They are **not** AI-cost caps. AI cost under v2 is plan-size-independent: a 25,000-task plan costs roughly the same to analyze as a 100-task plan.

If we ever raise the Pro cap beyond 25,000 tasks, the decision should be about parsing throughput and rendering performance — not about AI affordability.

---

---

## See also

- [`../archive/AI_PAYLOAD_IMPLEMENTATION_BRIEF.md`](../archive/AI_PAYLOAD_IMPLEMENTATION_BRIEF.md) — the design brief that drove this work.
- [`insights.md`](insights.md) — the deterministic insights engine the payload draws from.
- [`abuse-mitigation.md`](abuse-mitigation.md) — `ai_usage_log` contract for measuring real-world cost.
- `lib/plansight-ai/ai-payload/types.ts` — the runtime type contract.
- `lib/plansight-ai/ai-payload/__tests__/build-ai-payload.test.ts` — 22 contract tests.
