# Implementation Brief for Claude Code: Bounded AI Payload Architecture

## Context

We're implementing Phase 3 (AI analysis with Claude). Naive approach sends all tasks to Haiku, which breaks at ~1,500 tasks (context window) and scales cost linearly with plan size. Pro tier supports up to 25,000 tasks. We need AI cost and latency to be **flat across plan sizes**.

## The architectural rule

Claude's job is narrative and judgment, not data crunching. The deterministic insights engine already identifies what matters (critical path, late tasks, at-risk tasks, dependency bottlenecks, RAG status). Send Claude a **bounded, curated summary** built from those insights — never the raw task list.

## What to build

### 1. `buildAIPayload(plan, insights)` function

A pure function that takes the parsed plan plus the deterministic insights output and returns a fixed-shape, size-bounded payload. Target: **5,000–8,000 input tokens regardless of plan size** (100 tasks or 25,000 tasks produces roughly the same payload size).

Payload sections, each with hard caps:

- **Project metadata** — name, start/finish, total task count, % complete, RAG status, critical path duration
- **Health metrics** — counts of late / at-risk / critical / lagging tasks, dependency bottleneck count, overall risk summary
- **Key tasks (curated)** — max 20 critical-path tasks, max 20 late tasks, max 20 at-risk tasks, max 15 milestones, max 10 dependency bottlenecks (tasks blocking ≥3 successors). Each task: ID, name, dates, status flags, key predecessors only.
- **Upcoming work** — tasks starting or due in next 30 days, capped at 30 entries
- **Structure summary** — WBS outline levels 1–3 only (summary tasks, not leaves), capped at 50 entries
- **Resource summary** — top 10 resources by allocation, with overallocation flags

Sort each capped section by relevance (e.g., critical tasks by total float ascending, late tasks by slip days descending) so the cap removes the *least* interesting items first.

### 2. Token budget verification

Add a unit test that runs `buildAIPayload` against three representative fixtures (small ~100 tasks, medium ~1,500 tasks, large ~10,000 tasks) and asserts the resulting payload is between 3k and 10k tokens. Use Anthropic's token counting endpoint or a 4-chars-per-token approximation. Fail the build if any fixture exceeds 10k tokens — that's the safety net.

### 3. Two-call structure stays

Keep the existing findings → recommendations split. First call gets the full payload; second call gets the findings output plus a minimal reference to the original payload. Both calls use the same bounded payload contract.

### 4. Prompt caching

With a stable payload shape, structure the API calls so the system prompt (analysis framework, tool schema, output rubric) is cached for the 90% discount. Variable plan content sits in a separate cacheable block. The Anthropic SDK supports `cache_control: { type: "ephemeral" }` on content blocks — use it on the system prompt and the payload header.

### 5. Content-hash caching unchanged

The existing response cache (keyed by hash of plan content) still applies. A user re-viewing the same analysis never re-burns tokens regardless of payload size.

## What to remove or change

- **Remove** any code path that serializes the full task array into the AI prompt
- **Remove** the "under a cent per analysis" cost assumption from comments and docs — real cost is 3–8¢ per first generation
- **Decouple** the upload size cap (25,000 tasks for Pro) from the AI analysis path. The cap is a parsing/rendering limit. AI cost is now flat regardless.

## Acceptance criteria

1. `buildAIPayload` produces 3k–10k tokens for any plan from 50 to 25,000 tasks
2. End-to-end AI analysis completes in 5–8s for a 25,000-task plan (same as a 500-task plan)
3. First-generation cost is under 10¢ measured against representative plans
4. Cached re-view cost is effectively zero (no Claude API call)
5. Unit tests cover the payload caps on each section (each cap is hit and respected when input exceeds it)
6. The findings output references task IDs that exist in the original plan (sanity check that the curated payload preserved the IDs Claude needs)

## Docs to update

- `PRODUCT.md` — replace "under a cent per analysis" with real measured cost
- `PLANSIGHT_PRO_FEATURES.md` — clarify that Pro upload limits are parsing/rendering caps, not AI caps
- Add a new section to the insights spec (or a new doc, `AI_PAYLOAD_SPEC.md`) defining the bounded payload contract, the per-section caps, and the sort orders

## Out of scope for this change

- Streaming responses (defer)
- Per-task "Explain this task" feature (separate, smaller payload pattern — covered in Pro v1)
- Multi-plan comparison / version diff (Pro v1.1)

## One thing to watch

Make sure the curated payload includes enough context for Claude to reference task IDs *not* in the curated list when describing dependencies. E.g., "Task 47 (Database Migration) is blocking three downstream tasks" — if those downstream tasks were trimmed out of the payload, Claude can still describe the blocking relationship using just the IDs and a count. Test for this explicitly.
