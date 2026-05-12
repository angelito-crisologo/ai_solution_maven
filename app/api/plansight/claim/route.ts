import { NextResponse } from "next/server";
import { z } from "zod";
import { activateProduct, getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { claimGuestPlan } from "@/lib/plansight-ai/share-storage";

export const runtime = "nodejs";

const postBodySchema = z.object({
  shareId: z.string().min(1)
});

/**
 * Transfer ownership of an anonymous plan onto the signed-in user's account.
 * Called by the workspace shell after signup/signin when localStorage has a
 * pending claim-share-id. Idempotent: if the row is already owned, returns
 * not-guest and the client should clear its localStorage marker.
 *
 * Also ensures the user has a PlanSight activation row — claiming a plan
 * implies they want to use PlanSight, and the My Plans dashboard requires
 * activation to render the claimed plan.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = postBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { shareId } = parsed.data;

  let result;
  try {
    result = await claimGuestPlan(shareId, user.id);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[plansight/claim] failed", error);
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  if (!result.ok) {
    const status = result.reason === "not-found" ? 404 : 410;
    return NextResponse.json({ error: result.reason }, { status });
  }

  // Best-effort activation — if the user already activated PlanSight this is
  // a no-op; if it fails, the workspace's activation banner will recover.
  try {
    const existing = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
    if (!existing) {
      await activateProduct(user.id, PRODUCTS.PLANSIGHT);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[plansight/claim] activation after claim failed", error);
    }
  }

  return NextResponse.json({ shareId: result.shareId, title: result.title });
}
