import { createSupabaseServerClient } from "./supabase-server";

export type UserTier = "free" | "pro";

export type CurrentUser = {
  id: string;
  email: string;
  tier: UserTier;
};

/**
 * Resolve the signed-in user + their tier from the server session. Returns
 * null when there is no session or Supabase is not configured. Callers
 * should treat null as "anonymous" — read-only ephemeral access.
 *
 * The public.users row is auto-created by a trigger on auth.users insert,
 * so once a user has signed in there is always a corresponding row.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  let client;
  try {
    client = createSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
    error: authError
  } = await client.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: row, error: rowError } = await client
    .from("users")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle<{ tier: UserTier }>();

  if (rowError) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    tier: row?.tier ?? "free"
  };
}

export function isPro(user: CurrentUser | null): boolean {
  return user?.tier === "pro";
}
