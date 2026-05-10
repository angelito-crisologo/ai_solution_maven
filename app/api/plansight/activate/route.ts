import { NextResponse } from "next/server";
import { activateProduct, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Records that the current signed-in user has activated PlanSight AI.
 * Called from the magic-link callback (when ?product=plansight-ai was on
 * the original /signin URL) and from the "Activate PlanSight with your
 * account" button shown to users who signed in via another product.
 *
 * Idempotent: calling multiple times is fine; the first call sets
 * activated_at and subsequent calls are no-ops.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to activate PlanSight." },
      { status: 401 }
    );
  }

  try {
    const activation = await activateProduct(user.id, PRODUCTS.PLANSIGHT);
    return NextResponse.json({
      ok: true,
      activation: {
        productSlug: activation.productSlug,
        tier: activation.tier,
        activatedAt: activation.activatedAt
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to activate PlanSight.";
    return NextResponse.json(
      { error: `Failed to activate PlanSight: ${message}` },
      { status: 500 }
    );
  }
}
