import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { computePlanContentHash, generateAiAnalysis } from "@/lib/plansight-ai/ai";
import { checkAndAlertSpend } from "@/lib/plansight-ai/ai-usage/spend-alert";
import { logAiUsage } from "@/lib/plansight-ai/ai-usage/usage-log";
import {
  loadAiAnalysisIfFresh,
  loadSharedPlan,
  saveAiAnalysis
} from "@/lib/plansight-ai/share-storage";

// Edge runtime: 30s timeout on Vercel Hobby (vs 10s for serverless),
// which leaves ample headroom for Haiku JSON responses (typically 2-4s).
// The Anthropic SDK and Supabase JS both work in Edge via fetch.
export const runtime = "edge";

const requestSchema = z.object({
  shareId: z.string().min(1).max(200),
  force: z.boolean().optional()
});

// Phase 4: server-side Pro gate on regenerate.
// - GET cache / first-time generation: open to anyone (anonymous or signed-in).
// - force=true (regenerate): requires session.user.tier === 'pro'.
// - NEXT_PUBLIC_PLANSIGHT_DEV_REGENERATE=true is a Preview-only escape hatch
//   for prompt iteration; it MUST stay false in Production.
const DEV_BYPASS_ENABLED =
  process.env.NEXT_PUBLIC_PLANSIGHT_DEV_REGENERATE === "true";

export async function POST(request: Request) {
  const startedAt = Date.now();
  let loggingUserId: string | null = null;
  let loggingUserEmail: string | null = null;
  let loggingShareId: string | null = null;

  try {
    const raw = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Expected { shareId: string }." },
        { status: 400 }
      );
    }

    const { shareId, force } = parsed.data;
    loggingShareId = shareId;

    // Resolve user up-front so we can log every regenerate call (cached + live).
    // The Pro gate below still applies — only signed-in Pro users can force=true.
    const user = await getCurrentUser();
    loggingUserId = user?.id ?? null;
    loggingUserEmail = user?.email || null;

    if (force && !DEV_BYPASS_ENABLED) {
      const activation = user
        ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT)
        : null;
      if (!activation || activation.tier !== "pro") {
        return NextResponse.json(
          { error: "Regenerate is a Pro feature. Upgrade to re-run the AI analysis." },
          { status: 403 }
        );
      }
    }

    const plan = await loadSharedPlan(shareId);
    if (!plan) {
      return NextResponse.json({ error: "Shared plan not found." }, { status: 404 });
    }

    const contentHash = await computePlanContentHash(plan);

    if (!force) {
      const cached = await loadAiAnalysisIfFresh(shareId, contentHash);
      if (cached) {
        // Only log cache hits for signed-in users so we don't pollute the
        // table with anonymous-viewer activity. Anonymous viewers cost us $0.
        if (loggingUserId) {
          await logAiUsage({
            userId: loggingUserId,
            shareId,
            feature: "regenerate_analysis",
            cacheHit: true,
            latencyMs: Date.now() - startedAt
          });
        }
        return NextResponse.json({ analysis: cached, cached: true });
      }
    }

    const result = await generateAiAnalysis(plan);
    const latencyMs = Date.now() - startedAt;
    await saveAiAnalysis(shareId, contentHash, result.analysis);

    if (loggingUserId) {
      await logAiUsage({
        userId: loggingUserId,
        shareId,
        feature: "regenerate_analysis",
        cacheHit: false,
        usage: result.usage,
        latencyMs
      });
      await checkAndAlertSpend(loggingUserId, loggingUserEmail);
    }

    return NextResponse.json({ analysis: result.analysis, cached: false });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate AI analysis. Please try again.";

    // Log full error server-side; surface a safe message to the client.
    console.error("[ai-analysis] generation failed", error);

    if (loggingUserId && loggingShareId) {
      await logAiUsage({
        userId: loggingUserId,
        shareId: loggingShareId,
        feature: "regenerate_analysis",
        latencyMs: Date.now() - startedAt,
        error: message.slice(0, 500)
      });
    }

    if (message.includes("ANTHROPIC_API_KEY is not configured")) {
      return NextResponse.json(
        { error: "AI analysis is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate AI analysis. Please try again." },
      { status: 500 }
    );
  }
}
