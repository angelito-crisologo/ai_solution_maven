import type { Config } from "tailwindcss";

/**
 * Tailwind theme is shared across AISM and PlanSight pages. AISM tokens
 * (`primary`, `secondary`, `dark`, `light`) keep the legacy values so the
 * portfolio pages stay intact. PlanSight pages reach for the brand-pack
 * tokens directly: `bg-navy`, `text-ink`, `text-cyan-400`, `bg-cyan-700`.
 *
 * Brand sources of truth:
 * - AISM:      `/branding/ai-solution-maven/BRANDKIT.md` + `/lib/branding/aism.ts`
 * - PlanSight: `/branding/plansight-ai/docs/` + `/lib/branding/plansight.ts`
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // AISM portfolio tokens (do not change without an AISM brand update)
        primary: "#2563EB",
        secondary: "#7C3AED",
        dark: "#0F172A",
        light: "#F8FAFC",

        // PlanSight tokens — see /branding/plansight-ai/docs/colors.md
        // Tailwind already ships `cyan` (400 = #22D3EE, 700 = #0891B2) and
        // `slate` (which the brand is built on); we only need to add navy
        // and the ink alias.
        navy: {
          DEFAULT: "#0B1220", // primary surface on dark
          800: "#1A2332",     // secondary surface on dark
        },
        ink: "#0B1220",       // headings on light, max-contrast text
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SF Mono",
          "monospace",
        ],
      },
      fontSize: {
        // PlanSight type scale — see /branding/plansight-ai/docs/typography.md
        // Namespaced as text-h1, text-h2 etc so they don't collide with
        // Tailwind's text-xl, text-2xl defaults that AISM already uses.
        micro:    ["11px", { lineHeight: "14px", letterSpacing: "0.05em", fontWeight: "600" }],
        caption:  ["12px", { lineHeight: "18px" }],
        body:     ["14px", { lineHeight: "22px" }],
        "body-lg":["16px", { lineHeight: "26px" }],
        lead:     ["18px", { lineHeight: "28px" }],
        h3:       ["18px", { lineHeight: "28px", fontWeight: "600" }],
        h2:       ["24px", { lineHeight: "32px", fontWeight: "600" }],
        h1:       ["32px", { lineHeight: "40px", fontWeight: "600", letterSpacing: "-0.02em" }],
        display:  ["48px", { lineHeight: "56px", fontWeight: "600", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        // AISM legacy
        soft: "0 24px 80px rgba(15, 23, 42, 0.12)",
        // PlanSight navy-tinted shadows — see brand-pack tokens.md
        card:        "0 1px 3px rgba(11,18,32,0.08), 0 4px 12px rgba(11,18,32,0.04)",
        "card-hover":"0 2px 6px rgba(11,18,32,0.10), 0 8px 20px rgba(11,18,32,0.06)",
        modal:       "0 4px 12px rgba(11,18,32,0.12), 0 16px 48px rgba(11,18,32,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
