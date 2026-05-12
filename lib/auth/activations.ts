import {
  createSupabaseServerClient
} from "./supabase-server";
import {
  createSupabaseServiceClient,
  isSupabaseServiceConfigured
} from "@/lib/supabase/service";
import type { ProductSlug } from "@/lib/products";

export type ProductTier = "free" | "pro";

export type ProductActivation = {
  userId: string;
  productSlug: string;
  tier: ProductTier;
  activatedAt: string;
};

/**
 * Stable product slugs. Re-exported from the single source of truth in
 * `lib/products.ts` for backwards compatibility with existing callsites.
 */
export { PRODUCT_SLUGS as PRODUCTS } from "@/lib/products";
export type { ProductSlug } from "@/lib/products";

type ActivationRow = {
  user_id: string;
  product_slug: string;
  tier: ProductTier;
  activated_at: string;
};

function rowToActivation(row: ActivationRow): ProductActivation {
  return {
    userId: row.user_id,
    productSlug: row.product_slug,
    tier: row.tier,
    activatedAt: row.activated_at
  };
}

/**
 * Read the activation row for a user + product. Uses the user's session
 * client (RLS allows self-read) so this works without service-role.
 * Returns null when the user has not activated this product yet.
 */
export async function getProductActivation(
  userId: string,
  productSlug: ProductSlug
): Promise<ProductActivation | null> {
  let client;
  try {
    client = createSupabaseServerClient();
  } catch {
    return null;
  }

  const { data, error } = await client
    .from("product_activations")
    .select("user_id, product_slug, tier, activated_at")
    .eq("user_id", userId)
    .eq("product_slug", productSlug)
    .maybeSingle<ActivationRow>();

  if (error || !data) {
    return null;
  }

  return rowToActivation(data);
}

/**
 * Insert (or no-op if exists) an activation row for the given user +
 * product. Uses the service-role key because RLS doesn't permit anon
 * writes. Idempotent — calling multiple times is safe; the first row
 * wins for activated_at.
 */
export async function activateProduct(
  userId: string,
  productSlug: ProductSlug
): Promise<ProductActivation> {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the server environment."
    );
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }

  const { data, error } = await client
    .from("product_activations")
    .upsert(
      { user_id: userId, product_slug: productSlug },
      { onConflict: "user_id,product_slug", ignoreDuplicates: true }
    )
    .select("user_id, product_slug, tier, activated_at")
    .maybeSingle<ActivationRow>();

  if (error) {
    throw error;
  }

  if (data) {
    return rowToActivation(data);
  }

  // ignoreDuplicates returns no row when the row already existed; fetch it.
  const { data: existing, error: existingError } = await client
    .from("product_activations")
    .select("user_id, product_slug, tier, activated_at")
    .eq("user_id", userId)
    .eq("product_slug", productSlug)
    .maybeSingle<ActivationRow>();

  if (existingError || !existing) {
    throw existingError ?? new Error("Failed to fetch activation row after upsert.");
  }

  return rowToActivation(existing);
}

export function isPlansightActivated(activation: ProductActivation | null): boolean {
  return !!activation;
}

export function isPlansightPro(activation: ProductActivation | null): boolean {
  return activation?.tier === "pro";
}
