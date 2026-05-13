import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  shareCookieName,
  signSharePayload,
  verifySharePassword,
  SHARE_COOKIE_LIFETIME_SECONDS
} from "@/lib/plansight-ai/share-security";
import {
  countRecentFailedShareAttempts,
  getSharePasswordHashAndVersion,
  getShareSecurityStatus,
  logShareAccessAttempt,
  SHARE_PASSWORD_RATE_LIMIT_THRESHOLD
} from "@/lib/plansight-ai/share-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_FAIL_QUERY = "?error=1";

/**
 * Read the client IP. On Vercel the platform sets x-forwarded-for to the
 * real edge IP, comma-separated if there are upstreams. Fall back to a
 * placeholder so logging never throws — the rate limit will still work
 * because all unknown-IP requests share one bucket.
 */
function getClientIp(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "0.0.0.0";
}

function failureRedirect(shareId: string): NextResponse {
  // All failure modes (wrong password, rate-limited, revoked, no such
  // share, password not set) redirect to the same prompt URL with the
  // same generic error param. Spec §"Critical security requirements".
  return NextResponse.redirect(
    new URL(
      `/share/${encodeURIComponent(shareId)}/password${GENERIC_FAIL_QUERY}`,
      // base resolved by NextResponse.redirect when given a string-like URL
      "http://placeholder"
    ),
    { status: 303 }
  );
}

/**
 * Same redirect shape but built against an absolute request URL so the
 * Set-Cookie header is applied to the right host. NextResponse.redirect
 * needs an absolute URL — we synthesize it from the incoming request.
 */
function redirectWithCookie(
  request: Request,
  destination: string,
  cookieHeader?: string
): NextResponse {
  const url = new URL(destination, request.url);
  const response = NextResponse.redirect(url, { status: 303 });
  if (cookieHeader) {
    response.headers.append("Set-Cookie", cookieHeader);
  }
  return response;
}

/**
 * Verify a stakeholder's password against a share link. On success, set
 * an HMAC-signed cookie scoped to that share and 303 back to /share/<id>.
 * On any failure mode, 303 to the prompt page with ?error=1 — no
 * information about which failure mode triggered (wrong password vs
 * lockout vs revoked vs nonexistent).
 *
 * Form-encoded body keeps this submittable without JS from the prompt
 * page. Fields:
 *   - shareId: string
 *   - password: string
 */
export async function POST(request: Request) {
  const ip = getClientIp();
  let shareId = "";
  let password = "";

  try {
    const form = await request.formData();
    shareId = String(form.get("shareId") ?? "");
    password = String(form.get("password") ?? "");
  } catch {
    // Malformed body — redirect to a generic password page with no shareId.
    return redirectWithCookie(request, "/products/plansight-ai");
  }

  if (!shareId) {
    return redirectWithCookie(request, "/products/plansight-ai");
  }

  // Rate-limit gate. Lockout is silent — same redirect as wrong password.
  const recentFailures = await countRecentFailedShareAttempts(shareId, ip);
  if (recentFailures >= SHARE_PASSWORD_RATE_LIMIT_THRESHOLD) {
    // Don't even log this as another attempt — that would extend the
    // lockout indefinitely while the attacker hammers it. Just bounce.
    return redirectWithCookie(
      request,
      `/share/${encodeURIComponent(shareId)}/password${GENERIC_FAIL_QUERY}`
    );
  }

  // Resolve the security state. Revoked / nonexistent / no password
  // → indistinguishable generic failure.
  const status = await getShareSecurityStatus(shareId);
  if (!status.exists || status.revoked || !status.hasPassword) {
    await logShareAccessAttempt(shareId, ip, false);
    return redirectWithCookie(
      request,
      `/share/${encodeURIComponent(shareId)}/password${GENERIC_FAIL_QUERY}`
    );
  }

  const credentials = await getSharePasswordHashAndVersion(shareId);
  if (!credentials) {
    await logShareAccessAttempt(shareId, ip, false);
    return redirectWithCookie(
      request,
      `/share/${encodeURIComponent(shareId)}/password${GENERIC_FAIL_QUERY}`
    );
  }

  const ok = await verifySharePassword(password, credentials.hash);
  if (!ok) {
    await logShareAccessAttempt(shareId, ip, false);
    return redirectWithCookie(
      request,
      `/share/${encodeURIComponent(shareId)}/password${GENERIC_FAIL_QUERY}`
    );
  }

  // Success — log, issue cookie, redirect to share view.
  await logShareAccessAttempt(shareId, ip, true);
  const token = signSharePayload(shareId, credentials.passwordVersion);
  const cookieHeader = [
    `${shareCookieName(shareId)}=${token}`,
    `Path=/share/${shareId}`,
    `Max-Age=${SHARE_COOKIE_LIFETIME_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax"
  ].join("; ");

  return redirectWithCookie(
    request,
    `/share/${encodeURIComponent(shareId)}`,
    cookieHeader
  );
}
