import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { generateShareId } from "@/lib/plansight-ai/share";
import {
  deleteAllPlansForUser,
  deletePlanForUser,
  findPlansByTitleForUser,
  getSharedPlanOwner,
  loadSharedPlan,
  loadSharedPlanWithDebug,
  saveSharedPlan
} from "@/lib/plansight-ai/share-storage";
import { recordShareView } from "@/lib/telemetry/share-views";
import { formatBytesMb, getLimitsForTier } from "@/lib/plansight-ai/limits";
import type { Plan } from "@/lib/plansight-ai/types";
import { MAX_PLAN_BODY_BYTES, planSchema } from "@/lib/plansight-ai/validation";

export const runtime = "nodejs";

const postBodySchema = z.object({
  plan: planSchema,
  replaceExisting: z.boolean().optional()
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
    // Hard ceiling — Pro users get the bigger 25 MB cap; non-Pro will be
    // re-checked below against the Free 5 MB cap once we know the tier.
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_PLAN_BODY_BYTES) {
      return NextResponse.json(
        {
          error: `Request body exceeds maximum size of ${formatBytesMb(MAX_PLAN_BODY_BYTES)}.`
        },
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
    const replaceExisting = parsed.data.replaceExisting === true;
    const shareId = generateShareId();

    const user = await getCurrentUser();

    // Anonymous and signed-in-but-not-activated-for-PlanSight users both
    // save as guest (ephemeral, no /my-plans linkage). Activated users
    // own the plan; Free activated users get the single-plan-slot
    // replacement on each new import. Pro users may hit the duplicate-
    // title flow below.
    let ownerUserId: string | null = null;
    let ownerType: "guest" | "user" = "guest";
    let isProActivated = false;

    if (user) {
      const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
      if (activation) {
        ownerUserId = user.id;
        ownerType = "user";
        isProActivated = activation.tier === "pro";
        if (!isProActivated) {
          try {
            await deleteAllPlansForUser(user.id);
          } catch {
            // Don't block the import on a cleanup failure; the new plan
            // still saves and the Pro upsell prompts the user to upgrade.
          }
        }
      }
    }

    // Tier-aware caps. Anonymous, not-activated, and Free activated users
    // share the Free limits (5 MB body, 5000 tasks). Pro raises both.
    const limits = getLimitsForTier(isProActivated ? "pro" : "free");
    if (
      Number.isFinite(contentLength) &&
      contentLength > limits.maxBodyBytes
    ) {
      return NextResponse.json(
        {
          error: isProActivated
            ? `Request body exceeds the Pro maximum of ${formatBytesMb(limits.maxBodyBytes)}.`
            : `Request body exceeds the Free maximum of ${formatBytesMb(limits.maxBodyBytes)}. Upgrade to Pro to upload larger plans.`
        },
        { status: 413 }
      );
    }
    if (plan.tasks.length > limits.maxTasks) {
      return NextResponse.json(
        {
          error: isProActivated
            ? `Plan exceeds the Pro maximum of ${limits.maxTasks.toLocaleString()} tasks.`
            : `Plan exceeds the Free maximum of ${limits.maxTasks.toLocaleString()} tasks. Upgrade to Pro to import larger plans.`
        },
        { status: 413 }
      );
    }

    // Pro path: detect duplicate-title plans on this user's account.
    // Free users don't reach here (the deleteAllPlansForUser above already
    // cleared their slot), and guests have no /my-plans listing to dupe.
    if (ownerUserId && isProActivated) {
      const dupes = await findPlansByTitleForUser(ownerUserId, plan.title);

      if (dupes.length > 0 && !replaceExisting) {
        return NextResponse.json(
          {
            error: "duplicate_title",
            duplicates: dupes,
            existingShareId: dupes[0].shareId,
            existingTitle: dupes[0].title
          },
          { status: 409 }
        );
      }

      if (dupes.length > 0 && replaceExisting) {
        // Delete every dupe, not just the first — handles the case where
        // the user already had multiple plans with the same title before
        // we shipped this check.
        await Promise.all(
          dupes.map((dupe) => deletePlanForUser(dupe.shareId, ownerUserId!))
        );
      }
    }

    await saveSharedPlan(shareId, plan, { ownerUserId, ownerType });

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

/**
 * Delete a single plan owned by the current user. Used by the Remove
 * button on /my-plans. Returns 200 + { ok: true } when a row was deleted,
 * 404 when the plan doesn't exist or doesn't belong to this user.
 */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to remove plans." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const shareId = url.searchParams.get("shareId");
    if (!shareId) {
      return NextResponse.json({ error: "Missing shareId." }, { status: 400 });
    }

    const deleted = await deletePlanForUser(shareId, user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Plan not found or not owned by this user." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = formatError(error);
    return NextResponse.json(
      {
        error: message ? `Failed to remove plan: ${message}` : "Failed to remove plan."
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
      // Not-found views aren't recorded — 404s on this endpoint include
      // expired guest plans, deleted plans, and share-id guessing attempts.
      // None of those are signal for "is the share being viewed by
      // stakeholders". v2 may want to track these separately.
      const responseBody = debug
        ? {
            error: "Shared plan not found.",
            debug: "debug" in result ? result.debug : null
          }
        : { error: "Shared plan not found." };

      return NextResponse.json(responseBody, { status: 404 });
    }

    // Successful view — record fire-and-forget telemetry. Both lookups
    // happen off the critical path; even if one of them fails the user
    // still gets their plan back. is_owner_view is true only when the
    // current viewer is signed in AND matches the plan's owner_user_id.
    const [viewer, ownerUserId] = await Promise.all([
      getCurrentUser().catch(() => null),
      getSharedPlanOwner(shareId).catch(() => null)
    ]);
    const isOwnerView = !!viewer && !!ownerUserId && viewer.id === ownerUserId;
    void recordShareView({
      shareId,
      viewerUserId: viewer?.id ?? null,
      isOwnerView,
      userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null
    });

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
