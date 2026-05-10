import type { ProductBranding } from "./types";

/**
 * PlanSight AI — flagship product under AI Solution Maven.
 *
 * Source of truth for the design intent: `/branding/plansight-ai/BRANDKIT.md`.
 * Currently inherits AISM colors as a starting point — diverge here whenever
 * the BRANDKIT.md updates with a distinct palette.
 */
export const plansightBranding: ProductBranding = {
  slug: "plansight-ai",
  name: "PlanSight AI",
  tagline: "Upload a plan, understand it fast, and share a clear stakeholder view.",
  colors: {
    // TODO(brand): swap to teal/emerald once the PlanSight palette is locked.
    primary: "#2563EB",
    primaryFg: "#FFFFFF",
    secondary: "#7C3AED",
    accent: "#34D399",
    dark: "#0F172A",
    light: "#F8FAFC",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444"
  },
  gradients: {
    brand: "linear-gradient(135deg, #34D399 0%, #2563EB 100%)",
    headerBg: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #1E293B 100%)"
  },
  assets: {
    icon: "/products/plansight-ai/icon.svg",
    logo: "/products/plansight-ai/logo.svg",
    ogImage: "/products/plansight-ai/og-image.png"
  },
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
};
