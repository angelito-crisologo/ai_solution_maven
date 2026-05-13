const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Best-effort operator email. Used by the billing webhook for events
 * that need human attention (disputes, chargebacks). Never throws —
 * silent failure is preferable to a 500 that triggers Stripe retries.
 *
 * Reads RESEND_API_KEY, OPERATOR_ALERT_EMAIL, OPERATOR_ALERT_FROM.
 * Mirrors the pattern in lib/plansight-ai/ai-usage/spend-alert.ts.
 */
export async function sendOperatorAlert(
  subject: string,
  body: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OPERATOR_ALERT_EMAIL;
  const from = process.env.OPERATOR_ALERT_FROM ?? "alerts@aisolutionmaven.com";

  if (!apiKey || !to) {
    console.warn(
      "[operator-alert] RESEND_API_KEY or OPERATOR_ALERT_EMAIL unset; skipping:",
      subject
    );
    return;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from, to, subject, text: body })
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(
        "[operator-alert] resend send failed:",
        response.status,
        errText.slice(0, 200)
      );
    }
  } catch (err) {
    console.error("[operator-alert] resend send threw:", err);
  }
}
