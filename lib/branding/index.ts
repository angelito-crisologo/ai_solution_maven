import { PRODUCT_SLUGS } from "@/lib/products";
import { aismBranding } from "./aism";
import { plansightBranding } from "./plansight";
import type { ProductBranding } from "./types";

export type { ProductBranding } from "./types";

/**
 * Brand slug registry. Product slugs come from the single source of truth
 * in `lib/products.ts`; AISM is added on top because the parent brand has
 * design tokens but isn't an activatable product.
 *
 * The slug doubles as the directory name under `/branding/` and
 * `/public/products/`, and matches `product_activations.product_slug`
 * for activatable products.
 */
export const BRANDS = {
  AISM: "ai-solution-maven",
  ...PRODUCT_SLUGS
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
