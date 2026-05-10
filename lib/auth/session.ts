import { createSupabaseServerClient } from "./supabase-server";

export type CurrentUser = {
  id: string;
  email: string;
};

/**
 * Resolve the signed-in user from the server session. Returns null when
 * there is no session or Supabase is not configured.
 *
 * Tier and product opt-in moved to product_activations (Phase 4b). Use
 * getProductActivation() from lib/auth/activations.ts for product-scoped
 * gates instead of asking session for tier.
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

  return {
    id: user.id,
    email: user.email ?? ""
  };
}
