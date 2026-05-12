import { NextResponse } from "next/server";
import {
  normalizeParsedProject,
  type ParsedProject
} from "@/lib/plansight-ai/adapters/mpp";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { formatBytesMb, getLimitsForTier } from "@/lib/plansight-ai/limits";
import {
  hashFilename,
  recordUploadEvent,
  type FailureStage,
  type UploadEvent,
  type UserTier
} from "@/lib/telemetry/upload-events";

export const runtime = "nodejs";

const PARSER_TIMEOUT_MS = 25_000; // 25s, leaves headroom under Vercel Hobby's 10s ceiling for the typical case

// MS Compound Document magic bytes — every .mpp file starts with this.
const MPP_MAGIC_BYTES = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

function resolveParserServiceUrl() {
  const configuredUrl = process.env.PLANSIGHT_IMPORT_SERVICE_URL?.trim();
  const isPlaceholder =
    !configuredUrl ||
    configuredUrl.includes("your-parser-service.example.com") ||
    configuredUrl.includes("example.com");

  if (!isPlaceholder) {
    return configuredUrl;
  }

  return process.env.NODE_ENV === "development" ? "http://localhost:3005" : "";
}

function hasMppMagicBytes(bytes: Uint8Array) {
  if (bytes.length < MPP_MAGIC_BYTES.length) return false;
  for (let i = 0; i < MPP_MAGIC_BYTES.length; i += 1) {
    if (bytes[i] !== MPP_MAGIC_BYTES[i]) return false;
  }
  return true;
}

/**
 * Helper used at every return site to:
 *   - finalize total_duration_ms
 *   - fire the telemetry write (never awaited; never blocks)
 *   - return the user-facing NextResponse
 *
 * Keeps the route's existing error shapes 1:1 — telemetry is pure
 * side-effect, no behavior change visible to the client.
 */
function respond(
  body: { error: string } | { plan: unknown },
  status: number,
  event: Partial<UploadEvent>,
  t0: number,
  outcome:
    | { success: true; taskCount: number }
    | { success: false; failureStage: FailureStage; failureMessage: string }
) {
  event.totalDurationMs = Date.now() - t0;
  if (outcome.success) {
    event.success = true;
    event.taskCount = outcome.taskCount;
  } else {
    event.success = false;
    event.failureStage = outcome.failureStage;
    event.failureMessage = outcome.failureMessage;
  }
  // Fire-and-forget. The user response goes back synchronously; the
  // telemetry row is written off the critical path. A failed write is
  // logged but never thrown.
  void recordUploadEvent(event);
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  const t0 = Date.now();
  const event: Partial<UploadEvent> = {
    userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    userTier: "anon",
    userId: null
  };

  const parserServiceUrl = resolveParserServiceUrl();

  if (!parserServiceUrl) {
    return respond(
      {
        error:
          "PLANSIGHT_IMPORT_SERVICE_URL is not configured. The MPP parser runs in a separate service."
      },
      503,
      { ...event, fileSizeBytes: 0 },
      t0,
      {
        success: false,
        failureStage: "unknown",
        failureMessage: "parser service url not configured"
      }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return respond(
      { error: "Invalid request body. Expected multipart/form-data." },
      400,
      { ...event, fileSizeBytes: 0 },
      t0,
      {
        success: false,
        failureStage: "upload",
        failureMessage: "Invalid multipart body"
      }
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return respond(
      { error: "No file was uploaded. Expected field name: file." },
      400,
      { ...event, fileSizeBytes: 0 },
      t0,
      {
        success: false,
        failureStage: "upload",
        failureMessage: "No file field in multipart payload"
      }
    );
  }

  event.fileSizeBytes = file.size;
  event.fileNameHash = await hashFilename(file.name).catch(() => null);
  // Mark the boundary between "received the file from the multipart body"
  // and "started doing real work on it". parser_duration_ms will be
  // measured separately below.
  event.uploadDurationMs = Date.now() - t0;

  // Tier-aware file cap: Free / anonymous / not-activated all get the 5 MB
  // limit; Pro gets 25 MB. The activation lookup is best-effort — if it
  // throws we fall back to Free limits rather than blocking the upload.
  let tier: "free" | "pro" = "free";
  let userTier: UserTier = "anon";
  let userId: string | null = null;
  try {
    const user = await getCurrentUser();
    if (user) {
      userId = user.id;
      userTier = "free";
      const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
      if (activation?.tier === "pro") {
        tier = "pro";
        userTier = "pro";
      }
    }
  } catch {
    // keep tier='free', userTier per current best knowledge
  }
  event.userId = userId;
  event.userTier = userTier;

  const limits = getLimitsForTier(tier);
  if (file.size > limits.maxFileBytes) {
    return respond(
      {
        error:
          tier === "pro"
            ? `File exceeds the Pro maximum of ${formatBytesMb(limits.maxFileBytes)}.`
            : `File exceeds the Free maximum of ${formatBytesMb(limits.maxFileBytes)}. Upgrade to Pro for ${formatBytesMb(getLimitsForTier("pro").maxFileBytes)} uploads.`
      },
      413,
      event,
      t0,
      {
        success: false,
        failureStage: "validation",
        failureMessage: `File exceeds ${tier} tier maximum`
      }
    );
  }

  if (!file.name.toLowerCase().endsWith(".mpp")) {
    return respond(
      { error: "Invalid file type. Please upload a .mpp file." },
      400,
      event,
      t0,
      {
        success: false,
        failureStage: "validation",
        failureMessage: "Invalid file extension"
      }
    );
  }

  // Magic-byte check: refuse non-compound-document content even with a .mpp extension.
  const head = new Uint8Array(await file.slice(0, MPP_MAGIC_BYTES.length).arrayBuffer());
  if (!hasMppMagicBytes(head)) {
    return respond(
      { error: "File does not appear to be a valid Microsoft Project (.mpp) file." },
      400,
      event,
      t0,
      {
        success: false,
        failureStage: "validation",
        failureMessage: "Magic bytes mismatch"
      }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PARSER_TIMEOUT_MS);

  // parser_duration_ms is wall time around the parser fetch. Until the
  // parser service exposes X-Parser-Queue-Ms (out of scope here), this
  // combines queue + work time; cold-starts can be inferred from a high
  // parser_duration_ms during otherwise-low-traffic windows.
  const parserStart = Date.now();

  try {
    const parserFormData = new FormData();
    parserFormData.append("file", file);

    const response = await fetch(`${parserServiceUrl.replace(/\/$/, "")}/api/parse`, {
      method: "POST",
      body: parserFormData,
      signal: controller.signal
    });

    const payload = (await response.json().catch(() => null)) as
      | (ParsedProject & { error?: string })
      | null;

    event.parserDurationMs = Date.now() - parserStart;

    if (!response.ok || !payload || !("tasks" in payload)) {
      const errorMessage =
        payload && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Failed to import the MPP file.";

      return respond(
        { error: errorMessage },
        response.status || 500,
        event,
        t0,
        {
          success: false,
          failureStage: "parser_error",
          failureMessage: `Parser returned ${response.status || "no status"}`
        }
      );
    }

    const plan = normalizeParsedProject(payload, new Date().toISOString());
    return respond(
      { plan },
      200,
      event,
      t0,
      { success: true, taskCount: plan.tasks.length }
    );
  } catch (error) {
    event.parserDurationMs = Date.now() - parserStart;

    if (error instanceof Error && error.name === "AbortError") {
      return respond(
        { error: "The MPP parser took too long to respond. Please try again." },
        504,
        event,
        t0,
        {
          success: false,
          failureStage: "parser_timeout",
          failureMessage: `Parser exceeded ${PARSER_TIMEOUT_MS}ms timeout`
        }
      );
    }

    return respond(
      { error: "Failed to import the MPP file. Please try again in a moment." },
      502,
      event,
      t0,
      {
        success: false,
        failureStage: "parser_error",
        failureMessage: error instanceof Error ? error.message : "Unknown parser failure"
      }
    );
  } finally {
    clearTimeout(timeout);
  }
}
