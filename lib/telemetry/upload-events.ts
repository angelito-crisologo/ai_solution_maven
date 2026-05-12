import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Categorical pipeline stage at which an upload failed. The dashboard's
 * failure breakdown groups by this; keep the set small and stable.
 *
 * - upload         — request body / multipart parse failed before we had the file
 * - validation     — size cap, file extension, magic-bytes check
 * - parser_timeout — 25s AbortController fired before parser responded
 * - parser_error   — parser returned 4xx/5xx or a malformed response
 * - db_write       — Supabase save failed (v1 instruments only import-mpp;
 *                    this stage starts populating when /share is also wrapped)
 * - unknown        — caught something we couldn't classify; the row still goes
 *                    in with a sanitized message
 */
export type FailureStage =
  | "upload"
  | "validation"
  | "parser_timeout"
  | "parser_error"
  | "db_write"
  | "unknown";

export type UserTier = "anon" | "free" | "pro";

export type UploadEvent = {
  /** Product slug this upload belongs to. Defaults to "plansight-ai" if
   *  unset for backwards compatibility; new products must pass their slug. */
  productSlug?: string;
  userId: string | null;
  userTier: UserTier;
  userAgent: string | null;
  fileSizeBytes: number;
  fileNameHash: string | null;
  mppVersion: string | null;
  hasResources: boolean | null;
  hasBaselines: boolean | null;
  taskCount: number | null;
  uploadDurationMs: number | null;
  parserQueueMs: number | null;
  parserDurationMs: number | null;
  dbWriteDurationMs: number | null;
  totalDurationMs: number;
  success: boolean;
  failureStage: FailureStage | null;
  failureMessage: string | null;
  shareId: string | null;
};

const MAX_FAILURE_MESSAGE_CHARS = 300;
const MAX_USER_AGENT_CHARS = 500;

/**
 * Insert one row into upload_events. Best-effort — never throws and never
 * blocks the caller. Designed to be invoked as `void recordUploadEvent(event)`
 * after the user-facing response has been returned. A Supabase outage
 * should never break an upload.
 */
export async function recordUploadEvent(event: Partial<UploadEvent>): Promise<void> {
  try {
    const client = createSupabaseServiceClient();
    if (!client) {
      // Supabase not configured — telemetry is best-effort.
      return;
    }

    if (typeof event.totalDurationMs !== "number") {
      // Required by the schema. Refuse to write a meaningless row.
      console.warn("[upload-telemetry] skipping event with no totalDurationMs");
      return;
    }
    if (typeof event.fileSizeBytes !== "number") {
      console.warn("[upload-telemetry] skipping event with no fileSizeBytes");
      return;
    }
    if (typeof event.success !== "boolean") {
      console.warn("[upload-telemetry] skipping event with no success flag");
      return;
    }

    const { error } = await client.from("upload_events").insert({
      product_slug: event.productSlug ?? "plansight-ai",
      user_id: event.userId ?? null,
      user_tier: event.userTier ?? "anon",
      user_agent: event.userAgent ? event.userAgent.slice(0, MAX_USER_AGENT_CHARS) : null,
      file_size_bytes: event.fileSizeBytes,
      file_name_hash: event.fileNameHash ?? null,
      mpp_version: event.mppVersion ?? null,
      has_resources: event.hasResources ?? null,
      has_baselines: event.hasBaselines ?? null,
      task_count: event.taskCount ?? null,
      upload_duration_ms: event.uploadDurationMs ?? null,
      parser_queue_ms: event.parserQueueMs ?? null,
      parser_duration_ms: event.parserDurationMs ?? null,
      db_write_duration_ms: event.dbWriteDurationMs ?? null,
      total_duration_ms: event.totalDurationMs,
      success: event.success,
      failure_stage: event.failureStage ?? null,
      failure_message: event.failureMessage
        ? event.failureMessage.slice(0, MAX_FAILURE_MESSAGE_CHARS)
        : null,
      share_id: event.shareId ?? null
    });

    if (error) {
      console.error("[upload-telemetry] insert failed:", error.message);
    }
  } catch (err) {
    console.error("[upload-telemetry] insert threw:", err);
  }
}

/**
 * Classify a caught error or known sentinel into a FailureStage. Callers
 * that know their stage (e.g., "we just failed a size check") should pass
 * a synthetic `{ stage: "validation" }` rather than relying on classification.
 */
export function classifyError(err: unknown): FailureStage {
  if (err instanceof Error) {
    if (err.name === "AbortError" || /aborted|timeout|timed out/i.test(err.message)) {
      return "parser_timeout";
    }
    if (/fetch failed|network|ENOTFOUND|ECONNREFUSED|ECONNRESET/i.test(err.message)) {
      return "parser_error";
    }
    if (/supabase|postgres|database|relation .* does not exist/i.test(err.message)) {
      return "db_write";
    }
    if (/multipart|form-data|invalid request body/i.test(err.message)) {
      return "upload";
    }
    if (/invalid file type|magic bytes|exceeds .*maximum|extension/i.test(err.message)) {
      return "validation";
    }
  }
  return "unknown";
}

/**
 * Build a short, safe message from an error suitable for storage AND for
 * surfacing to a user. Strips:
 *   - absolute file paths (Unix + Windows)
 *   - bearer tokens, API keys, JWTs, common secret-bearing query params
 *   - request headers (Authorization, Cookie, x-api-key, etc.)
 *   - process.env references
 *   - stack trace lines (keeps only the first line)
 *   - then caps to MAX_FAILURE_MESSAGE_CHARS characters
 */
export function sanitizeError(err: unknown): string {
  let raw: string;
  if (err instanceof Error) {
    raw = err.message ?? err.name ?? "Error";
  } else if (typeof err === "string") {
    raw = err;
  } else if (err == null) {
    raw = "Unknown error";
  } else {
    try {
      raw = JSON.stringify(err);
    } catch {
      raw = "Unserializable error";
    }
  }

  // Drop stack trace lines after the first newline.
  const firstLine = raw.split("\n")[0] ?? raw;

  const scrubbed = firstLine
    // Unix and Windows absolute paths
    .replace(/(?:\/(?:Users|home|var|opt|etc|root|tmp))(?:\/[A-Za-z0-9._\-]+)+/g, "<path>")
    .replace(/[A-Z]:\\\\(?:[A-Za-z0-9._\-]+\\\\?)+/g, "<path>")
    // Bearer tokens and JWT-ish blobs
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer <redacted>")
    .replace(/eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, "<jwt>")
    // Common header names — match value up to next separator (semicolon or
    // comma) so we capture "scheme token" pairs like "Basic abc==" together,
    // not just the scheme.
    .replace(/(authorization|cookie|set-cookie|x-api-key)\s*[:=]\s*[^,;]+/gi, "$1: <redacted>")
    // Secret-bearing query params and env value patterns
    .replace(/(password|secret|api[_-]?key|token)\s*[:=]\s*[^&,\s]+/gi, "$1=<redacted>")
    .replace(/process\.env\.[A-Z_]+/g, "process.env.<name>")
    // Collapse runs of whitespace
    .replace(/\s+/g, " ")
    .trim();

  if (scrubbed.length <= MAX_FAILURE_MESSAGE_CHARS) {
    return scrubbed;
  }
  return scrubbed.slice(0, MAX_FAILURE_MESSAGE_CHARS - 1) + "…";
}

/**
 * SHA-256 hex digest of the filename. Lets us detect retry behavior
 * ("same file uploaded N times") without ever storing the filename itself.
 * Empty input returns null.
 */
export async function hashFilename(filename: string): Promise<string | null> {
  if (!filename) return null;
  const bytes = new TextEncoder().encode(filename);
  const buffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
