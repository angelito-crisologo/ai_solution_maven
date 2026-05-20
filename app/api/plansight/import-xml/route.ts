import { NextResponse } from "next/server";
import { parseMppXml, normalizeParsedXmlProject } from "@/lib/plansight-ai/adapters/xml";
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

// XML files are text so the same byte cap covers much more content than
// an equivalent-size binary .mpp. In practice a 5 MB XML export represents
// a very large plan; the task-count gate will trip first on large plans.
const MAX_XML_BYTES_FREE = 5 * 1024 * 1024;   // 5 MB
const MAX_XML_BYTES_PRO  = 25 * 1024 * 1024;  // 25 MB

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return respond(
      { error: "Invalid request body. Expected multipart/form-data." },
      400,
      { ...event, fileSizeBytes: 0 },
      t0,
      { success: false, failureStage: "upload", failureMessage: "Invalid multipart body" }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return respond(
      { error: "No file was uploaded. Expected field name: file." },
      400,
      { ...event, fileSizeBytes: 0 },
      t0,
      { success: false, failureStage: "upload", failureMessage: "No file field in multipart payload" }
    );
  }

  event.fileSizeBytes = file.size;
  event.fileNameHash = await hashFilename(file.name).catch(() => null);
  event.uploadDurationMs = Date.now() - t0;

  // Resolve tier
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
    // keep defaults
  }
  event.userId = userId;
  event.userTier = userTier;

  // File extension check
  if (!file.name.toLowerCase().endsWith(".xml")) {
    return respond(
      { error: "Invalid file type. Please upload an MS Project XML (.xml) file." },
      400,
      event,
      t0,
      { success: false, failureStage: "validation", failureMessage: "Invalid file extension" }
    );
  }

  // Size check — use tier-specific cap
  const maxBytes = tier === "pro" ? MAX_XML_BYTES_PRO : MAX_XML_BYTES_FREE;
  if (file.size > maxBytes) {
    return respond(
      {
        error:
          tier === "pro"
            ? `File exceeds the Pro maximum of ${formatBytesMb(maxBytes)}.`
            : `File exceeds the Free maximum of ${formatBytesMb(maxBytes)}. Upgrade to Pro for ${formatBytesMb(MAX_XML_BYTES_PRO)} uploads.`
      },
      413,
      event,
      t0,
      { success: false, failureStage: "validation", failureMessage: `File exceeds ${tier} tier maximum` }
    );
  }

  // Read and parse
  let xmlText: string;
  try {
    xmlText = await file.text();
  } catch {
    return respond(
      { error: "Could not read the uploaded file." },
      400,
      event,
      t0,
      { success: false, failureStage: "upload", failureMessage: "File.text() failed" }
    );
  }

  // Quick content check — must look like XML before we spend time parsing
  const trimmed = xmlText.trimStart();
  if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<Project")) {
    return respond(
      { error: "File does not appear to be a valid MS Project XML export." },
      400,
      event,
      t0,
      { success: false, failureStage: "validation", failureMessage: "Content does not start with XML declaration or <Project>" }
    );
  }

  const parserStart = Date.now();
  try {
    const parsed = parseMppXml(xmlText);
    event.parserDurationMs = Date.now() - parserStart;

    // Apply task-count gate (same limits as MPP)
    const limits = getLimitsForTier(tier);
    if (parsed.tasks.length > limits.maxTasks) {
      return respond(
        {
          error:
            tier === "pro"
              ? `Plan has ${parsed.tasks.length.toLocaleString()} tasks, exceeding the Pro maximum of ${limits.maxTasks.toLocaleString()}.`
              : `Plan has ${parsed.tasks.length.toLocaleString()} tasks. Free accounts support up to ${limits.maxTasks.toLocaleString()} tasks. Upgrade to Pro for larger plans.`
        },
        413,
        event,
        t0,
        { success: false, failureStage: "validation", failureMessage: `Task count ${parsed.tasks.length} exceeds ${tier} tier limit` }
      );
    }

    const plan = normalizeParsedXmlProject(parsed, new Date().toISOString());
    return respond(
      { plan },
      200,
      event,
      t0,
      { success: true, taskCount: plan.tasks.length }
    );
  } catch (error) {
    event.parserDurationMs = Date.now() - parserStart;
    const message = error instanceof Error ? error.message : "Unknown parse failure";
    return respond(
      { error: `Failed to parse the XML file: ${message}` },
      422,
      event,
      t0,
      { success: false, failureStage: "parser_error", failureMessage: message.slice(0, 300) }
    );
  }
}
