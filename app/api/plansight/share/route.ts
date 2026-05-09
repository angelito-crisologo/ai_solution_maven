import { NextResponse } from "next/server";
import { z } from "zod";
import { generateShareId } from "@/lib/plansight-ai/share";
import { loadSharedPlan, loadSharedPlanWithDebug, saveSharedPlan } from "@/lib/plansight-ai/share-storage";
import type { Plan } from "@/lib/plansight-ai/types";
import { MAX_PLAN_BODY_BYTES, planSchema } from "@/lib/plansight-ai/validation";

export const runtime = "nodejs";

const postBodySchema = z.object({
  plan: planSchema
});

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const message = "message" in error ? (error as { message?: unknown }).message : null;
    const details = "details" in error ? (error as { details?: unknown }).details : null;
    const hint = "hint" in error ? (error as { hint?: unknown }).hint : null;
    const code = "code" in error ? (error as { code?: unknown }).code : null;

    const parts = [message, details, hint, code].filter(
      (part): part is string => typeof part === "string" && part.trim().length > 0
    );

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_PLAN_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body exceeds maximum size of 5 MB." },
        { status: 413 }
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = postBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan payload.", details: parsed.error.issues.slice(0, 3) },
        { status: 400 }
      );
    }

    const plan = parsed.data.plan as Plan;
    const shareId = generateShareId();

    await saveSharedPlan(shareId, plan);

    return NextResponse.json({ shareId, ok: true });
  } catch (error) {
    const message = formatError(error);
    return NextResponse.json(
      {
        error: message ? `Failed to store shared plan: ${message}` : "Failed to store shared plan."
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json({ error: "Missing shareId." }, { status: 400 });
    }

    const debug = url.searchParams.get("debug") === "1";
    const result = debug
      ? await loadSharedPlanWithDebug(shareId)
      : { plan: await loadSharedPlan(shareId) };

    if (!result.plan) {
      const responseBody = debug
        ? {
            error: "Shared plan not found.",
            debug: "debug" in result ? result.debug : null
          }
        : { error: "Shared plan not found." };

      return NextResponse.json(responseBody, { status: 404 });
    }

    return NextResponse.json(debug ? result : { plan: result.plan });
  } catch (error) {
    const message = formatError(error);
    return NextResponse.json(
      {
        error: message ? `Failed to load shared plan: ${message}` : "Failed to load shared plan."
      },
      { status: 500 }
    );
  }
}
