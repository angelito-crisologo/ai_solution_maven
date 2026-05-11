import { NextResponse } from "next/server";
import { z } from "zod";
import { setWeekStartDay } from "@/lib/auth/preferences";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const requestSchema = z.object({
  weekStartDay: z.enum(["monday", "sunday"])
});

/**
 * Update the signed-in user's account preferences. Currently only handles
 * week_start_day for the Weekly Report; broader preferences extend the
 * Zod schema without changing the route surface.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to update preferences." },
      { status: 401 }
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request. Expected { weekStartDay: 'monday' | 'sunday' }." },
      { status: 400 }
    );
  }

  try {
    await setWeekStartDay(user.id, parsed.data.weekStartDay);
    return NextResponse.json({ ok: true, weekStartDay: parsed.data.weekStartDay });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update preferences.";
    return NextResponse.json(
      { error: `Failed to update preferences: ${message}` },
      { status: 500 }
    );
  }
}
