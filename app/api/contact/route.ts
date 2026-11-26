import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { isSameOrigin } from "@/lib/contact/origin";
import { clientIp, createRateLimiter } from "@/lib/contact/rateLimit";
import {
  fieldErrors,
  HONEYPOT_FIELD,
  normalise,
  singleLine,
  tooLong,
} from "@/lib/contact/validate";

/**
 * Contact form endpoint.
 *
 * Request: JSON { name, email, message, organisation?, projectType?,
 * timeline? }. name, email and message are required. projectType and
 * timeline are no longer on the form but are still accepted.
 *
 * Responses: 200 { ok: true }; 400 { error, code: "invalid", fields? };
 * 403 { error, code: "forbidden" }; 429 { error, code: "rate_limited" };
 * 500/502 { error, code: "send_failed" }. Messages are generic: provider
 * errors and configuration details are logged on the server only.
 */

export const runtime = "nodejs";

const allow = createRateLimiter();

const SEND_FAILED = `The message did not send. Please try again, or email ${site.email}.`;

function fail(status: number, code: string, error: string, extra?: object) {
  return NextResponse.json({ error, code, ...extra }, { status });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) {
    return fail(403, "forbidden", SEND_FAILED);
  }

  if (!allow(clientIp(request.headers))) {
    return fail(
      429,
      "rate_limited",
      "Too many messages from this address. Please try again later, or email me.",
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid", SEND_FAILED);
  }

  // Honeypot: real visitors never see this field. Pretend success.
  const trap = (payload as Record<string, unknown> | null)?.[HONEYPOT_FIELD];
  if (typeof trap === "string" && trap.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const input = normalise(payload);
  const fields = fieldErrors(input);
  if (Object.keys(fields).length > 0) {
    return fail(400, "invalid", "Please check the highlighted fields.", { fields });
  }
  if (tooLong(input)) {
    return fail(400, "invalid", SEND_FAILED);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !fromEmail || !toEmail) {
    console.error("[contact] Email is not configured: missing Resend settings.");
    return fail(500, "send_failed", SEND_FAILED);
  }

  const name = singleLine(input.name);
  const email = singleLine(input.email);
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Organisation: ${singleLine(input.organisation) || "Not given"}`,
  ];
  if (input.projectType) lines.push(`Project type: ${singleLine(input.projectType)}`);
  if (input.timeline) lines.push(`Timeline: ${singleLine(input.timeline)}`);
  lines.push("", input.message);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: singleLine(`Project enquiry from ${name}`).slice(0, 150),
        reply_to: email,
        text: lines.join("\n"),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[contact] Resend returned ${response.status}: ${body.slice(0, 500)}`);
      return fail(502, "send_failed", SEND_FAILED);
    }
  } catch (error) {
    console.error("[contact] Resend request failed:", error);
    return fail(502, "send_failed", SEND_FAILED);
  }

  return NextResponse.json({ ok: true });
}
