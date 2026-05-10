import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { explainTask } from "@/lib/plansight-ai/explain-task";
import { loadSharedPlan } from "@/lib/plansight-ai/share-storage";

// Edge runtime gets the 30s ceiling on Hobby. Haiku replies in ~2s for a
// scoped task explanation, so we have plenty of margin.
export const runtime = "edge";

const requestSchema = z.object({
  shareId: z.string().min(1).max(200),
  taskId: z.number().int()
});

/**
 * Pro-only inline AI: explain a single task in plain language using its
 * predecessors, successors, and parent summary as context. No caching —
 * explanations are cheap (~$0.005/call) and a stale explanation is worse
 * than a fresh one.
 */
export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Expected { shareId, taskId }." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to use Explain this task." },
        { status: 401 }
      );
    }

    const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
    if (!activation || activation.tier !== "pro") {
      return NextResponse.json(
        { error: "Explain this task is a Pro feature. Upgrade to use it." },
        { status: 403 }
      );
    }

    const plan = await loadSharedPlan(parsed.data.shareId);
    if (!plan) {
      return NextResponse.json({ error: "Shared plan not found." }, { status: 404 });
    }

    const explanation = await explainTask(plan, parsed.data.taskId);
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("[explain-task] failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to explain task.";

    if (message.includes("ANTHROPIC_API_KEY is not configured")) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (message.includes("not in this plan")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to explain task. Please try again." },
      { status: 500 }
    );
  }
}
