# Design tokens

Copy-paste Tailwind config and CSS variables. This is the single implementation source of truth — when in doubt, use tokens, not arbitrary values.

## Tailwind config

Drop into `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand
        navy: {
          DEFAULT: "#0B1220",   // deep slate, primary surface
          800: "#1A2332",       // secondary surface
        },
        cyan: {
          // Tailwind's defaults match our palette already; reaffirming for clarity
          50:  "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",  // sightline cyan — primary accent
          500: "#06B6D4",
          600: "#0891B2",  // wordmark "Sight"
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        // 'ink' alias — same as navy.DEFAULT, for text-on-light usage
        ink: "#0B1220",
      },
      fontFamily: {
        sans: ['Inter', 'Geist Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SF Mono', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        // Aligned with typography.md scale
        'micro':   ['11px',  { lineHeight: '14px', letterSpacing: '0.05em', fontWeight: '600' }],
        'caption': ['12px',  { lineHeight: '18px' }],
        'body':    ['14px',  { lineHeight: '22px' }],
        'body-lg': ['16px',  { lineHeight: '26px' }],
        'lead':    ['18px',  { lineHeight: '28px' }],
        'h3':      ['18px',  { lineHeight: '28px', fontWeight: '600' }],
        'h2':      ['24px',  { lineHeight: '32px', fontWeight: '600' }],
        'h1':      ['32px',  { lineHeight: '40px', fontWeight: '600', letterSpacing: '-0.02em' }],
        'display': ['48px',  { lineHeight: '56px', fontWeight: '600', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        // Restricted set — typography.md / components.md
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '0.5': '0.5px',
      },
      boxShadow: {
        // Custom navy-tinted shadows. Don't use Tailwind's defaults.
        'card':       '0 1px 3px rgba(11,18,32,0.08), 0 4px 12px rgba(11,18,32,0.04)',
        'card-hover': '0 2px 6px rgba(11,18,32,0.10), 0 8px 20px rgba(11,18,32,0.06)',
        'modal':      '0 4px 12px rgba(11,18,32,0.12), 0 16px 48px rgba(11,18,32,0.10)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
        // 150ms (default) and 300ms only — typography.md's animation rule
      },
      ringWidth: {
        DEFAULT: '2px',
      },
      ringColor: {
        DEFAULT: '#22D3EE',  // cyan-400 — the focus ring
      },
    },
  },
  plugins: [],
};

export default config;
```

## CSS variables (global)

Drop into `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand */
    --color-navy:        11 18 32;     /* #0B1220 */
    --color-navy-800:    26 35 50;     /* #1A2332 */
    --color-cyan-400:    34 211 238;   /* #22D3EE */
    --color-cyan-700:    14 116 144;   /* #0E7490 */
    --color-cyan-600:    8 145 178;    /* #0891B2 */

    /* Neutrals */
    --color-white:       255 255 255;
    --color-slate-50:    248 250 252;
    --color-slate-100:   241 245 249;
    --color-slate-200:   226 232 240;
    --color-slate-300:   203 213 225;
    --color-slate-400:   148 163 184;
    --color-slate-500:   100 116 139;
    --color-slate-600:   71 85 105;
    --color-slate-700:   51 65 85;
    --color-slate-900:   15 23 42;

    /* RAG */
    --color-red-100:     254 226 226;
    --color-red-500:     239 68 68;
    --color-red-800:     153 27 27;
    --color-amber-100:   254 243 199;
    --color-amber-500:   245 158 11;
    --color-amber-800:   146 64 14;
    --color-emerald-100: 209 250 229;
    --color-emerald-500: 16 185 129;
    --color-emerald-800: 6 95 70;

    /* Semantic — light mode */
    --bg-page:        rgb(var(--color-white));
    --bg-surface:     rgb(var(--color-slate-50));
    --bg-card:        rgb(var(--color-white));
    --bg-input:       rgb(var(--color-white));

    --text-primary:   rgb(var(--color-navy));        /* ink */
    --text-secondary: rgb(var(--color-slate-700));
    --text-muted:     rgb(var(--color-slate-500));
    --text-faint:     rgb(var(--color-slate-400));

    --border-default: rgb(var(--color-slate-200));
    --border-strong:  rgb(var(--color-slate-300));
    --border-focus:   rgb(var(--color-cyan-400));

    --accent:         rgb(var(--color-cyan-600));    /* cyan-700 — link/CTA on light */
    --accent-hover:   rgb(var(--color-cyan-700));
  }

  .dark {
    --bg-page:        rgb(var(--color-navy));
    --bg-surface:     rgb(var(--color-navy-800));
    --bg-card:        rgb(var(--color-navy-800));
    --bg-input:       rgb(var(--color-navy-800));

    --text-primary:   rgb(var(--color-slate-100));
    --text-secondary: rgb(var(--color-slate-300));
    --text-muted:     rgb(var(--color-slate-400));
    --text-faint:     rgb(var(--color-slate-500));

    --border-default: rgb(15 23 42);                 /* slate-900 */
    --border-strong:  rgb(var(--color-slate-700));

    --accent:         rgb(var(--color-cyan-400));
    --accent-hover:   rgb(167 243 208);              /* lighter on dark */
  }

  body {
    background: var(--bg-page);
    color: var(--text-primary);
    font-family: theme("fontFamily.sans");
    -webkit-font-smoothing: antialiased;
  }

  /* Tabular numerics by default for any monospace */
  .font-mono { font-variant-numeric: tabular-nums; }

  /* Selection */
  ::selection {
    background: rgb(var(--color-cyan-400) / 0.3);
    color: rgb(var(--color-navy));
  }

  /* Focus rings — non-negotiable */
  *:focus-visible {
    outline: 2px solid rgb(var(--color-cyan-400));
    outline-offset: 2px;
  }
}
```

## Loading the fonts

In `app/layout.tsx`, using Next.js's font optimization:

```tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Then update the Tailwind config to reference the CSS variables:

```ts
fontFamily: {
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
},
```

## Favicon and metadata

Also in `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: {
    default: "PlanSight AI",
    template: "%s — PlanSight AI",
  },
  description: "Upload, visualize, share, and understand project plans with AI insights.",
  metadataBase: new URL("https://plansightai.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: { url: "/favicon-180.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)",  color: "#0B1220" },
  ],
  openGraph: {
    type: "website",
    siteName: "PlanSight AI",
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.png"],
  },
};
```

## Common utility classes

Patterns that recur — give them their own class so the value lives in one place:

```css
@layer components {
  .surface-card {
    @apply bg-white dark:bg-navy-800
           border border-slate-200 dark:border-slate-800
           rounded-lg;
  }

  .text-eyebrow {
    @apply text-[11px] font-semibold tracking-wider uppercase
           text-cyan-600 dark:text-cyan-400;
  }

  .focus-ring {
    @apply focus-visible:outline-none focus-visible:ring-2
           focus-visible:ring-cyan-400 focus-visible:ring-offset-2
           focus-visible:ring-offset-white dark:focus-visible:ring-offset-navy;
  }

  .hairline {
    @apply border-slate-200 dark:border-slate-800;
  }
}
```

## Don't extend without consensus

If you find yourself wanting to add:
- A new color outside this palette
- A new font size outside the scale
- A new shadow, animation duration, or border-radius value

→ Stop and update the brand docs first. Token sprawl is how design systems die.

## Related docs

- `colors.md` — semantic mapping, contrast pairs, RAG colors
- `typography.md` — type scale rationale
- `components.md` — patterns these tokens compose into
