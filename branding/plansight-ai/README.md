# PlanSight AI — Brand Assets

Drop-in brand kit for the PlanSight AI product page.

## What's included

### `docs/` — brand system documentation (Markdown, Claude-friendly)
| File | What it covers |
|---|---|
| `README.md` | Index — start here, tells you which other files to load for which task |
| `brand-essence.md` | What PlanSight is, who it's for, the brand promise |
| `voice.md` | Copy guidelines, do-say/don't-say, banned words |
| `colors.md` | Full palette with hex, Tailwind names, semantic mapping |
| `typography.md` | Type stack and scale |
| `logo.md` | Which lockup when, clear space, sizing |
| `components.md` | Buttons, cards, inputs, badges — opinionated defaults |
| `data-display.md` | Gantt chart, task table, RAG indicators, metrics |
| `share-view.md` | Stakeholder share-page conventions |
| `tokens.md` | Copy-paste Tailwind config + CSS variables |
| `assets.md` | Every SVG and favicon file with usage |
| `donts.md` | Explicit "do not do this" list |
| `BRAND-FULL.md` | All of the above concatenated, for one-shot context |

When working with Claude on a UI task, paste 2–4 relevant files into the conversation. For most tasks, the minimum useful set is `colors.md` + `typography.md` + `tokens.md` + the task-specific doc. For complete context in one paste, use `BRAND-FULL.md`.

### `svg/` — vector logos
| File | Use it for |
|---|---|
| `plansight-logo-primary.svg` | Marketing site header on light backgrounds, email signatures, README hero |
| `plansight-logo-primary-dark.svg` | Same as primary, but tuned for dark backgrounds |
| `plansight-logo-stacked.svg` | Square avatars (LinkedIn, GitHub org), social cards, hero center alignments |
| `plansight-logo-monochrome.svg` | Single-color contexts. Uses `currentColor` — set the parent's `color:` CSS to recolor |
| `plansight-monogram-dark.svg` | Primary app icon — dark navy background |
| `plansight-monogram-light.svg` | App icon variant for white/light surfaces |
| `plansight-monogram-simplified.svg` | Tiny-size variant (≤32px) — sightline + dot only, no bracket |

### `favicon/` — raster icon set
| File | Use it for |
|---|---|
| `favicon.ico` | Multi-resolution ICO (16/32/48) for legacy browser tabs |
| `favicon-16.png` to `favicon-96.png` | Browser tabs and bookmarks |
| `favicon-180.png` | iOS home screen (`apple-touch-icon`) |
| `favicon-192.png`, `favicon-512.png` | Android / PWA |
| `site.webmanifest` | PWA manifest |

### Top-level documents
- `PlanSight-AI-Brand-Guidelines.pdf` — the human-facing brand book (13 pages, A4)

## Installation in the Next.js app

### 1. Copy files into `/public/`

```bash
# From the project root:
cp svg/*.svg public/brand/
cp favicon/*.png public/
cp favicon/favicon.ico public/
cp favicon/site.webmanifest public/
```

The favicons live at the root of `/public/` so browsers find them at predictable URLs.
The wordmark/logo SVGs go into `/public/brand/` to keep them organized.

### 2. Add to your root layout

In `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "PlanSight AI",
  description: "Upload, visualize, share, and understand project plans with AI insights.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: { url: "/favicon-180.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  themeColor: "#0B1220",
};
```

### 3. Use the wordmark in components

```tsx
import Image from "next/image";

// Light/marketing context
<Image
  src="/brand/plansight-logo-primary.svg"
  alt="PlanSight AI"
  width={160}
  height={32}
  priority
/>

// Dark hero/footer
<Image
  src="/brand/plansight-logo-primary-dark.svg"
  alt="PlanSight AI"
  width={160}
  height={32}
/>

// Monochrome — tints with parent CSS color
<span className="text-white">
  <Image src="/brand/plansight-logo-monochrome.svg" alt="PlanSight AI" ... />
</span>
```

## Brand colors (for reference)

| Role | Hex | Tailwind |
|---|---|---|
| Primary surface (deep navy) | `#0B1220` | `slate-950`-ish — define as custom |
| Accent (sightline cyan) | `#22D3EE` | `cyan-400` |
| Accent darker (wordmark "Sight") | `#0891B2` | `cyan-700` |
| Wordmark "Plan" muted | `#64748B` | `slate-500` |
| Body muted | `#94A3B8` | `slate-400` |

## Clear space and minimums

- **Minimum lockup width:** 96px. Below that, use the monogram alone.
- **Clear space:** equal to the height of the dot (X) on all sides of the lockup.
- **Don't:** recolor the mark, stretch the dot, or set "AI" larger than the wordmark cap height.
