# Assets

Every brand asset file, where it lives, and how to use it.

## Directory layout (in the Next.js app)

```
public/
├── favicon.ico
├── favicon-16.png
├── favicon-32.png
├── favicon-48.png
├── favicon-64.png
├── favicon-96.png
├── favicon-180.png        ← apple-touch-icon
├── favicon-192.png        ← Android
├── favicon-512.png        ← PWA splash
├── site.webmanifest
├── og-default.png         ← optional, default OG card
└── brand/
    ├── plansight-logo-primary.svg
    ├── plansight-logo-primary-dark.svg
    ├── plansight-logo-stacked.svg
    ├── plansight-logo-monochrome.svg
    ├── plansight-monogram-dark.svg
    ├── plansight-monogram-light.svg
    └── plansight-monogram-simplified.svg
```

## SVG logos — `/public/brand/`

| File | Dimensions (intrinsic) | Use |
|---|---|---|
| `plansight-logo-primary.svg` | 320×64 | Primary horizontal lockup, light backgrounds. Marketing site header, email signatures, README hero. |
| `plansight-logo-primary-dark.svg` | 320×64 | Primary horizontal lockup, dark backgrounds. Dark hero, dark mode product header, footer on dark. |
| `plansight-logo-stacked.svg` | 220×140 | Stacked lockup. Square avatars (LinkedIn, GitHub org), social cards, centered hero placements. |
| `plansight-logo-monochrome.svg` | 320×64 | Single-color contexts. Uses `currentColor` — set the parent's CSS `color` to recolor. |
| `plansight-monogram-dark.svg` | 180×180 | App icon — dark navy rounded square. Default monogram. |
| `plansight-monogram-light.svg` | 180×180 | App icon variant for white/light surfaces. |
| `plansight-monogram-simplified.svg` | 32×32 | Tiny-size variant. Sightline + dot only, no bracket. For ≤32px contexts. |

### Usage examples

```tsx
import Image from "next/image";

// Primary lockup, light bg
<Image
  src="/brand/plansight-logo-primary.svg"
  alt="PlanSight AI"
  width={160}
  height={32}
  priority
/>

// Primary lockup, dark bg
<Image
  src="/brand/plansight-logo-primary-dark.svg"
  alt="PlanSight AI"
  width={160}
  height={32}
/>

// Stacked, e.g. centered hero
<Image
  src="/brand/plansight-logo-stacked.svg"
  alt="PlanSight AI"
  width={200}
  height={128}
  className="mx-auto"
/>

// Monochrome — recolors via CSS color: (currentColor)
<div className="text-white">
  <Image
    src="/brand/plansight-logo-monochrome.svg"
    alt="PlanSight AI"
    width={140}
    height={28}
  />
</div>

// Monogram standalone (favicon-style use case)
<Image
  src="/brand/plansight-monogram-dark.svg"
  alt=""
  width={32}
  height={32}
/>
```

For decorative use beside a text wordmark, set `alt=""` so screen readers don't double-announce.

## Favicons — `/public/`

| File | Size | Use |
|---|---|---|
| `favicon.ico` | multi-resolution (16/32/48) | Legacy browser tabs |
| `favicon-16.png` | 16×16 | Smallest tab favicon |
| `favicon-32.png` | 32×32 | Standard tab favicon |
| `favicon-48.png` | 48×48 | Higher-DPI tab |
| `favicon-64.png` | 64×64 | Dock / large favicon |
| `favicon-96.png` | 96×96 | Large favicon, app launcher |
| `favicon-180.png` | 180×180 | Apple touch icon (iOS home screen) |
| `favicon-192.png` | 192×192 | Android home screen / PWA |
| `favicon-512.png` | 512×512 | PWA splash screen |
| `site.webmanifest` | — | PWA manifest |

### Installation in Next.js

The `metadata.icons` block in `app/layout.tsx` wires it all up — see `tokens.md` for the full snippet.

The 16/32px versions intentionally use a **simplified** design (sightline + dot only, no bracket). The bracket would mush at small sizes; clarity beats completeness. Sizes ≥64px show the full bracket-and-eye composition.

## Open Graph / social cards

The default OG card lives at `/public/og-default.png` (1200×630). For dynamic OG cards on share pages, generate via `/app/api/og/route.tsx` using `next/og`:

```tsx
// app/api/og/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");
  // ... fetch plan data ...

  return new ImageResponse(
    (
      <div style={{
        width: "100%",
        height: "100%",
        background: "#0B1220",
        display: "flex",
        flexDirection: "column",
        padding: 64,
        fontFamily: "Inter",
      }}>
        {/* Stacked lockup top-left */}
        {/* Plan name large */}
        {/* RAG indicator */}
        {/* 4 metrics in a row */}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

Match the brand exactly — never use a generic auto-generated card.

## Email assets

For transactional emails, use **PNG** versions (some email clients don't render SVG). Generate from the SVGs at 2× target display size:

| Target | PNG |
|---|---|
| Email header logo (display 32px) | 320×64 PNG of primary lockup |
| Email signature | 280×56 PNG of primary lockup |

Host these on the public CDN and reference by absolute URL — relative paths break in email.

## Source files (not in `/public/`)

The SVG sources live in this directory (`docs/`'s sibling `svg/`). They're the editable masters. The PDF brand guidelines (`PlanSight-AI-Brand-Guidelines.pdf`) is the human-facing reference.

## Don't

- ✗ Don't recreate the logo as inline SVG in components. Always reference the file. (One source of truth.)
- ✗ Don't add CSS filters to recolor (e.g. `filter: hue-rotate()`). Use the monochrome variant.
- ✗ Don't ship favicon PNGs at sizes other than the listed standards.
- ✗ Don't compress the SVGs through aggressive optimizers that strip the `<title>` element — accessibility matters.
- ✗ Don't use the simplified monogram for sizes >32px — it's the wrong aesthetic.

## Related docs

- `logo.md` — when to use which lockup
- `tokens.md` — favicon metadata block for `app/layout.tsx`
- `share-view.md` — OG card spec
