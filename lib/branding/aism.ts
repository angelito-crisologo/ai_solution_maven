import type { ProductBranding } from "./types";

/**
 * AI Solution Maven — the parent / portfolio brand.
 *
 * Source of truth for the design intent: `/branding/ai-solution-maven/BRANDKIT.md`.
 * Update this file in lock-step with the brand kit when colors or copy change.
 */
export const aismBranding: ProductBranding = {
  slug: "ai-solution-maven",
  name: "AI Solution Maven",
  tagline: "Building AI-powered solutions that solve real problems.",
  colors: {
    primary: "#2563EB",
    primaryFg: "#FFFFFF",
    secondary: "#7C3AED",
    accent: "#10B981",
    dark: "#0F172A",
    light: "#F8FAFC",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444"
  },
  gradients: {
    brand: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
    headerBg: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
  },
  assets: {
    // AISM uses Next.js file-convention icons under app/ today; these paths
    // are kept for forward-compat when a /public/aism/ folder gets populated.
    icon: "/icon.svg",
    logo: "/icon.svg",
    ogImage: "/opengraph-image"
  },
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
};
