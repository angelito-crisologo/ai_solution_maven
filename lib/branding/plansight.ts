import type { ProductBranding } from "./types";

/**
 * PlanSight AI — flagship product under AI Solution Maven.
 *
 * Source of truth for the design intent: `/branding/plansight-ai/docs/`.
 * The brand pack ships full guidance — see `BRAND-FULL.md` for one-shot
 * context or the individual docs (colors.md, typography.md, voice.md, etc.).
 *
 * The brand is "quiet intelligence" — single cyan accent on deep navy with
 * slate neutrals. Two-tone wordmark: "Plan" muted slate, "Sight" cyan.
 */
export const plansightBranding: ProductBranding = {
  slug: "plansight-ai",
  name: "PlanSight AI",
  tagline: "Your project plan, finally legible.",
  colors: {
    /** Sightline cyan. Used for CTA bg, focus rings, brand mark, the
     * "Sight" half of the wordmark on dark surfaces. */
    primary: "#22D3EE",
    /** Foreground on cyan CTA — deep navy is the highest-contrast pair
     * brand-pack approves on cyan-400. */
    primaryFg: "#0B1220",
    /** Cyan-700: hover state on cyan CTA, the "Sight" half of the
     * wordmark on light surfaces, link color on light bg. */
    secondary: "#0891B2",
    /** Cyan-400 doubles as the precious accent — single moment per view. */
    accent: "#22D3EE",
    /** Deep slate / ink. Primary surface on dark, headings on light. */
    dark: "#0B1220",
    /** Light page background. */
    light: "#F8FAFC",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444"
  },
  gradients: {
    /** Brand-pack restricts decorative gradients. Keep flat where possible;
     * if a gradient is unavoidable, navy → navy-800 only. */
    brand: "#22D3EE",
    headerBg: "#0B1220"
  },
  assets: {
    icon: "/products/plansight-ai/favicon.ico",
    logo: "/products/plansight-ai/brand/plansight-logo-primary.svg",
    ogImage: "/products/plansight-ai/og-default.png"
  },
  fontFamily:
    "Inter, 'Geist Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
};
