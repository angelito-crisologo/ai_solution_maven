import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { revokeShareForUser } from "@/lib/plansight-ai/share-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  shareId: z.string().min(1)
});

/**
 * Soft-revoke a share link. Sets share_revoked_at = now() and bumps
 * share_password_version so any in-flight stakeholder cookies become
 * invalid immediately. Available to signed-in users (Free + Pro) for
 * plans they own. Revocation is reversible via /api/plansight/share/restore.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to revoke share links." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "shareId is required." }, { status: 400 });
  }

  try {
    const updated = await revokeShareForUser(parsed.data.shareId, user.id);
    if (!updated) {
      return NextResponse.json(
        { error: "Share not found or not owned by you." },
        { status: 404 }
      );
    }
    return NextResponse.json({ revoked: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revoke share link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
