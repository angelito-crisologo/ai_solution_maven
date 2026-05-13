import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import {
  hashSharePassword,
  MIN_SHARE_PASSWORD_LENGTH
} from "@/lib/plansight-ai/share-security";
import { setSharePasswordForUser } from "@/lib/plansight-ai/share-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  shareId: z.string().min(1),
  // Send `password: null` to clear; otherwise the new plaintext password.
  password: z
    .union([z.string().min(MIN_SHARE_PASSWORD_LENGTH), z.null()])
});

/**
 * Set, change, or clear the password on a share link. Pro-only —
 * password-protected sharing is a paid feature. Always increments
 * share_password_version, which invalidates any existing stakeholder
 * cookies on that share. Use POST (not PATCH) so the form-encoded path
 * stays simple for client callers; idempotency comes from "send the
 * desired final state" semantics.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to manage share passwords." },
      { status: 401 }
    );
  }

  const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
  if (activation?.tier !== "pro") {
    return NextResponse.json(
      {
        error:
          "Password-protected share links are a Pro feature. Upgrade to enable."
      },
      { status: 403 }
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
    return NextResponse.json(
      {
        error: `Password must be a string of at least ${MIN_SHARE_PASSWORD_LENGTH} characters, or null to clear.`
      },
      { status: 400 }
    );
  }

  try {
    const hash =
      parsed.data.password === null
        ? null
        : await hashSharePassword(parsed.data.password);
    const updated = await setSharePasswordForUser(
      parsed.data.shareId,
      user.id,
      hash
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Share not found or not owned by you." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      passwordSet: parsed.data.password !== null
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
