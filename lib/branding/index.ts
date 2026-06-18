import { aismBranding } from "./aism";
import type { ProductBranding } from "./types";

export type { ProductBranding } from "./types";

export const BRANDS = {
  AISM: "ai-solution-maven",
} as const;

export type BrandSlug = (typeof BRANDS)[keyof typeof BRANDS];

export function getBranding(_slug?: string): ProductBranding {
  return aismBranding;
}

export { aismBranding };
