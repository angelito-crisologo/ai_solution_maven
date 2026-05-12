# Implementation Brief for Claude Code: Upload Telemetry

## Context

The MPP parsing pipeline is PlanSight's single most fragile and most opaque component. It runs on a separate Render-hosted Java/MPXJ service, can cold-start, has a 25-second timeout, and is the first thing every user experiences. Failures here are invisible from Vercel logs and from the user's side often look like a generic error.

We need to instrument every upload attempt — successful or not — so we can answer questions like:

- What's the median parse time for a typical plan?
- At what file size does parse time spike?
- Is the Render parser cold-starting despite the UptimeRobot keep-warm ping?
- What percentage of uploads fail, and at which pipeline stage?
- Are specific MPP versions or file shapes failing more often?
- When do we need to upgrade from Render Free to Railway Hobby?

This brief covers the implementation of an `upload_events` table in Supabase plus instrumentation of the existing upload route.

## The architectural rule

Telemetry is **fire-and-forget**. A failed telemetry write must never block, delay, or break a user's upload. The user's response is returned first; the event is recorded after.

## What to build

### 1. Supabase schema

Create a new `upload_events` table:

```sql
CREATE TABLE upload_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Who
  user_id UUID NULL,                    -- null if anonymous
  user_tier TEXT NOT NULL,              -- 'anon' | 'free' | 'pro'
  user_agent TEXT NULL,

  -- What
  file_size_bytes INTEGER NOT NULL,
  file_name_hash TEXT NULL,             -- SHA-256 hash of original filename; never store the filename itself
  mpp_version TEXT NULL,
  has_resources BOOLEAN NULL,
  has_baselines BOOLEAN NULL,
  task_count INTEGER NULL,              -- null on failure before parse completes

  -- Pipeline timing (all in milliseconds)
  upload_duration_ms INTEGER NULL,      -- time to receive the file at the Next.js route
  parser_queue_ms INTEGER NULL,         -- time before parser started responding (cold-start signal)
  parser_duration_ms INTEGER NULL,      -- parser work time after first byte
  db_write_duration_ms INTEGER NULL,    -- Supabase write time
  total_duration_ms INTEGER NOT NULL,   -- end-to-end

  -- Outcome
  success BOOLEAN NOT NULL,
  failure_stage TEXT NULL,              -- 'upload' | 'validation' | 'parser_timeout' | 'parser_error' | 'db_write' | 'unknown'
  failure_message TEXT NULL,            -- sanitized; no stack traces, file paths, or PII

  -- Reference
  plan_id UUID NULL REFERENCES plans(id) ON DELETE SET NULL
);

CREATE INDEX idx_upload_events_created_at ON upload_events (created_at DESC);
CREATE INDEX idx_upload_events_success_created ON upload_events (success, created_at DESC);
CREATE INDEX idx_upload_events_failure ON upload_events (failure_stage) WHERE success = false;
```

RLS: deny all by default. Only service-role writes from server routes. No client read access to this table.

```sql
ALTER TABLE upload_events ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon or authenticated keys.
-- Service-role key bypasses RLS as expected.
```

### 2. Telemetry helper

Create `lib/telemetry/uploadEvents.ts` with:

- `UploadEvent` TypeScript type matching the table schema
- `recordUploadEvent(event: Partial<UploadEvent>): Promise<void>` — writes a row using the service-role Supabase client; catches and logs errors internally; never throws
- `classifyError(err: unknown): FailureStage` — maps caught errors to one of the stage strings
- `sanitizeError(err: unknown): string` — strips stack traces, file paths, environment values, and request headers; returns a short safe string suitable for storage and ideally for display
- `hashFilename(filename: string): string` — SHA-256 hex digest

### 3. Instrument the upload route

Wrap the existing `/api/plans/upload` route handler so every code path produces an `UploadEvent`. Pattern:

```typescript
import { recordUploadEvent, classifyError, sanitizeError, hashFilename } from '@/lib/telemetry/uploadEvents';

export async function POST(req: Request) {
  const t0 = Date.now();
  const event: Partial<UploadEvent> = {
    user_id: session?.user.id ?? null,
    user_tier: session ? userTier : 'anon',
    user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
  };

  try {
    const file = await getUploadedFile(req);
    event.file_size_bytes = file.size;
    event.file_name_hash = hashFilename(file.name);

    // Validation stage
    validateUpload(file);
    event.upload_duration_ms = Date.now() - t0;

    // Parser stage
    const t1 = Date.now();
    const parseResult = await callParserService(file);
    event.parser_queue_ms = parseResult.queueMs;
    event.parser_duration_ms = Date.now() - t1 - parseResult.queueMs;
    event.task_count = parseResult.tasks.length;
    event.mpp_version = parseResult.mppVersion ?? null;
    event.has_resources = parseResult.hasResources ?? null;
    event.has_baselines = parseResult.hasBaselines ?? null;

    // DB write stage
    const t2 = Date.now();
    const plan = await writePlan(parseResult);
    event.db_write_duration_ms = Date.now() - t2;
    event.plan_id = plan.id;

    event.success = true;
    event.total_duration_ms = Date.now() - t0;

    // Fire-and-forget — do not await
    void recordUploadEvent(event);

    return Response.json({ planId: plan.id });
  } catch (err) {
    event.success = false;
    event.failure_stage = classifyError(err);
    event.failure_message = sanitizeError(err);
    event.total_duration_ms = Date.now() - t0;

    void recordUploadEvent(event);

    return Response.json({ error: 'upload_failed' }, { status: 500 });
  }
}
```

### 4. Parser service: surface queue vs work time

For cold-start detection to work, the parser service needs to distinguish "time spent queueing/cold-starting" from "time spent actually parsing." Add a response header or response field from the Render parser:

- `X-Parser-Queue-Ms` — milliseconds between request received and parsing started
- Parser duration is then calculated client-side as (response received - request sent - queue ms)

If modifying the parser service is out of scope for this change, fall back to: `parser_queue_ms = null`, and infer cold starts later from `parser_duration_ms > 8000` plus a low-traffic period heuristic. Document this in a code comment.

### 5. Minimal admin dashboard

Create `/app/admin/uploads/page.tsx` gated to your own user ID (hardcoded check is fine for v1 — formalize later). Show:

- **Daily upload count** (line chart, last 30 days)
- **Success rate** (last 7 days vs previous 7 days)
- **Failure breakdown by stage** (bar chart, last 7 days)
- **Parse duration percentiles** (P50, P95, P99, last 7 days)
- **Parse duration vs file size** (scatter plot — most useful single chart)
- **Cold-start rate** (% of uploads with parser_queue_ms > 3000, last 7 days)

Use Recharts. Query Supabase directly with the service-role client from a server component. Don't expose any of these queries to the client.

## What to NOT track

- **Original filenames.** Hash only.
- **File content samples or task names.**
- **IP addresses.**
- **Anything that lets you re-identify an anonymous user across sessions.**
- **Unsanitized error messages.** Stack traces, paths, and headers must be stripped before storage.

## Acceptance criteria

1. Every upload attempt produces exactly one row in `upload_events`, regardless of outcome
2. Telemetry writes do not block or delay the user-facing response (verify with a deliberately slow `recordUploadEvent` stub during testing)
3. A failed telemetry write does not break the upload flow (verify by temporarily breaking the telemetry client)
4. Failure stages are correctly classified for the common error paths: oversized file, invalid magic bytes, parser timeout, parser 5xx, Supabase write failure
5. Sanitized failure messages contain no file paths, stack traces, environment variable values, or request headers
6. The admin dashboard renders correctly with synthetic data covering all failure stages
7. RLS denies all client-key access to `upload_events` (verify with the anon key)
8. Unit tests cover `classifyError`, `sanitizeError`, and `hashFilename`

## Privacy and compliance notes

- The `file_name_hash` lets us detect retry behavior ("same file uploaded N times") without storing identifying content
- No PII is stored that wasn't already in the `plans` table
- Add a single sentence to the privacy policy: *"We collect anonymous diagnostic data on file uploads (size, timing, success/failure) to maintain service quality. We do not retain file contents or filenames for diagnostics."*

## Docs to update

- `PRODUCT.md` — add `upload_events` to the data model section
- Add a new doc, `TELEMETRY_SPEC.md`, capturing the schema, the fire-and-forget rule, and the failure-stage taxonomy
- Update privacy policy with the sentence above

## Out of scope for this change

- Share link view tracking
- AI analysis event tracking (separate, larger piece — covered in Phase 3 instrumentation)
- Funnel analytics (anonymous → signed-up → paid)
- Alerting (e.g., Slack notification when failure rate spikes) — defer until baseline failure rate is known
- Customer-facing analytics
- Long-term retention policy — for now, keep all rows; revisit when the table exceeds 100k rows

## One thing to watch

The parser service runs on Render Free, which sleeps after 15 minutes of inactivity. The UptimeRobot 5-minute ping should prevent this, but if telemetry shows `parser_queue_ms > 3000` on more than 5% of uploads in a 7-day window, the keep-warm is failing and the parser is cold-starting on real user traffic. That's the trigger to either fix the ping schedule or upgrade hosting. The telemetry is what makes this decision possible — without it, we'd be guessing.
