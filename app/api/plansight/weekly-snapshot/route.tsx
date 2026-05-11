import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getUserPreferences } from "@/lib/auth/preferences";
import { getCurrentUser } from "@/lib/auth/session";
import { checkAndAlertSpend } from "@/lib/plansight-ai/ai-usage/spend-alert";
import { logAiUsage } from "@/lib/plansight-ai/ai-usage/usage-log";
import { renderPdfToBuffer } from "@/lib/plansight-ai/pdf/render";
import { WeeklyReportPdf } from "@/lib/plansight-ai/pdf/weekly-snapshot";
import {
  resolveReportingPeriod,
  snapOverrideToWeek
} from "@/lib/plansight-ai/reporting-period";
import { loadSharedPlan } from "@/lib/plansight-ai/share-storage";
import { generateWeeklyNarrative } from "@/lib/plansight-ai/weekly-narrative";
import { buildWeeklyReportData } from "@/lib/plansight-ai/weekly-report-data";

// React-PDF + Anthropic call → Node runtime, default 10s on Hobby.
export const runtime = "nodejs";

const requestSchema = z.object({
  shareId: z.string().min(1).max(200),
  /** Optional ISO date (YYYY-MM-DD) — any day inside the desired week.
   * The server snaps it to the user's week-start boundary. */
  weekStart: z.string().min(8).max(40).optional()
});

function safeFilename(title: string, periodEnd: Date): string {
  const base = title
    .replace(/[^\w\s.-]+/g, "")
    .trim()
    .slice(0, 64) || "plan";
  const stamp = periodEnd.toISOString().slice(0, 10);
  return `${base}-weekly-report-${stamp}.pdf`;
}

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
        { error: "Invalid request. Expected { shareId, weekStart? }." },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to generate weekly reports." },
        { status: 401 }
      );
    }
    loggingUserId = user.id;
    loggingUserEmail = user.email || null;

    const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
    if (!activation || activation.tier !== "pro") {
      return NextResponse.json(
        { error: "Weekly report is a Pro feature. Upgrade to enable it." },
        { status: 403 }
      );
    }

    loggingShareId = parsed.data.shareId;
    const plan = await loadSharedPlan(parsed.data.shareId);
    if (!plan) {
      return NextResponse.json({ error: "Shared plan not found." }, { status: 404 });
    }

    const preferences = await getUserPreferences(user.id);
    const today = new Date();

    // Resolve reporting period: override snaps to the user's week boundary,
    // or compute the last completed week.
    const reportingPeriod =
      snapOverrideToWeek(
        parsed.data.weekStart ? { start: parsed.data.weekStart } : null,
        preferences.weekStartDay
      ) ?? resolveReportingPeriod(today, preferences.weekStartDay);

    const reportData = buildWeeklyReportData(
      plan,
      reportingPeriod,
      preferences.weekStartDay,
      today
    );

    // Best-effort narrative — PDF still renders without it.
    const narrative = await generateWeeklyNarrative(reportData);

    const buffer = await renderPdfToBuffer(
      <WeeklyReportPdf
        data={reportData}
        narrative={narrative.text}
        generatedAt={today.toISOString()}
      />
    );

    const bytes = new Uint8Array(buffer);
    const filename = safeFilename(plan.title, reportingPeriod.end);

    // Log + spend alert AFTER the PDF buffer is built but before the
    // response goes out. Narrative may have returned null on Anthropic
    // failure — usage is null in that case so the row records latency only.
    await logAiUsage({
      userId: loggingUserId,
      shareId: loggingShareId,
      feature: "weekly_snapshot",
      cacheHit: false,
      usage: narrative.usage,
      latencyMs: Date.now() - startedAt
    });
    if (narrative.usage) {
      await checkAndAlertSpend(loggingUserId, loggingUserEmail);
    }

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
    console.error("[weekly-report] failed", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate weekly report.";

    if (loggingUserId && loggingShareId) {
      await logAiUsage({
        userId: loggingUserId,
        shareId: loggingShareId,
        feature: "weekly_snapshot",
        latencyMs: Date.now() - startedAt,
        error: message.slice(0, 500)
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
