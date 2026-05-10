# Logo

PlanSight uses a **combined logo system**: a horizontal wordmark for storytelling, a square monogram for tight contexts. They share visual DNA — a horizontal element resolving into a focused circle — but each is optimized for its context.

## Decision tree

```
Is the surface square or near-square (avatar, app icon, favicon)?
├── Yes → MONOGRAM
│         ├── ≥48px and dark surface OK? → monogram-dark.svg
│         ├── ≥48px on white/light bg?    → monogram-light.svg
│         └── ≤32px (favicon-grade)?      → monogram-simplified.svg
│
└── No → WORDMARK (horizontal lockup)
          ├── Centered hero, vertical-leaning space? → stacked.svg
          ├── Light page bg?                          → primary.svg
          ├── Dark page bg / hero?                    → primary-dark.svg
          └── Single-color print / partner page?     → monochrome.svg
```

## Lockup variants

| Variant | File | When |
|---|---|---|
| Primary horizontal | `plansight-logo-primary.svg` | Marketing site header on light bg, email signatures, README hero, slide footer |
| Primary horizontal (dark) | `plansight-logo-primary-dark.svg` | Hero sections on deep slate, dark mode product header, footer on dark |
| Stacked | `plansight-logo-stacked.svg` | Square avatars (LinkedIn, GitHub org), centered hero placements, social card |
| Monochrome | `plansight-logo-monochrome.svg` | Single-color contexts. Inherits CSS `color:` via `currentColor` — set the parent's color to recolor. |
| Monogram (dark) | `plansight-monogram-dark.svg` | Default app icon, in-product nav, dark surface |
| Monogram (light) | `plansight-monogram-light.svg` | Light surfaces where the dark square would feel heavy |
| Monogram (simplified) | `plansight-monogram-simplified.svg` | Tiny-size variant. Sightline + dot only, no bracket. |

All files live at `/public/brand/*.svg` (logos) and `/public/*` (favicons) once installed.

## Sizing — minimums

| Variant | Minimum | Below this, use... |
|---|---|---|
| Primary horizontal lockup | 96px wide | Monogram alone |
| Stacked lockup | 64px wide | Monogram alone |
| Monogram (full) | 48px | Simplified monogram |
| Monogram (simplified) | 16px | Don't go smaller |

## Sizing — recommended

For common contexts, use these as starting points:

| Context | Variant | Size |
|---|---|---|
| Marketing site nav | Primary | 32–40px tall |
| Marketing site hero | Primary or stacked | 48–64px tall |
| Marketing site footer | Primary | 28–32px tall |
| Product app nav | Monogram + small wordmark | 24px monogram, h-7 row |
| Email signature | Primary | 32px tall |
| Slide footer | Primary | 24–28px tall |
| Open Graph / social card | Stacked | Centered, ~25% of card height |
| Browser tab favicon | Simplified PNG | 32×32 |
| iOS home screen | Monogram dark | 180×180 (apple-touch-icon) |

## Clear space

Reserve clear space around any lockup equal to **X**, where X = the height of the dot (pupil) in the eye. Nothing should encroach — no text, no other logos, no UI chrome.

When PlanSight appears alongside another logo (partner, customer, "in association with"):
- Enforce X clear space at minimum, ideally 2X.
- Match the cap-height of the wordmarks if pairing horizontally.
- Use a vertical divider (slate-300 hairline, height = lockup height) between them.

## Implementation in Next.js

Each lockup is a static SVG in `/public/brand/`. Use Next.js `<Image>` for automatic optimization:

```tsx
import Image from "next/image";

// Primary on light backgrounds
<Image
  src="/brand/plansight-logo-primary.svg"
  alt="PlanSight AI"
  width={160}
  height={32}
  priority
/>

// Primary on dark hero / footer
<Image
  src="/brand/plansight-logo-primary-dark.svg"
  alt="PlanSight AI"
  width={160}
  height={32}
/>

// Monochrome — recolors via CSS `color:` (currentColor)
<span className="text-white">
  <Image
    src="/brand/plansight-logo-monochrome.svg"
    alt="PlanSight AI"
    width={140}
    height={28}
  />
</span>

// App nav: small monogram + text wordmark beside it
<div className="flex items-center gap-2">
  <Image src="/brand/plansight-monogram-dark.svg" alt="" width={24} height={24} />
  <span className="font-semibold text-slate-100">
    Plan<span className="text-cyan-400">Sight</span>
  </span>
</div>
```

Always set `alt="PlanSight AI"` for the standalone logo. Decorative monogram next to a text wordmark gets `alt=""`.

## Wordmark color treatment

The official **Treatment A**: two-tone.

- "Plan" in slate-500 (`#64748B`) on light bg, or slate-400 (`#94A3B8`) on dark bg.
- "Sight" in cyan-700 (`#0891B2`) on light bg, or cyan-400 (`#22D3EE`) on dark bg.
- "AI" suffix in slate-400/slate-500 (one stop lighter than "Plan"), small caps with letter-spacing.

When rendering the wordmark as **text in HTML** (rather than the SVG asset), match these colors exactly:

```html
<!-- Light background -->
<span class="text-slate-500 font-semibold">Plan<span class="text-cyan-700">Sight</span></span>

<!-- Dark background -->
<span class="text-slate-400 font-semibold">Plan<span class="text-cyan-400">Sight</span></span>
```

## Don'ts

See `donts.md` for the full list. The critical ones:

- ✗ Do not recolor the cyan accent. Cyan is fixed.
- ✗ Do not stretch, distort, rotate, or skew any element of the mark.
- ✗ Do not add effects: no drop shadows, glows, gradients, or strokes.
- ✗ Do not place "AI" larger than the wordmark cap height.
- ✗ Do not place the lockup on busy or low-contrast backgrounds.
- ✗ Do not redraw the mark in a different style.

## Related docs

- `assets.md` — full file reference for every logo and favicon
- `colors.md` — exact hex values for the two-tone wordmark
