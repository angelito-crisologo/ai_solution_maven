# PlanSight AI — "Explain this task" abuse mitigation approach

**Feature:** "Explain this task" inline AI (Pro tier)
**Scope:** Authenticated Pro users only. Not available on stakeholder share pages.
**Goal:** Bound cost exposure within $19/mo unit economics while capturing usage data for future tuning.

---

## Threat model

With the share-page exposure removed, the threat model is bounded to authenticated Pro accounts.

| Vector | Likelihood | Mitigated by |
|---|---|---|
| Pro user over-clicking out of curiosity | High | Cache + rate limit |
| Deliberate abuse from inside a paying account | Low | Rate limit + spend alert |

Both vectors require a logged-in, paying Pro account. The endpoint is not exposed on stakeholder share pages, which eliminates the largest abuse vector (unbounded stakeholder clicks on shared links).

---

## Mitigation stack

### Layer 1: Per-task caching

Responses cached by `(plan_content_hash, task_id)`. Generated once, served free on every subsequent click. Cache invalidates naturally on plan re-upload (new content hash = new cache scope).

This is the single biggest cost lever — most clicks become cache hits, especially as a plan ages and users revisit familiar tasks.

### Layer 2: Server-side authentication

The endpoint requires a valid session and verifies the user owns the plan. No client-side trust.

### Layer 3: Per-user rate limits (across all their plans)

The rate limit applies at the user level, not per-plan. Per-plan limits would scale with plan count (unlimited on Pro), making the cap meaningless under abuse.

| Limit | Value | Behavior |
|---|---|---|
| Per hour | 30 | Hard cap — block with friendly message |
| Per day, soft cap | 100 | Inline reminder: "You've explained a lot today. Continue?" Dismissable, doesn't block |
| Per day, hard cap | 200 | Hard cap — block with friendly message |

**Why the soft cap at 100/day matters.** It's not a block — it's a nudge that prompts the user to be intentional about continuing. Most users will dismiss it and carry on; abusers and runaway scripts hit it as a signal that something unusual is happening. The hard cap at 200 is the real ceiling.

**Hard cap messaging.** When the hard cap is hit, the block message should be polite and include a contact line: "You've used today's allowance. Come back tomorrow, or [contact me] if your workflow needs more." That gives a direct line to power users — the most valuable feedback channel for tuning limits later.

### Layer 4: Account-level spend alert

Email the operator when any account exceeds $3/mo cumulative Haiku spend across all AI features. Rarely fires — when it does, investigate.

---

## Worst-case economics

At $0.003 per uncached call (Haiku 4.5, ~1.2K input + ~300 output tokens):

| Scenario | Cost |
|---|---|
| Typical Pro user (5–20 explains per plan, mostly cached) | $0.50–$2/mo |
| Power user (regular cross-plan use, hits soft cap occasionally) | $3–8/mo |
| Single account sustained at hard daily cap | $0.60/day, $18/mo |

Comfortable margin on $19/mo even at the ceiling. Caching makes the real number a fraction of the ceiling for legitimate use.

The rate limits exist to bound velocity (giving monitoring time to react), not to function as a cost cap — that's the spend alert's job.

---

## Data capture for usage analysis

A dedicated Supabase table logs every AI call across all features. Add this on day one — cheap now, impossible to retrofit, and the single most important investment for tuning the system later.

### Schema: `ai_usage_log`

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | Primary key |
| `created_at` | timestamptz | When the call happened |
| `user_id` | uuid | Account that triggered it (FK to `auth.users`) |
| `plan_id` | uuid | Which plan it was for (FK to `plans`) |
| `feature` | text | `explain_task`, `regenerate_analysis`, `weekly_snapshot`, etc. |
| `task_id` | text | For per-task features; null otherwise |
| `cache_hit` | boolean | True if served from cache, false if real Haiku call |
| `model` | text | `claude-haiku-4-5` (in case you swap models later) |
| `input_tokens` | int | From Anthropic response |
| `output_tokens` | int | From Anthropic response |
| `cache_read_tokens` | int | From prompt-caching metadata |
| `cache_write_tokens` | int | From prompt-caching metadata |
| `cost_usd` | numeric | Computed from token counts and current pricing |
| `latency_ms` | int | How long the call took |
| `rate_limited` | boolean | True if the user hit a rate limit on this attempt |
| `soft_cap_shown` | boolean | True if the 100/day reminder was triggered |
| `soft_cap_dismissed` | boolean | True if user continued past the soft cap |
| `error` | text | Null if success, error code/message if failed |

### Queries this enables (run monthly)

- Distribution of `explain_task` calls per user (P50, P75, P95, P99) — tells you whether 30/hr, 100/day soft, 200/day hard are well-calibrated
- Soft cap behavior — how often is it shown, how often is it dismissed vs heeded? Tells you whether the nudge is doing useful work or just adding friction
- Cache hit rate per feature — if >70%, caching is working; if <30%, investigate
- Cost per Pro user, ranked — sanity-checks unit economics and surfaces outliers
- Hard rate-limit hit frequency — if real users hit the 200/day cap often, raise it; if no one does, leave it
- Cost per feature — tells you which Pro features drive the Haiku bill
- Latency P95 per feature — slow features get abandoned, which changes cost-per-engaged-user math

### Tuning loop after launch

1. **First 4 weeks:** watch the data, don't change anything. Establish a baseline.
2. **After 4 weeks:** check if any legitimate user has hit the 200/day hard cap. If yes, look at what they were doing — is it abuse or a workflow you didn't anticipate? Adjust.
3. **After 8 weeks:** check P95 explains/day. If P95 is well under 100 (soft cap), you have headroom to tighten. If P95 is approaching 100, the soft cap is doing real work — leave it.
4. **After 12 weeks:** decide whether the structure is right. If a meaningful slice of users routinely cross the soft cap, that's signal toward either raising limits or introducing a higher tier. If almost no one crosses it, leave it alone — your power users are happy.

---

## What to skip

Overkill for the threat model and current scale:

- CAPTCHA
- IP-based rate limits
- Prompt-injection-specific filtering beyond standard input sanitization
- Real-time anomaly detection
- Metered overage billing

The logging table gives the visibility to revisit any of these decisions with data if anything changes.

---

## Pre-launch checklist

- [ ] Per-task cache implemented and keyed by `(plan_content_hash, task_id)`
- [ ] Server-side auth + plan ownership check on the endpoint
- [ ] Hourly hard limit enforced server-side (30/hr per user, across all plans)
- [ ] Daily soft cap reminder triggers at 100/day (UI nudge, dismissable, doesn't block)
- [ ] Daily hard limit enforced server-side (200/day per user, across all plans)
- [ ] Block message at hard caps includes a contact line for power-user feedback
- [ ] `ai_usage_log` table created with the schema above
- [ ] Every AI call writes a row to `ai_usage_log`, including cache hits (with `cache_hit = true` and `cost_usd = 0`)
- [ ] Account spend alert configured to email the operator at $3/mo cumulative per user
- [ ] One internal query saved: "top 10 users by AI cost this month"
- [ ] One internal query saved: "soft cap show vs dismiss rate, last 30 days"

The last two items are the discipline that keeps this system useful over time. The logging table is only valuable if it's queried; saving a couple of starting queries means it actually gets looked at within the first month.

---

## Implementation notes

- **Rate limit storage:** a counter table in Supabase keyed by `(user_id, window_start)` works fine at current scale. Reset cadence: hourly counter resets on the hour, daily counter resets at user's local midnight (use the same `week_start_day`-style preference if you have one, otherwise UTC midnight is acceptable).
- **Soft cap UI:** the 100/day nudge should be a modal or inline banner, not a toast. The user should have to dismiss it actively, so the choice to continue is conscious. Track the dismissal in `soft_cap_dismissed` for the analytics queries.
- **Cache key derivation:** the plan content hash should be stable across re-saves that don't change task data. If the hash changes on every save regardless of content changes, the cache will rarely hit.
- **Cost calculation:** compute `cost_usd` at the time of the call using current Haiku pricing constants in code. Don't try to compute it from a stored pricing table — pricing changes are rare and a code constant is simpler.
- **Cache hits still log:** important. Without cache-hit rows in the log, you can't compute the cache hit rate, which is the single most important metric for cost optimization.

---

## Acceptance criteria

1. An authenticated Pro user can trigger "Explain this task" on any task in a plan they own.
2. Unauthenticated requests to the endpoint return 401.
3. Requests for plans the user does not own return 403.
4. The 31st call within a rolling hour returns a rate-limit response with a friendly message.
5. The 101st call within a calendar day shows a soft-cap nudge in the UI; the user can dismiss and continue.
6. The 201st call within a calendar day returns a hard-cap response with a friendly message and a contact line.
7. Every successful or rate-limited call writes a row to `ai_usage_log` with all schema fields populated as appropriate.
8. Cache hits write a row to `ai_usage_log` with `cache_hit = true`, `cost_usd = 0`, and token counts of 0.
9. The operator receives an email alert when any user's monthly cumulative `cost_usd` exceeds $3.
