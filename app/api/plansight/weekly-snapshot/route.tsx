import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { renderPdfToBuffer } from "@/lib/plansight-ai/pdf/render";
import { WeeklySnapshotPdf } from "@/lib/plansight-ai/pdf/weekly-snapshot";
import { loadSharedPlan } from "@/lib/plansight-ai/share-storage";
import { generateWeeklyNarrative } from "@/lib/plansight-ai/weekly-narrative";

// React-PDF + Anthropic call → Node runtime, default 10s on Hobby.
export const runtime = "nodejs";

const requestSchema = z.object({
  shareId: z.string().min(1).max(200)
});

function safeFilename(title: string): string {
  const base = title
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .slice(0, 64) || "plan";
  const stamp = new Date().toISOString().slice(0, 10);
  return `${base}-status-${stamp}.pdf`;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request. Expected { shareId }." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to generate weekly snapshots." },
        { status: 401 }
      );
    }

    const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
    if (!activation || activation.tier !== "pro") {
      return NextResponse.json(
        { error: "Weekly snapshot is a Pro feature. Upgrade to enable it." },
        { status: 403 }
      );
    }

    const plan = await loadSharedPlan(parsed.data.shareId);
    if (!plan) {
      return NextResponse.json({ error: "Shared plan not found." }, { status: 404 });
    }

    const asOf = new Date();
    // Narrative is best-effort; render the structured PDF either way so
    // the user always gets a useful artifact.
    const narrative = await generateWeeklyNarrative(plan, asOf);

    const buffer = await renderPdfToBuffer(
      <WeeklySnapshotPdf plan={plan} narrative={narrative} asOf={asOf.toISOString()} />
    );

    const filename = safeFilename(plan.title);

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
    console.error("[weekly-snapshot] failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate weekly snapshot.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
