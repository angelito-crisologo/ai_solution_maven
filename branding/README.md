# Branding

This directory contains the **human-readable brand documentation** for
AI Solution Maven and each product under it. Each product owns its own
brand and is free to diverge from AISM.

## Structure

```
/branding/
  README.md                       ← you are here
  ai-solution-maven/
    BRANDKIT.md                   ← AISM voice, colors, typography
    assets/                       ← raw source files (svg, fig, ai)
  plansight-ai/
    BRANDKIT.md                   ← PlanSight brand kit
    assets/                       ← raw source files
  <future-product>/
    BRANDKIT.md
    assets/
```

## Companion locations

The brand books here are the **source of truth** for design intent. The
implementation lives in two other places:

- **`/lib/branding/`** — TypeScript design tokens consumed by app code
  (colors, gradients, font families, asset paths). Update both this file
  and the matching token file when the brand changes.
- **`/public/products/<slug>/`** — web-served static assets (favicons,
  OG images, logos referenced from the page). These ship to the browser.

When you add a new product:

1. Create `/branding/<slug>/BRANDKIT.md` describing voice, colors, typography
2. Create `/lib/branding/<slug>.ts` with the design tokens
3. Add the slug constant to `/lib/branding/index.ts` so `getBranding(slug)`
   resolves
4. Drop web assets into `/public/products/<slug>/`
5. Wrap the product's pages in the page-level scope so Tailwind utility
   classes pick up the right CSS variables (see `lib/branding/index.ts`)

## Naming

- Folder slug = the same product slug used in `product_activations.product_slug`
  in the database. Today: `ai-solution-maven` (parent), `plansight-ai`.
- Brand-doc filenames are `BRANDKIT.md` (the canonical entry), plus optional
  `colors.md`, `typography.md`, `voice-tone.md` if a topic outgrows
  BRANDKIT.md.
