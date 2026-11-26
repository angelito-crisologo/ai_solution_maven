import type { Config } from "tailwindcss";

/**
 * Design tokens for aisolutionmaven.com, taken from the Claude Design export
 * ("Design System" file). Colours, type, spacing and radii here are the
 * source of truth; components should use these names, not raw hex values.
 *
 * Teal rule: Teal 500 (#1094a3) is for the mark and block graphics only.
 * Teal 700 (#0b6c78) carries all text, links, button fills and focus rings.
 * White on Teal 500 is 3.6:1 and fails WCAG AA.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts}",
  ],
  theme: {
    // Breakpoints from the design. 375, 768 and 1280 are the review widths;
    // the full nav row shows from 1024. "two", "three" and "cred" are the
    // design's own column switch points (720, 860 and 1080 px).
    screens: {
      xs: "375px",
      two: "720px",
      md: "768px",
      three: "860px",
      nav: "1024px",
      cred: "1080px",
      xl: "1280px",
    },
    extend: {
      colors: {
        navy: {
          900: "#132440", // headings, dark bands
          100: "#d3dae4", // text on navy
        },
        ink: {
          700: "#3d4a5f", // body text
          500: "#5b6779", // help text, captions
          400: "#7b8798", // input borders
        },
        line: "#dbe1e8", // card borders, rules
        surface: "#f5f7f9", // alternate sections
        teal: {
          50: "#e8f5f6", // demo label, tints
          500: "#1094a3", // brand accent, graphics only
          700: "#0b6c78", // buttons, links, focus
        },
        error: {
          DEFAULT: "#b3261e",
          tint: "#fdf1f0",
        },
        success: {
          DEFAULT: "#1a6b3c",
          tint: "#edf7f1",
        },
        placeholder: {
          ink: "#6b4700",
          tint: "#fff4d6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid between 375 and 1280 px, as in the design. Nothing below 14 px.
        display: [
          "clamp(36px, 4.5vw, 56px)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h2: [
          "clamp(28px, 3.2vw, 40px)",
          { lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: "700" },
        ],
        h3: ["22px", { lineHeight: "1.3", fontWeight: "600" }],
        lead: ["clamp(20px, 1.8vw, 22px)", { lineHeight: "1.5" }],
        "lead-sm": ["clamp(18px, 1.7vw, 20px)", { lineHeight: "1.6" }],
        body: ["18px", { lineHeight: "1.6" }],
        "body-sm": ["17px", { lineHeight: "1.5" }],
        small: ["16px", { lineHeight: "1.5" }],
        caption: ["15px", { lineHeight: "1.4" }],
        label: ["14px", { lineHeight: "1.4", fontWeight: "600" }],
      },
      spacing: {
        gutter: "var(--gutter)",
        section: "var(--section-y)",
        "section-lg": "var(--section-y-lg)",
        "card-gap": "var(--card-gap)",
        stack: "var(--stack-gap)",
      },
      maxWidth: {
        content: "1120px",
        prose: "68ch",
      },
      borderRadius: {
        tag: "4px",
        image: "6px",
        control: "8px",
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
