import { NextResponse } from "next/server";
import { z } from "zod";
import { computePlanContentHash, generateAiAnalysis } from "@/lib/plansight-ai/ai";
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
  shareId: z.string().min(1).max(200)
});

// TODO(Phase 4): require an authenticated session here. For Phase 3 the
// route is open so the feature can be validated; rate-limit and content-hash
// caching keep cost bounded during validation.

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Expected { shareId: string }." },
        { status: 400 }
      );
    }

    const { shareId } = parsed.data;

    const plan = await loadSharedPlan(shareId);
    if (!plan) {
      return NextResponse.json({ error: "Shared plan not found." }, { status: 404 });
    }

    const contentHash = await computePlanContentHash(plan);

    const cached = await loadAiAnalysisIfFresh(shareId, contentHash);
    if (cached) {
      return NextResponse.json({ analysis: cached, cached: true });
    }

    const analysis = await generateAiAnalysis(plan);
    await saveAiAnalysis(shareId, contentHash, analysis);

    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate AI analysis. Please try again.";

    // Log full error server-side; surface a safe message to the client.
    console.error("[ai-analysis] generation failed", error);

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
