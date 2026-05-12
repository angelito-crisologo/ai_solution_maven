/**
 * Single source of truth for product slugs.
 *
 * The same slug string is used in three places:
 *   1. The directory name under `app/products/<slug>/` (URL routing)
 *   2. The value stored in `product_activations.product_slug` (DB)
 *   3. The brand key in `lib/branding/index.ts` (design tokens)
 *
 * Defining the slug here once means adding a new product is a one-line
 * change. A typo at any callsite becomes a TS error, not a silent miss
 * (e.g. branding resolves but activation writes the wrong slug).
 *
 * AISM (the parent brand) is intentionally not a product — it has
 * branding but no `product_activations` row.
 */
export const PRODUCT_SLUGS = {
  PLANSIGHT: "plansight-ai"
} as const;

export type ProductSlug = (typeof PRODUCT_SLUGS)[keyof typeof PRODUCT_SLUGS];

/** Runtime guard — narrows an arbitrary string to a known product slug. */
export function isProductSlug(value: string | null | undefined): value is ProductSlug {
  if (!value) return false;
  return (Object.values(PRODUCT_SLUGS) as string[]).includes(value);
}

/** Coerce an arbitrary string to a known product slug or null. */
export function asProductSlug(value: string | null | undefined): ProductSlug | null {
  return isProductSlug(value) ? value : null;
}
