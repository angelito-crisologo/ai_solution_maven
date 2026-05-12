# PlanSight AI — Telemetry Specification

This document defines the telemetry the application records about its own
behavior. It is a contract about **what we store**, **what we do not**,
and **how the writes interact with user-facing flows**.

Design intent for the v1 surface (upload telemetry) lives in
`UPLOAD_TELEMETRY_IMPLEMENTATION_BRIEF.md`. This document is the
contract.

---

## Scope (v1)

Upload telemetry on the `.mpp` import pipeline. Backed by the
`public.upload_events` table. Captured at `POST /api/plansight/import-mpp`.

Out of scope (deferred to later surfaces):

- Save-stage telemetry at `POST /api/plansight/share`. The
  `upload_events` table reserves `share_id`, `db_write_duration_ms`,
  and the `db_write` failure stage for when we extend instrumentation
  there; v1 leaves them null.
- Share-link view tracking.
- Funnel analytics (anonymous → signed-up → paid).
- Alerting on failure-rate spikes (defer until a baseline exists).
- Customer-facing analytics.

AI usage telemetry is **already** captured in a separate table
(`public.ai_usage_log`, Phase 9). Don't conflate the two: `ai_usage_log`
is per Claude call, `upload_events` is per .mpp upload attempt.

---

## Architectural rule

**Telemetry writes are fire-and-forget.** A failed telemetry write must
never block, delay, or break a user's upload. The user-facing response
is returned first; the row is recorded after. The helper catches
every error internally and never throws.

In code this means every call site looks like:

```ts
void recordUploadEvent(event);
return NextResponse.json(body, { status });
```

If you find yourself wanting to `await` the telemetry write, you're
holding it wrong.

---

## `public.upload_events` schema

```sql
create table public.upload_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Who
  user_id uuid null references auth.users(id) on delete set null,
  user_tier text not null check (user_tier in ('anon', 'free', 'pro')),
  user_agent text null,

  -- What
  file_size_bytes integer not null,
  file_name_hash text null,
  mpp_version text null,
  has_resources boolean null,
  has_baselines boolean null,
  task_count integer null,

  -- Pipeline timing (milliseconds)
  upload_duration_ms integer null,
  parser_queue_ms integer null,
  parser_duration_ms integer null,
  db_write_duration_ms integer null,
  total_duration_ms integer not null,

  -- Outcome
  success boolean not null,
  failure_stage text null check (failure_stage in (
    'upload', 'validation', 'parser_timeout',
    'parser_error', 'db_write', 'unknown'
  )),
  failure_message text null,

  -- Reference (set when /share write succeeds; null in v1)
  share_id text null references public.plans(share_id) on delete set null
);
```

Three indexes:

- `(created_at desc)` — every dashboard query orders by this.
- `(success, created_at desc)` — for "% failures over time" queries.
- `(failure_stage) where success = false` — partial index used by the
  failure-breakdown chart.

### RLS posture

```sql
alter table public.upload_events enable row level security;
-- "no client access" policy: using (false) with check (false).
-- Service-role bypasses RLS for the route's inserts.
```

Anon and authenticated keys get nothing. If we ever expose an admin
dashboard that reads `upload_events`, it queries with the service-role
key from a server component — never from the browser.

---

## Column semantics

### Who

| Column | Notes |
|---|---|
| `user_id` | Supabase auth UUID, or null for anonymous uploads. ON DELETE SET NULL so deleting a user doesn't lose their historical telemetry. |
| `user_tier` | `"anon"` when no session was present at request time; `"free"` / `"pro"` from `product_activations.tier`. |
| `user_agent` | Up to 500 chars. Trimmed at write time. |

### What

| Column | Notes |
|---|---|
| `file_size_bytes` | Bytes received in the multipart upload. Always set. |
| `file_name_hash` | SHA-256 hex of the original filename. Lets us detect retry behavior without storing the filename itself. Null when filename couldn't be read. |
| `mpp_version` | v1: always null. The Render MPXJ parser doesn't surface this yet. Reserved for when it does. |
| `has_resources` | v1: always null. Reserved. |
| `has_baselines` | v1: always null. Reserved. |
| `task_count` | Set only on successful parse. Null when parse failed before completion. |

### Pipeline timing

All in milliseconds. All nullable except `total_duration_ms`. Each
field measures one segment of the upload pipeline.

| Column | What it measures |
|---|---|
| `upload_duration_ms` | Time from request receipt to extracting the File from the multipart body. |
| `parser_queue_ms` | Time the parser spent queueing / cold-starting before producing first byte. **v1: always null** — the parser doesn't expose `X-Parser-Queue-Ms` yet. Cold-starts can be inferred from `parser_duration_ms > 8000` in low-traffic periods (per the brief). |
| `parser_duration_ms` | Wall time around the parser fetch call. |
| `db_write_duration_ms` | Supabase save time. **v1: always null** — we instrument only import-mpp; the /share-route follow-up populates this. |
| `total_duration_ms` | End-to-end from POST handler entry to response. Always set. |

### Outcome

| Column | Notes |
|---|---|
| `success` | `true` for 2xx responses, `false` for everything else. |
| `failure_stage` | One of the six values below when `success = false`. Always null when `success = true`. |
| `failure_message` | Sanitized — see "What we never store" below. Max 300 chars. |

---

## Failure-stage taxonomy

| Stage | What triggers it |
|---|---|
| `upload` | Couldn't extract the file from the request body. Multipart parse failure, missing file field. |
| `validation` | The file was received but failed a pre-parse check: size cap, extension check, magic-bytes check. |
| `parser_timeout` | The 25s AbortController fired before the parser service responded. |
| `parser_error` | Parser returned a 4xx/5xx, returned a malformed body, or the fetch itself errored (ECONNREFUSED, fetch failed). |
| `db_write` | Supabase save failed. v1: never populated; reserved for the /share-route follow-up. |
| `unknown` | Caught something the classifier didn't recognize. Row still gets written. |

The stages are CHECK-constrained at the database level — adding a new
stage requires a migration.

---

## What we never store

- **Original filenames.** Hash only.
- **File content samples or task names.** The parsed JSON never reaches
  this table.
- **IP addresses.** We use `user_agent` for client diagnostics only.
- **Anything that re-identifies an anonymous user across sessions.**
- **Unsanitized error messages.** `sanitizeError()` strips:
  - absolute file paths (Unix and Windows)
  - bearer tokens, JWTs
  - request headers (`authorization`, `cookie`, `set-cookie`, `x-api-key`)
  - secret-bearing query params (`password=`, `api_key=`, `token=`)
  - `process.env.X` references
  - multi-line stack traces (keeps only the first line)
- **Anything beyond 300 chars in `failure_message`** — truncated with a
  trailing ellipsis.

If you ever need to add a column, the test is: "would this content be
embarrassing if it leaked?" If yes, hash it or don't store it.

---

## Where it lives

```
supabase/migrations/10_phase10_upload_events.sql   — table + indexes + RLS
lib/telemetry/upload-events.ts                     — helper module (pure)
lib/telemetry/__tests__/upload-events.test.ts      — 25 unit tests
app/api/plansight/import-mpp/route.ts              — instrumented (v1)
```

`lib/telemetry/` is a new top-level directory, intentionally not under
`lib/plansight-ai/`. Telemetry is product-agnostic infrastructure —
future products can drop their own event helpers in here.

---

## Helper API

```ts
import {
  recordUploadEvent,
  classifyError,
  sanitizeError,
  hashFilename,
  type UploadEvent,
  type FailureStage,
  type UserTier
} from "@/lib/telemetry/upload-events";

await recordUploadEvent(event);    // never throws; void return
classifyError(err);                 // returns a FailureStage
sanitizeError(err);                 // returns a ≤300-char safe string
await hashFilename("plan.mpp");     // returns 64-char hex or null
```

`recordUploadEvent` requires three fields on the partial event for the
write to proceed: `fileSizeBytes`, `success`, `totalDurationMs`. Missing
any of those is logged as a warning and the row is skipped — better to
drop a malformed telemetry row than to insert garbage.

---

## Useful queries

Median + P95 parse time, last 7 days:

```sql
select
  percentile_cont(0.5) within group (order by parser_duration_ms) as p50_ms,
  percentile_cont(0.95) within group (order by parser_duration_ms) as p95_ms
from public.upload_events
where success = true
  and parser_duration_ms is not null
  and created_at > now() - interval '7 days';
```

Failure rate by stage, last 7 days:

```sql
select failure_stage, count(*)
from public.upload_events
where created_at > now() - interval '7 days'
  and success = false
group by failure_stage
order by count(*) desc;
```

Cold-start signal (proxy until `parser_queue_ms` lands):

```sql
select count(*) filter (where parser_duration_ms > 8000) * 100.0 / count(*) as cold_start_pct
from public.upload_events
where success = true
  and created_at > now() - interval '7 days';
```

Parse duration vs file size — the scatter that tells you where the
parser starts to hurt:

```sql
select file_size_bytes, parser_duration_ms
from public.upload_events
where success = true
  and parser_duration_ms is not null
  and created_at > now() - interval '7 days';
```

---

## Retention

For now: keep all rows indefinitely. Revisit when the table exceeds
100k rows. At that point a `delete from upload_events where created_at
< now() - interval '90 days'` job would be the simple answer.

---

## See also

- `branding/plansight-ai/UPLOAD_TELEMETRY_IMPLEMENTATION_BRIEF.md` — design brief.
- `lib/telemetry/upload-events.ts` — runtime contract.
- `lib/telemetry/__tests__/upload-events.test.ts` — unit tests.
- `supabase/migrations/10_phase10_upload_events.sql` — schema.
