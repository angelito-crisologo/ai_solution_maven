import { aismBranding } from "./aism";
import { plansightBranding } from "./plansight";
import type { ProductBranding } from "./types";

export type { ProductBranding } from "./types";

/**
 * Stable slug constants. Use these instead of string literals so a typo
 * is a TS error, not a silent miss. The slug is also the value stored in
 * `product_activations.product_slug` and the directory name under
 * `/branding/` and `/public/products/`.
 */
export const BRANDS = {
  AISM: "ai-solution-maven",
  PLANSIGHT: "plansight-ai"
} as const;

export type BrandSlug = (typeof BRANDS)[keyof typeof BRANDS];

/**
 * Resolve the design tokens for a brand by slug. Returns AISM if the slug
 * is unknown — the parent brand is the safe default.
 */
export function getBranding(slug: BrandSlug | string): ProductBranding {
  switch (slug) {
    case BRANDS.PLANSIGHT:
      return plansightBranding;
    case BRANDS.AISM:
    default:
      return aismBranding;
  }
}

export { aismBranding, plansightBranding };
