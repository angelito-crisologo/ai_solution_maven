import { randomUUID } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { loadSharedPlan, saveSharedPlan } from "@/lib/plansight-ai/share-storage";
import { shiftSampleToCurrentDates } from "@/lib/plansight-ai/sample";

// Matches the share_id in migration 16.
const SAMPLE_SHARE_ID = "plansight-sample-website-launch";

export async function POST(_req: NextRequest): Promise<NextResponse> {
  try {
    const canonical = await loadSharedPlan(SAMPLE_SHARE_ID);
    if (!canonical) {
      return NextResponse.json({ error: "Sample plan not found" }, { status: 404 });
    }

    const newShareId = randomUUID();
    const shiftedPlan = {
      ...shiftSampleToCurrentDates(canonical),
      id: newShareId,
      importedAt: new Date().toISOString()
    };

    await saveSharedPlan(newShareId, shiftedPlan, { ownerType: "guest" });

    return NextResponse.json({ shareId: newShareId });
  } catch (error) {
    console.error("[plansight/sample] failed:", error);
    return NextResponse.json({ error: "Failed to prepare sample plan" }, { status: 500 });
  }
}
