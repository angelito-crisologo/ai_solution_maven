import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAnonClient, isSupabaseConfigured } from "@/lib/plansight-ai/supabase";

export const runtime = "nodejs";

type FeedbackType = "general_feedback" | "feature_request" | "bug_report";
type Severity = "low" | "medium" | "high" | "critical" | null;

const allowedTypes = new Set<FeedbackType>([
  "general_feedback",
  "feature_request",
  "bug_report"
]);

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFeedbackType(value: unknown): FeedbackType | null {
  return typeof value === "string" && allowedTypes.has(value as FeedbackType)
    ? (value as FeedbackType)
    : null;
}

function normalizeSeverity(value: unknown): Severity {
  if (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }

  return null;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      },
      { status: 500 }
    );
  }

  const client = createSupabaseAnonClient();
  if (!client) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      },
      { status: 500 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const feedbackType = normalizeFeedbackType(body.feedbackType);
  const subject = cleanString(body.subject);
  const message = cleanString(body.message);
  const name = cleanString(body.name) || null;
  const email = cleanString(body.email) || null;
  const severity = normalizeSeverity(body.severity);
  const stepsToReproduce = cleanString(body.stepsToReproduce) || null;
  const desiredOutcome = cleanString(body.desiredOutcome) || null;
  const product = cleanString(body.product) || "AI Solution Maven";
  const pagePath = cleanString(body.pagePath) || null;
  const pageUrl = cleanString(body.pageUrl) || request.headers.get("referer");
  const shareId = cleanString(body.shareId) || null;
  const planTitle = cleanString(body.planTitle) || null;
  const sourceContext = cleanString(body.sourceContext) || null;
  const browser = cleanString(body.browser) || null;

  if (!feedbackType) {
    return NextResponse.json(
      { error: "Please choose a feedback type." },
      { status: 400 }
    );
  }

  if (!subject || !message) {
    return NextResponse.json(
      { error: "Please add a subject and details." },
      { status: 400 }
    );
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const { error } = await client.from("feedback_submissions").insert({
    feedback_type: feedbackType,
    subject,
    message,
    name,
    email,
    product,
    page_path: pagePath,
    page_url: pageUrl,
    share_id: shareId,
    plan_title: planTitle,
    source_context: sourceContext,
    severity,
    steps_to_reproduce: stepsToReproduce,
    desired_outcome: desiredOutcome,
    browser,
    user_agent: request.headers.get("user-agent"),
    metadata: {
      referer: request.headers.get("referer"),
      submitted_from: "web"
    }
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
        code: error.code ?? null
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
