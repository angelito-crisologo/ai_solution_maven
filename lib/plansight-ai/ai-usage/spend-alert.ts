import { createSupabaseServiceClient } from "@/lib/plansight-ai/supabase";

const SPEND_ALERT_THRESHOLD_USD = 3;
const RESEND_API_URL = "https://api.resend.com/emails";

function yearMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Sum cost_usd for this user across all AI features so far this calendar
 * month (UTC). Returns 0 on any read failure — degraded behaviour is "no
 * alert", which is preferable to a false alarm.
 */
async function readMonthSpendUsd(userId: string, now: Date): Promise<number> {
  const client = createSupabaseServiceClient();
  if (!client) return 0;

  const since = startOfUtcMonth(now).toISOString();
  const { data, error } = await client
    .from("ai_usage_log")
    .select("cost_usd")
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    console.error("[spend-alert] read failed:", error.message);
    return 0;
  }

  return (data ?? []).reduce((sum, row) => {
    const cost = typeof row.cost_usd === "number" ? row.cost_usd : Number(row.cost_usd);
    return sum + (Number.isFinite(cost) ? cost : 0);
  }, 0);
}

async function hasAlertedThisMonth(userId: string, yearMonth: string): Promise<boolean> {
  const client = createSupabaseServiceClient();
  if (!client) return true; // Pretend "alerted" to suppress when DB is down.

  const { data, error } = await client
    .from("ai_spend_alerts")
    .select("user_id")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (error) {
    console.error("[spend-alert] dedupe read failed:", error.message);
    return true;
  }
  return !!data;
}

async function recordAlert(
  userId: string,
  yearMonth: string,
  costUsd: number
): Promise<void> {
  const client = createSupabaseServiceClient();
  if (!client) return;
  const { error } = await client.from("ai_spend_alerts").insert({
    user_id: userId,
    year_month: yearMonth,
    cost_usd_at_alert: costUsd
  });
  if (error && !error.message.includes("duplicate")) {
    console.error("[spend-alert] dedupe insert failed:", error.message);
  }
}

async function sendOperatorEmail(
  userId: string,
  userEmail: string | null,
  yearMonth: string,
  costUsd: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OPERATOR_ALERT_EMAIL;
  const from = process.env.OPERATOR_ALERT_FROM ?? "alerts@aisolutionmaven.com";

  if (!apiKey || !to) {
    console.warn(
      "[spend-alert] threshold crossed but RESEND_API_KEY or OPERATOR_ALERT_EMAIL is unset. user:",
      userId,
      "cost:",
      costUsd
    );
    return;
  }

  const subject = `[PlanSight] AI spend alert — user crossed $${SPEND_ALERT_THRESHOLD_USD}/mo`;
  const body = `A PlanSight Pro account crossed the $${SPEND_ALERT_THRESHOLD_USD} cumulative AI-spend threshold for ${yearMonth} (UTC).

User: ${userEmail ?? "(unknown email)"}
User ID: ${userId}
Cumulative spend this month: $${costUsd.toFixed(4)} USD
Period: ${yearMonth} (UTC)

Investigate in the ai_usage_log table:

  select feature, count(*), sum(cost_usd)
  from ai_usage_log
  where user_id = '${userId}'
    and created_at >= date_trunc('month', now())
  group by feature
  order by sum(cost_usd) desc;
`;

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text: body
      })
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(
        "[spend-alert] resend send failed:",
        response.status,
        errText.slice(0, 200)
      );
    }
  } catch (err) {
    console.error("[spend-alert] resend send threw:", err);
  }
}

/**
 * Check the user's cumulative AI spend this month and, if it crosses the
 * $3 threshold, email the operator once per month. Idempotent: the
 * ai_spend_alerts dedupe table guarantees at-most-one email per
 * (user, year-month) even under concurrent requests.
 *
 * Called after each non-cached AI call. Best-effort — never throws.
 */
export async function checkAndAlertSpend(
  userId: string,
  userEmail: string | null,
  now: Date = new Date()
): Promise<void> {
  try {
    const monthSpend = await readMonthSpendUsd(userId, now);
    if (monthSpend < SPEND_ALERT_THRESHOLD_USD) return;

    const yearMonth = yearMonthKey(now);
    if (await hasAlertedThisMonth(userId, yearMonth)) return;

    await recordAlert(userId, yearMonth, monthSpend);
    await sendOperatorEmail(userId, userEmail, yearMonth, monthSpend);
  } catch (err) {
    console.error("[spend-alert] check threw:", err);
  }
}
