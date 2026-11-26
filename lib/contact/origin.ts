/**
 * Same-origin check for the contact form. The browser's Origin header (or
 * Referer, if Origin is missing) must match the host that received the
 * request. This works for production, Vercel previews and localhost alike.
 */
export function isSameOrigin(headers: Headers): boolean {
  const host = (headers.get("x-forwarded-host") ?? headers.get("host"))?.split(",")[0]?.trim();
  if (!host) return false;

  const source = headers.get("origin") ?? headers.get("referer");
  if (!source || source === "null") return false;

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}
