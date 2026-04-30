import { NextResponse } from "next/server";
import type { Plan } from "@/lib/plansight-ai/types";
import { loadSharedPlan, loadSharedPlanWithDebug, saveSharedPlan } from "@/lib/plansight-ai/share-storage";

export const runtime = "nodejs";

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
    const payload = (await request.json()) as { shareId?: unknown; plan?: unknown; guestId?: unknown };

    if (typeof payload.shareId !== "string" || !payload.shareId.trim()) {
      return NextResponse.json({ error: "Missing shareId." }, { status: 400 });
    }

    if (typeof payload.plan !== "object" || payload.plan == null) {
      return NextResponse.json({ error: "Missing plan." }, { status: 400 });
    }

    const plan = payload.plan as Plan;
    await saveSharedPlan(payload.shareId, plan, {
      guestId: typeof payload.guestId === "string" ? payload.guestId : null
    });

    return NextResponse.json({ ok: true });
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
    const result = debug ? await loadSharedPlanWithDebug(shareId) : { plan: await loadSharedPlan(shareId) };

    if (!result.plan) {
      const responseBody = debug
        ? {
            error: "Shared plan not found.",
            debug: "debug" in result ? result.debug : null
          }
        : { error: "Shared plan not found." };

      return NextResponse.json(
        responseBody,
        { status: 404 }
      );
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
