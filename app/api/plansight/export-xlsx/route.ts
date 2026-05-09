import { NextResponse } from "next/server";
import { z } from "zod";
import { buildInsightsReport } from "@/lib/plansight-ai/analysis";
import { buildPlanWorkbook, getPlanWorkbookFileName } from "@/lib/plansight-ai/export";
import type { Plan } from "@/lib/plansight-ai/types";
import { MAX_PLAN_BODY_BYTES, planSchema } from "@/lib/plansight-ai/validation";

export const runtime = "nodejs";

const postBodySchema = z.object({
  plan: planSchema
});

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_PLAN_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body exceeds maximum size of 5 MB." },
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
    const analysis = buildInsightsReport(plan);
    const workbook = await buildPlanWorkbook(plan, analysis);
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${getPlanWorkbookFileName(plan.title)}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to export the plan to Excel. Please try again." },
      { status: 500 }
    );
  }
}
