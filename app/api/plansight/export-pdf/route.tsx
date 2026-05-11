import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { AiAnalysisPdf } from "@/lib/plansight-ai/pdf/ai-analysis";
import { renderPdfToBuffer } from "@/lib/plansight-ai/pdf/render";
import { ShareViewPdf } from "@/lib/plansight-ai/pdf/share-view";
import {
  loadAiAnalysisIfFresh,
  loadSharedPlan
} from "@/lib/plansight-ai/share-storage";
import { computePlanContentHash } from "@/lib/plansight-ai/ai";

// React-PDF needs Node — fontkit/pdfkit can't ship through Edge.
export const runtime = "nodejs";
// Hobby Node functions cap at 10s by default; PDF rendering for a 200-task
// plan typically lands under 2s, so default timeout is fine.

const requestSchema = z.object({
  shareId: z.string().min(1).max(200),
  format: z.enum(["share", "ai-analysis"])
});

function safeFilename(title: string, suffix: string): string {
  const base = title
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .slice(0, 64) || "plan";
  return `${base}-${suffix}.pdf`;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Expected { shareId, format }." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to export PDFs." },
        { status: 401 }
      );
    }

    const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
    if (!activation || activation.tier !== "pro") {
      return NextResponse.json(
        { error: "PDF export is a Pro feature. Upgrade to enable it." },
        { status: 403 }
      );
    }

    const plan = await loadSharedPlan(parsed.data.shareId);
    if (!plan) {
      return NextResponse.json({ error: "Shared plan not found." }, { status: 404 });
    }

    let buffer: Buffer;
    let filenameSuffix: string;

    if (parsed.data.format === "share") {
      buffer = await renderPdfToBuffer(<ShareViewPdf plan={plan} />);
      filenameSuffix = "share";
    } else {
      const contentHash = await computePlanContentHash(plan);
      const cached = await loadAiAnalysisIfFresh(parsed.data.shareId, contentHash);
      if (!cached) {
        return NextResponse.json(
          {
            error:
              "No AI analysis is cached for this plan. Open the AI Analysis tab to generate one first."
          },
          { status: 409 }
        );
      }
      buffer = await renderPdfToBuffer(
        <AiAnalysisPdf plan={plan} analysis={cached} />
      );
      filenameSuffix = "ai-analysis";
    }

    const filename = safeFilename(plan.title, filenameSuffix);

    const bytes = new Uint8Array(buffer);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("[export-pdf] failed", error);
    const message = error instanceof Error ? error.message : "Failed to export PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
