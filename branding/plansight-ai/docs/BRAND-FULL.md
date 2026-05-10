# PlanSight AI — Complete Brand System (single-file edition)

**This is the full brand system concatenated into one file for convenience.** Pasting the entire thing into Claude gives complete context for any front-end task. Individual focused files in this directory are usually better — load only what you need.

The files are concatenated in dependency order: foundation first, then implementation, then specialized contexts.

---

## Table of contents

1. **brand-essence.md** — what PlanSight is, who it's for
2. **voice.md** — how to write copy
3. **colors.md** — palette and usage rules
4. **typography.md** — type stack and scale
5. **logo.md** — when to use which lockup
6. **tokens.md** — Tailwind config + CSS variables
7. **components.md** — opinionated UI defaults
8. **data-display.md** — Gantt, tables, RAG, metrics
9. **share-view.md** — stakeholder share-page conventions
10. **assets.md** — file reference
11. **donts.md** — the boundary list

For each section, the canonical filename is shown — refer to that file in this directory for the latest version if anything seems out of date.

---

## Section: brand-essence.md

# Brand essence

## One-liner

**PlanSight AI: your project plan, finally legible.**

## What it is

PlanSight AI is a *visibility, analysis, and communication layer* over the project plans PMs already have. It is **not** a project management tool — not a competitor to Asana, Monday, or MS Project. It sits alongside them.

The flow:
1. PM uploads an `.mpp` (or XLSX, Smartsheet later) file.
2. The browser renders a synchronized Gantt + task table.
3. A deterministic, PMP-aligned engine computes critical path, late tasks, at-risk tasks, RAG status.
4. Claude generates a narrative summary, identified risks, and recommendations.
5. PM shares a public read-only link with stakeholders. No login.

## Who it's for

Two distinct users with different mental models:

**The PM (uploader).** Senior-leaning, comfortable with PMBOK terminology, wants signal not noise. Working in MS Project today. Tired of explaining the same plan to four different stakeholders four different ways. Cares about: critical path correctness, AI insights they can act on, professional-looking outputs they can attach to status reports.

**The stakeholder (viewer).** Executive sponsor, cross-functional partner, exec, customer. Does not have MS Project. Doesn't want to. Cares about: is this on track, what's at risk, what should I be paying attention to. Ten seconds of comprehension is the goal.

Design for both. The PM expects PMP-grade precision. The stakeholder expects calm clarity.

## The brand essence

> From dense plans to clear sight.

Quiet intelligence. Calm authority. Trust through restraint. Think Linear or Vercel — confidence without chest-thumping. The brand should feel like a senior PM you'd hire to run a hard project: specific, technical when it matters, never theatrical.

## What we're not

- Not a productivity app. No streaks, no gamification, no nudges.
- Not a generic AI wrapper. The deterministic engine is the foundation; AI sits on top.
- Not a startup-hype brand. No "revolutionize," no "unleash," no "supercharge."
- Not a competitor to MS Project. We're a lens, not a replacement.
- Not loud. The accent color is one cyan. There's one focal point per screen.

## The viral loop

This matters for product decisions: PM uploads → PM shares link → stakeholders view → some stakeholders are also PMs → those become users. **The share view is therefore a marketing surface.** It must look polished, lightly branded, and good enough to make a stakeholder ask "what tool is this?"

## Distinctive technical signals worth dramatizing

Things to surface visibly because they earn trust with senior PMs:

- "Computed per PMBOK conventions" — the critical path math is real.
- "Your data isn't training data" — privacy/IP signal.
- "No login required for viewers" — the share UX is intentional.
- Task IDs in monospace — quiet credibility detail.
- AI risks reference specific task IDs — the model is grounded, not hand-wavy.

## Related docs

- `voice.md` — how to write copy in this voice
- `colors.md`, `typography.md`, `logo.md` — visual expressions of the essence
- `donts.md` — the boundary list

---

## Section: voice.md

# Voice & tone

For writing UI copy, marketing copy, error messages, AI prompts, email, anywhere words appear.

## Core principle

Write like a **trusted senior PM**. Calm, specific, slightly technical when it matters. Never theatrical. When in doubt, cut it in half.

## Voice attributes

- **Specific over abstract.** "Upload your .mpp file" beats "Get started in seconds."
- **Concrete nouns and active verbs.** "Critical path computed." Not "AI-powered insight engine."
- **Confidence without hype.** "Built on Claude" not "Powered by next-gen AI."
- **Mild dryness is fine.** "We don't store your file. We never did." over exclamation marks.
- **Technical terms used correctly.** Senior PMs notice when "critical path" or "float" is misused. Get it right.
- **Numbers earn trust.** "5–8s analysis" beats "lightning fast." "Cached by content hash" beats "smart caching."

## Tone shifts by context

| Context | Tone |
|---|---|
| Marketing landing page | Calm, confident, specific. Lead with the problem. |
| In-product UI labels | Functional, clipped. "Upload plan" not "Get started by uploading your plan!" |
| Error messages | Direct, blame-free, with a next step. "File too large (>5 MB). Try a smaller plan or contact support." |
| AI-generated narrative | Senior-PM voice — third-person, evidence-based, hedged where appropriate. |
| Stakeholder share view | Clearer than in-product, since the viewer isn't a PM. Less jargon. |
| Email / transactional | Brief, useful, signed off plainly. No "Best regards, the PlanSight team!!" |

## Do say / don't say

| Do | Don't |
|---|---|
| Upload your .mpp file. | Unleash the power of AI for your project! |
| Computed per PMBOK conventions. | Industry-leading, best-in-class analysis. |
| Share a link your stakeholders can open. | Revolutionize project communication. |
| 12 tasks at risk. | Uncover hidden risks lurking in your plan. |
| Built on Claude. | Powered by next-generation AI. |
| Your file isn't training data. | We respect your privacy. |
| Re-run analysis | Refresh insights ✨ |
| 5 plans uploaded this month | You're crushing it! 🚀 |
| Plan exceeds 5,000 task limit. | Oops! Something went wrong. |

## Banned words and phrases

These read as startup-hype and break the brand voice. Don't use them in any copy:

- *unleash, supercharge, revolutionize, transform, empower, leverage*
- *seamless, frictionless, effortless, magical, delightful*
- *AI-powered, next-gen, cutting-edge, state-of-the-art*
- *industry-leading, best-in-class, world-class*
- *crush it, level up, game-changer, 10x*
- *pro tip, fun fact, hot take, hack*

## Headline patterns that work

- **Problem-forward:** "Your project plan, finally legible."
- **Mechanism-forward:** "Drop in an .mpp. Get a stakeholder-ready plan."
- **Output-forward:** "Critical path. RAG status. AI summary. One link to share."
- **Contrast-forward:** "PMs work in MS Project. Stakeholders don't."

## Microcopy patterns

**Buttons:** verb + noun, sentence case. "Upload plan", "Re-run analysis", "Copy link", "Download Excel". Never "Click here" or "Submit".

**Empty states:** state the situation, then the next action. "No plans yet. Upload an .mpp file to start."

**Loading states:** describe what's happening, briefly. "Parsing plan...", "Computing critical path...", "Generating analysis (5–8s)...".

**Confirmations:** past tense, brief. "Plan uploaded.", "Link copied.", "Analysis regenerated."

**Errors:** what happened + what to do. "File too large (max 5 MB). Try splitting the plan or upgrading to Pro."

## AI-generated copy

When Claude generates the narrative summary, risks, or recommendations *inside the product*, it follows the same voice. Specifically:

- Third-person ("the project," "the team") not first-person ("I think").
- Reference task IDs in monospace when citing specific tasks: "Tasks 12, 47, and 89 are on the critical path."
- Hedge appropriately. "Likely at risk" not "will fail."
- No emojis, ever, in AI output that ships in the product.
- No exclamation marks.
- Recommendations should be imperative + specific: "Move task 47's start date forward by 3 days to recover float."

## Tagline options

The official tagline:

> Your project plan, finally legible.

Acceptable alternates for context-specific use (footer microcopy, email subject lines):

- "See the plan. Share the truth."
- "Project clarity, on demand."
- "Upload. See. Share. Understand."

Never invent new taglines without updating this doc.

## When uncertain

Read the copy out loud. If you'd be embarrassed to say it to a senior PM at lunch, rewrite it.

---

## Section: colors.md

# Colors

The PlanSight palette: a deep navy foundation, a single confident cyan accent, structural slate neutrals, and three semantic RAG colors. **Two-color discipline** — most surfaces use navy/slate + cyan only. Reds and ambers are reserved for status, never decoration.

## Brand colors

| Name | Hex | Tailwind | Use |
|---|---|---|---|
| Deep slate | `#0B1220` | (custom) | Primary surface. Page bg in dark mode, hero bg, monogram square. |
| Slate 800 | `#1A2332` | (custom) | Secondary surface. Cards on dark, panels, modals on dark bg. |
| Sightline cyan | `#22D3EE` | `cyan-400` | Primary accent. CTAs, focus rings, brand mark, active states. |
| Cyan dark | `#0891B2` | `cyan-700` | Wordmark "Sight" on light bg. Hover state for cyan CTAs. Links on light. |

## Neutrals

| Name | Hex | Tailwind | Use |
|---|---|---|---|
| White | `#FFFFFF` | `white` | Primary surface in light mode. Cards on light bg. |
| Slate 50 | `#F8FAFC` | `slate-50` | Page bg in light mode. Lightest fill. |
| Slate 100 | `#F1F5F9` | `slate-100` | Subtle surfaces, table header bg, code-block bg, light monogram square. |
| Slate 200 | `#E2E8F0` | `slate-200` | Hairline borders (0.5px). Default border. |
| Slate 300 | `#CBD5E1` | `slate-300` | Stronger borders, divider on light bg. |
| Slate 400 | `#94A3B8` | `slate-400` | Body muted text. Captions on dark bg. Secondary text on dark. |
| Slate 500 | `#64748B` | `slate-500` | Wordmark "Plan" color. Muted body text on light bg. Placeholders. |
| Slate 600 | `#475569` | `slate-600` | Body text on light bg (less stark than ink). |
| Slate 700 | `#334155` | `slate-700` | Strong body text on light. |
| Ink | `#0B1220` | (= Deep slate) | Headings on light bg. Maximum contrast text. |

## RAG status (semantic)

Used **only** for project health and at-risk indicators. Match the deterministic insights engine output — these colors carry meaning and must not be repurposed.

| Name | Hex | Tailwind | Meaning |
|---|---|---|---|
| Red | `#EF4444` | `red-500` | At-risk, late, blocked. RAG: red. |
| Red bg | `#FEE2E2` | `red-100` | Subtle fill behind red text/icons. |
| Amber | `#F59E0B` | `amber-500` | Watch, lagging. RAG: amber. |
| Amber bg | `#FEF3C7` | `amber-100` | Subtle fill behind amber. |
| Green | `#10B981` | `emerald-500` | On track. RAG: green. |
| Green bg | `#D1FAE5` | `emerald-100` | Subtle fill behind green. |

## Pairing rules

**Default pairings.** Most UI is one of these:

- **Light mode:** white surface + ink text + slate-200 borders + cyan accents.
- **Dark mode:** deep slate surface + slate-100 text + slate-700/800 borders + cyan accents.
- **Hero / marketing:** deep slate full-bleed + slate-100 headings + cyan tagline + slate-400 body.

**Cyan is precious.** Use it for: the primary CTA on a screen, focus rings, the brand mark, and one accent moment per view (e.g. an active tab, a key metric). If you're using cyan in three places on the same screen, you're using it wrong.

**RAG colors are precious-er.** Only use red/amber/green for actual project status. Don't use red for a generic "delete" button (use slate-700 or a destructive variant of the neutral). Don't use green for a "submit" button (use cyan).

## Contrast rules

Always test the foreground/background combination for WCAG AA (4.5:1 for body, 3:1 for large text).

**Verified safe pairs:**
- Ink (`#0B1220`) on white → 16.5:1 ✓
- Ink on slate-100 (`#F1F5F9`) → 15.5:1 ✓
- Slate-600 (`#475569`) on white → 7.5:1 ✓
- Slate-500 (`#64748B`) on white → 4.6:1 ✓ (body minimum)
- Slate-100 (`#F1F5F9`) on deep slate (`#0B1220`) → 15:1 ✓
- Slate-400 (`#94A3B8`) on deep slate → 6.6:1 ✓
- Cyan-700 (`#0891B2`) on white → 4.5:1 ✓ (link minimum on light)
- Slate-100 on cyan-700 → 3.4:1 ✓ (large text only)

**Avoid:**
- Cyan-400 on white — only 2.6:1, too light. Use cyan-700 for text on light bg.
- Slate-400 on white — 3.1:1, only OK for large text. Use slate-500 minimum for body.

## Status badge patterns

Use these as the canonical RAG badge implementation. Pill shape, small font, sentence case.

| Status | Background | Text | Border |
|---|---|---|---|
| Red / At-risk | `#FEE2E2` (red-100) | `#991B1B` (red-800) | `#FCA5A5` (red-300) optional |
| Amber / Watch | `#FEF3C7` (amber-100) | `#92400E` (amber-800) | `#FCD34D` (amber-300) optional |
| Green / On track | `#D1FAE5` (emerald-100) | `#065F46` (emerald-800) | `#6EE7B7` (emerald-300) optional |

Always pair the colored fill with text in the **800 stop of the same hue**. Never plain black or generic gray on a colored fill.

## Cyan opacity scale

When using cyan for non-text decoration (highlights, glows, subtle backgrounds), use these alpha steps:

| Use | Color |
|---|---|
| Strong fill (CTA bg) | `#22D3EE` 100% |
| Hover overlay on cyan | `#0891B2` 100% |
| Subtle highlight bg | `#22D3EE` at 8% (`rgba(34,211,238,0.08)`) |
| Active row indicator | `#22D3EE` at 15% |
| Faded "future" bar in Gantt | `#22D3EE` at 55% (matches the wordmark mark) |

## What not to do

- Never recolor the wordmark mark or monogram. Cyan is fixed.
- Never introduce a second accent color. There is no purple, no orange, no pink.
- Never use red on UI that isn't about status. (No red delete buttons, no red "danger" zones unless they're literally project-health red.)
- Never use cyan for body text — it's an accent, not a content color.
- Never use pure black (`#000`) — use ink (`#0B1220`).

## Related docs

- `tokens.md` — copy-paste Tailwind/CSS variable definitions
- `data-display.md` — RAG indicators, Gantt bar coloring
- `components.md` — button states, focus rings

---

## Section: typography.md

# Typography

## Type stack

```css
--font-sans: 'Inter', 'Geist Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
```

**Inter** is the primary face for both headings and body. It's free, ships well, and reads professionally. **Geist** is acceptable as an alternate if already loaded.

**Geist Mono** (or JetBrains Mono) for data: task IDs, durations, dates, hex codes, code, hashes. The monospace earns trust — it signals "this number is computed, not invented."

## Weight discipline

Use **two weights only**: 400 regular and 600 semibold. Never 500 (looks unfinished), never 700 (too heavy against quiet UI), never 800/900.

## Type scale

A modular scale tuned for Tailwind's defaults. Always use the **named tokens** below, not arbitrary sizes.

| Token | Size / Line height / Weight | Tailwind | Use |
|---|---|---|---|
| `display` | 48 / 56 / 600 | `text-5xl font-semibold leading-[56px]` | Marketing hero headline only. One per page max. |
| `h1` | 32 / 40 / 600 | `text-3xl font-semibold leading-10` | Page titles in product. |
| `h2` | 24 / 32 / 600 | `text-2xl font-semibold leading-8` | Section headings. |
| `h3` | 18 / 28 / 600 | `text-lg font-semibold leading-7` | Card titles, subsection. |
| `lead` | 18 / 28 / 400 | `text-lg leading-7` | Hero subtitle, lead paragraph. |
| `body` | 14 / 22 / 400 | `text-sm leading-[22px]` | Default body. Workhorse size. |
| `body-lg` | 16 / 26 / 400 | `text-base leading-[26px]` | Marketing body, longer-form reading. |
| `caption` | 12 / 18 / 400 | `text-xs leading-[18px]` | Captions, footer text, timestamps. |
| `micro` | 11 / 14 / 600 | `text-[11px] font-semibold leading-[14px] tracking-wider uppercase` | Eyebrow labels, table column heads. Use sparingly. |
| `mono-sm` | 12 / 18 / 400 | `font-mono text-xs leading-[18px]` | Task IDs, hashes, code inline. |
| `mono` | 13 / 20 / 400 | `font-mono text-[13px] leading-5` | Code blocks, structured data. |

## Color pairings

Default text colors paired with each token:

| Token | Light mode | Dark mode |
|---|---|---|
| `display`, `h1`, `h2`, `h3` | ink (`#0B1220`) | slate-100 (`#F1F5F9`) |
| `lead` | slate-700 (`#334155`) | slate-300 (`#CBD5E1`) |
| `body`, `body-lg` | slate-700 | slate-300 |
| `caption` | slate-500 (`#64748B`) | slate-400 (`#94A3B8`) |
| `micro` (eyebrow) | cyan-700 (`#0891B2`) | cyan-400 (`#22D3EE`) |
| `mono`, `mono-sm` | ink | slate-100 |

## Sentence case, always

All UI text — headings, buttons, labels, table columns, navigation — uses **sentence case**. Not Title Case, not ALL CAPS.

- ✓ "Upload plan", "Critical path", "My plans"
- ✗ "Upload Plan", "CRITICAL PATH", "My Plans"

The only exception: the `micro` eyebrow style uses uppercase tracking, but only for short single-word section labels (e.g. "OVERVIEW"). Use it rarely — at most once per page.

## Letter-spacing rules

- **Body, lead, captions:** default tracking (`tracking-normal`).
- **Display, h1:** tighter — `tracking-tight` (-0.02em). Larger sizes need it.
- **Micro (eyebrow):** wider — `tracking-wider` (+0.05em). The uppercase needs breathing room.
- **Mono:** never adjust tracking. Monospace is exact.

## Special patterns

### Wordmark in body text

When "PlanSight" or "PlanSight AI" appears in running text, treat as a proper noun — sentence case, no special weight or color (unless it's the rendered logo lockup).

### Numbers and metrics

For metric cards or stat displays: number in `display` or `h1` weight, label in `caption` slate-500 above it.

```html
<div>
  <p class="text-xs text-slate-500 leading-[18px] mb-1">Tasks at risk</p>
  <p class="text-3xl font-semibold leading-10 text-ink">12</p>
</div>
```

### Task IDs in copy

Inline task references always go in mono and lowercase:

> "Tasks <code class="font-mono text-sm">t-0047</code>, <code class="font-mono text-sm">t-0089</code> are on the critical path."

Use `<code>` tags semantically, with `font-mono text-[0.95em] bg-slate-100 px-1 rounded`. This applies in AI-generated narrative output too.

### Dates and durations

Always monospace, always consistent format. The product standard:
- Dates: `2026-05-10` (ISO) for tables, `10 May 2026` for narrative.
- Durations: `5d`, `2w`, `40h`.
- Timestamps: `2026-05-10 14:32 UTC`.

## Mid-sentence emphasis

Avoid bold and italic mid-sentence in body copy. If a word is important enough to emphasize, the sentence is probably structured wrong. The exceptions:

- **Bold** for short scannable lead-in labels: "**Critical path:** 47 days, 12 tasks."
- *Italic* for technical terms on first introduction: "...the project's *float* (slack time)..."
- `code` for filenames, function names, IDs.

Never combine bold + italic.

## Don'ts

- No drop shadows on text. Ever.
- No text-stroke or text-fill effects.
- No gradient text — quiet brand, no rainbows.
- No font-weight 700+ in product UI.
- No more than three font sizes on a single screen (ideally two).
- No mixing serif fonts in. The brand is sans-only.
- No emoji-as-typography. (No 🚀, no ✨, no 📊, anywhere.)

## Related docs

- `tokens.md` — copy-paste @font-face / Tailwind config
- `voice.md` — how the words read; the words themselves
- `colors.md` — text/background contrast verified pairs

---

## Section: logo.md

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

---

## Section: tokens.md

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

---

## Section: components.md

# Components

Opinionated defaults for buttons, cards, inputs, and other recurring UI pieces. Use shadcn/ui primitives as the foundation — these patterns customize them to brand.

## Buttons

Three variants. Don't invent more.

### Primary — cyan
The single CTA on a screen. There should rarely be more than one primary button visible at once.

```tsx
<button className="
  inline-flex items-center gap-2
  px-4 h-10
  bg-cyan-700 hover:bg-cyan-800 active:bg-cyan-900
  text-white font-semibold text-sm
  rounded-md
  transition-colors
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:pointer-events-none
">
  Upload plan
</button>
```

On dark backgrounds, swap `bg-cyan-700` → `bg-cyan-400`, hover → `bg-cyan-300`, text → `text-slate-900`.

### Secondary — outline
Default for non-CTA actions. Most buttons should be secondary.

```tsx
<button className="
  inline-flex items-center gap-2
  px-4 h-10
  bg-white hover:bg-slate-50
  text-slate-700 hover:text-slate-900 font-semibold text-sm
  border border-slate-200 hover:border-slate-300
  rounded-md
  transition-colors
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2
">
  Re-run analysis
</button>
```

### Ghost — text only
For tertiary actions, in-table actions, dense UI.

```tsx
<button className="
  inline-flex items-center gap-2
  px-3 h-9
  text-slate-600 hover:text-slate-900 hover:bg-slate-100
  font-semibold text-sm
  rounded-md
  transition-colors
">
  Cancel
</button>
```

### Sizes

| Size | Height | Padding | Use |
|---|---|---|---|
| `sm` | 32px (h-8) | px-3 | Inside dense UI, table rows |
| `md` | 40px (h-10) | px-4 | **Default.** Forms, dialogs, page actions |
| `lg` | 48px (h-12) | px-6 | Hero CTA, prominent moments |

### Icon buttons

40×40 square (h-10 w-10), centered icon, same hover/focus rules as ghost. Always pair with a `title` or `aria-label`.

## Cards

Two variants: bordered (default) and elevated. Avoid both shadows AND borders — pick one signal of separation.

### Bordered card
The default. Quiet, on-brand.

```tsx
<div className="
  bg-white
  border border-slate-200
  rounded-lg
  p-6
">
  {/* content */}
</div>
```

### Elevated card
Use sparingly — only when content needs to "lift" off the page (modals, popovers, the main hero card). No border with elevation.

```tsx
<div className="
  bg-white
  rounded-lg
  shadow-[0_1px_3px_rgba(11,18,32,0.08),0_4px_12px_rgba(11,18,32,0.04)]
  p-6
">
  {/* content */}
</div>
```

Never use Tailwind's default `shadow-md` or `shadow-lg` — they're too gray and cloudy. Always use the custom shadow above (cool navy at low alpha).

### Dark variant

```tsx
<div className="
  bg-[#1A2332]
  border border-slate-800
  rounded-lg
  p-6
">
  {/* content */}
</div>
```

### Padding scale

- `p-4` (16px): dense UI, in-table cards
- `p-6` (24px): **default**
- `p-8` (32px): hero card, marketing card

## Inputs

### Text input
36–40px tall, 1px border, subtle focus ring. Sentence case placeholders.

```tsx
<input
  type="text"
  placeholder="Search plans"
  className="
    w-full h-10 px-3
    bg-white
    border border-slate-200 hover:border-slate-300
    rounded-md
    text-sm text-slate-900 placeholder:text-slate-400
    focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20
    disabled:bg-slate-50 disabled:text-slate-400
  "
/>
```

### File upload
The hero input of the product. Always include drag-and-drop affordance, file type hint, and size cap.

```tsx
<label className="
  block
  border-2 border-dashed border-slate-300 hover:border-cyan-400
  rounded-lg
  p-8
  text-center
  cursor-pointer
  transition-colors
  bg-slate-50 hover:bg-cyan-50/30
">
  <input type="file" accept=".mpp" className="sr-only" />
  <p className="text-sm font-semibold text-slate-700">
    Drop your .mpp file here, or click to browse
  </p>
  <p className="mt-1 text-xs text-slate-500">
    Max 5 MB · 5,000 tasks
  </p>
</label>
```

### Select / dropdown

Use shadcn/ui `<Select>` with these overrides: chevron in slate-500, content panel with `border-slate-200 shadow-[0_1px_3px_rgba(11,18,32,0.08),0_4px_12px_rgba(11,18,32,0.04)]`.

## Status badges

Pill-shaped, small, sentence case. Always pair colored fill with text in the 800 stop of the same hue (see `colors.md`).

```tsx
// At-risk
<span className="
  inline-flex items-center
  px-2 py-0.5
  rounded-full
  bg-red-100 text-red-800
  text-xs font-semibold
">
  At risk
</span>

// On track
<span className="bg-emerald-100 text-emerald-800 ...">On track</span>

// Watch
<span className="bg-amber-100 text-amber-800 ...">Watch</span>
```

For the "Pro" tier badge, "Beta" labels, etc., use cyan:

```tsx
<span className="bg-cyan-50 text-cyan-700 border border-cyan-100 ...">
  Pro
</span>
```

## Hairlines and dividers

Always **0.5px or 1px**, always slate-200 (or slate-800 on dark). Never thicker.

```tsx
<hr className="border-slate-200" />          // 1px on light
<hr className="border-slate-800" />           // 1px on dark
<div className="h-px bg-slate-200" />         // explicit 1px
```

Vertical dividers: `<div className="w-px h-full bg-slate-200" />`.

## Focus rings

Every interactive element gets the same focus ring:

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-cyan-400
focus-visible:ring-offset-2
focus-visible:ring-offset-white   /* or ring-offset-slate-950 on dark */
```

This is non-negotiable — accessibility is brand.

## Border radius scale

Use only these:

| Token | Value | Use |
|---|---|---|
| `rounded-md` | 6px | **Default.** Buttons, inputs, small cards. |
| `rounded-lg` | 8px | Cards, panels. |
| `rounded-xl` | 12px | Marketing cards, modals. |
| `rounded-full` | 50% | Avatars, pills, badges. |

Never use `rounded-2xl` and above (too soft, breaks the analytical brand feel).

## Spacing scale

Standard Tailwind 4px scale. The opinionated subset most components should use:

`space-y-1` (4px) · `space-y-2` (8px) · `space-y-3` (12px) · `space-y-4` (16px) · `space-y-6` (24px) · `space-y-8` (32px)

For section gaps on marketing pages: `py-16` (64px) or `py-24` (96px).

## Animation

Two durations only:

| Duration | Use |
|---|---|
| `duration-150` (150ms) | Hover, focus, color transitions |
| `duration-300` (300ms) | Modal open/close, drawer, accordion |

Easing: default `ease-out`. No bounces, no springs, no celebratory animations.

## What components NOT to build

To stay on-brand and avoid scope creep, avoid:

- Toasts that auto-dismiss with countdown bars (too playful)
- Confetti on success states
- Onboarding tours with cartoon mascots
- Skeleton loaders that pulse with rainbow gradients
- "Tip of the day" cards
- Streaks, achievements, or completion percentages on the dashboard

Quiet intelligence. The product earns trust by being correct, not by being entertaining.

## Related docs

- `colors.md` — exact hex values, semantic mapping
- `typography.md` — font sizes, weights
- `tokens.md` — Tailwind config you can paste in
- `data-display.md` — Gantt chart, task table conventions

---

## Section: data-display.md

# Data display

Conventions for the parts of the product that show project data: the Gantt chart, the task table, RAG indicators, and metric cards. These are the screens where the brand earns or loses credibility with PMs.

## The split-pane workspace

The core product surface: hierarchical task table on the left, synchronized Gantt chart on the right. Both scroll vertically together; the timeline has its own horizontal scroll.

### Pane proportions

- Default split: **40% table / 60% Gantt** on desktop ≥1280px.
- Resizable via a drag handle in the divider — slate-200 1px line, cursor `col-resize`.
- Below 1024px: stack vertically, table on top, Gantt below with sticky day/week labels.

### The divider

```tsx
<div className="w-px bg-slate-200 hover:bg-cyan-400 cursor-col-resize transition-colors" />
```

## Task table

### Column conventions

| Column | Width | Alignment | Format |
|---|---|---|---|
| Outline number | 56px | left | mono, slate-500 |
| Task ID | 80px | left | mono `t-NNNN`, slate-500 |
| Task name | flex | left | sans, slate-900 (slate-100 on dark) |
| Duration | 80px | right | mono `5d` / `2w`, slate-700 |
| Start | 100px | right | mono ISO date `2026-05-10`, slate-700 |
| Finish | 100px | right | mono ISO date, slate-700 |
| % complete | 64px | right | mono `45%`, slate-700 |
| Predecessors | 120px | left | mono `t-0042, t-0047`, slate-500 |
| Status | 96px | left | RAG badge (see below) |

Task IDs use the format `t-NNNN` (zero-padded to 4 digits). All numeric columns are mono and right-aligned.

### Row hierarchy

- **Summary tasks** (parents with children): font-weight 600, slate-900.
- **Leaf tasks**: font-weight 400, slate-700.
- **Critical-path tasks**: subtle red text-red-700, OR a red left border indicator (1.5px) on the row. Don't double-encode.
- **Late tasks**: red status badge in the Status column. Don't recolor the whole row.
- **Selected row**: bg-cyan-50, left border 2px cyan-400.
- **Hover**: bg-slate-50.

### Indentation

8px per level. Don't use chevron icons larger than 12px. Use a small triangle (▸ collapsed, ▾ expanded) in slate-500.

### Header row

Sticky, slate-50 background, 1px slate-200 border-bottom, micro typography (uppercase 11px tracking-wider, slate-500). Sortable columns get an arrow indicator on hover.

```tsx
<thead className="bg-slate-50 sticky top-0 z-10">
  <tr className="border-b border-slate-200">
    <th className="px-3 h-9 text-left text-[11px] font-semibold tracking-wider uppercase text-slate-500">
      Task
    </th>
    {/* ... */}
  </tr>
</thead>
```

## Gantt chart

### Bar colors by status

| Status | Fill | Hover |
|---|---|---|
| On track | cyan-400 (`#22D3EE`) | cyan-500 |
| Watch | amber-400 (`#FBBF24`) | amber-500 |
| At risk / Late | red-400 (`#F87171`) | red-500 |
| Completed | emerald-400 (`#34D399`) | emerald-500 |
| Critical-path | cyan-400 with red-500 1.5px border | red-600 border |
| Future / not-started | cyan-400 at 55% opacity | cyan-400 at 75% |
| Summary task | slate-700 thin bar (4px tall, no rounded corners) | slate-800 |
| Milestone | rotated diamond, cyan-700 (`#0891B2`), 12×12 | cyan-800 |

Bar height: 16px for leaf tasks, 4px for summary tasks (intentionally thin — they aggregate, they don't dominate).

Bar corner radius: 3px on leaf tasks, 0 on summary bars.

### Progress fill

Show % complete as a darker overlay on the same bar — same hue, deeper stop.

```
[████████░░░░░░░░░░]  45%
 cyan-700  cyan-400
```

Don't use a separate striped pattern; it's too noisy at scale.

### Dependency lines

- Color: slate-400 (`#94A3B8`) at 60% opacity.
- Stroke width: 1px.
- Style: orthogonal (right-angle elbows), not curved.
- Arrowhead: small, 4×4px, slate-500 solid.
- On hover of either endpoint task: highlight the line in cyan-400, full opacity.

### Today line

Vertical line at the current date.
- Color: cyan-400 (`#22D3EE`)
- Stroke width: 1.5px
- Style: dashed (4 on, 4 off)
- Label: small "Today" pill at top, cyan-700 text on cyan-50 fill, mono date below it.

### Timeline header

Two-row header for hierarchical zoom:
- Top row: larger unit (Q1 2026 / Jan / Week 18) — slate-700 font-semibold text-xs.
- Bottom row: smaller unit (Jan / W18 / Mon Tue Wed) — slate-500 font-mono text-[11px].

Border-bottom: 1px slate-200.

### Zoom levels

| Level | Top row | Bottom row | Bar width per unit |
|---|---|---|---|
| Year | Year | Quarter | 80px / quarter |
| Quarter | Quarter | Month | 80px / month |
| Month | Month | Week | 60px / week |
| Week | Week | Day | 32px / day |
| Day | Day | Hour | 24px / hour (rare) |

Default to **Week** view on initial load.

## RAG indicator

The big-picture project health pill. Always one of three, computed by the deterministic engine.

```tsx
// On track
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200">
  <span className="w-2 h-2 rounded-full bg-emerald-500" />
  <span className="text-sm font-semibold text-emerald-800">On track</span>
</div>

// Watch
<div className="bg-amber-100 border-amber-200 ...">
  <span className="bg-amber-500 ..." />
  <span className="text-amber-800">Watch</span>
</div>

// At risk
<div className="bg-red-100 border-red-200 ...">
  <span className="bg-red-500 ..." />
  <span className="text-red-800">At risk</span>
</div>
```

Always include the dot — it's a redundant cue for color-blind users.

Place the RAG indicator in the page header, top-right of the workspace. Don't embed it inside cards; it's the global health signal.

## Metric cards

For dashboard summaries: tasks at risk, completion %, days remaining, etc.

```tsx
<div className="bg-slate-50 rounded-lg p-4">
  <p className="text-xs text-slate-500 leading-[18px]">Tasks at risk</p>
  <p className="text-3xl font-semibold leading-10 text-slate-900 mt-1 font-mono tabular-nums">12</p>
  <p className="text-xs text-slate-500 mt-1">
    of <span className="font-mono">147</span> total
  </p>
</div>
```

Key details:
- Background: slate-50, no border. Distinct from raised cards (white + border).
- Number: `text-3xl font-semibold font-mono tabular-nums`. Tabular-nums prevents jitter when the value updates.
- Label above, secondary value below. Both small and slate-500.
- Grid layout: `grid grid-cols-2 md:grid-cols-4 gap-3`.

For a number that's "good," accent it cyan-700. For "bad" (e.g. tasks at risk), accent it red-700. Use sparingly — the default slate-900 is right for most.

## Sparklines and trend indicators

Avoid adding sparklines unless the data has a clear time series (e.g. % complete over time). When you do:

- Stroke: 1.5px, cyan-700 on light bg.
- No fill area beneath the line. (No gradient flourishes.)
- No axis labels — they're called sparklines for a reason.
- Endpoint dot: 3px filled circle in cyan-700.

## Tooltips on bars

When hovering a Gantt bar:

- Background: white with 1px slate-200 border, rounded-md, custom shadow.
- Padding: 12px.
- Content order: task name (font-semibold), task ID (mono slate-500), then a 2-column grid of metadata: Start/Finish/Duration/% complete/Status.
- Position: above the bar, with a small caret pointing down.

## Empty states

For "no plans yet" / "no analysis run yet" / "no risks identified":

- Centered in the available space.
- Icon: 48×48 monogram-simplified or a relevant lucide icon, slate-300.
- Heading: text-lg slate-700 font-semibold.
- Body: text-sm slate-500, max-w-sm centered.
- Single primary CTA below.

Don't use illustrations. The brand is restrained.

## Loading states

For long operations (parsing, analysis):

- Indeterminate progress bar: 2px tall, slate-200 track, cyan-400 indicator that slides.
- Below: text-sm slate-700 describing the step ("Parsing plan...", "Computing critical path...").
- For analysis specifically, include the time hint: "Generating analysis (5–8s)...".

Skeleton loaders for the task table: slate-100 fills, animated pulse at 1.5s ease-in-out. Shape-of-data, not generic blocks.

## Don'ts

- ✗ No 3D bars, no isometric Gantt views.
- ✗ No animations on Gantt bar appearance — they appear instantly.
- ✗ No emojis as status (no 🟢🟡🔴 — use the actual badge components).
- ✗ No celebratory states ("All on track! 🎉") — match RAG calmly.
- ✗ No marketing-style number animations (no count-up from zero).
- ✗ No comparison with industry benchmarks unless you actually have benchmark data.

## Related docs

- `colors.md` — full RAG color spec including 800-stop text colors
- `typography.md` — tabular-nums, mono pairing
- `components.md` — base button/card patterns this builds on

---

## Section: share-view.md

# Share view

The public read-only page stakeholders see when a PM shares a link. **This is a marketing surface as well as a product surface** — it should look polished, lightly branded, and good enough that a stakeholder asks "what tool is this?"

## What's different from the in-product view

- No login, no signup prompt, no nav chrome.
- Slightly larger, more breathable layout — stakeholders aren't power users.
- Less PMP jargon in labels (e.g. "Behind schedule" instead of "Negative float").
- AI summary is the **first thing** above the workspace, not buried in a sidebar.
- Subtle "View on PlanSight" badge in the corner — the viral hook.

## Layout

```
┌────────────────────────────────────────────────────┐
│  [PlanSight wordmark]              [View on PS] →  │  ← compact header
├────────────────────────────────────────────────────┤
│                                                    │
│  Project: <Name from .mpp>                         │  ← title + RAG
│  <Project narrative summary, 2–3 sentences>        │
│  [On track 🟢]   <metrics row>                      │
│                                                    │
│  Risks                                             │  ← AI risks card
│  ┌──────────────────────────────────────────────┐  │
│  │ • Risk 1 (refs t-0042, t-0089)               │  │
│  │ • Risk 2 (refs t-0014)                       │  │
│  │ • Risk 3 ...                                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Plan                                              │  ← workspace below
│  ┌──────────────────────┬───────────────────────┐  │
│  │  task table          │  Gantt                │  │
│  │                      │                       │  │
│  └──────────────────────┴───────────────────────┘  │
│                                                    │
├────────────────────────────────────────────────────┤
│  Built on PlanSight AI · Your data isn't training… │  ← footer
└────────────────────────────────────────────────────┘
```

## Header

- Background: white (or deep slate in dark mode — both viable; default to light for stakeholder familiarity).
- Height: 56px.
- Left: primary horizontal lockup, 32px tall, linking to https://plansightai.com (marketing site).
- Right: a "View on PlanSight" pill button (ghost style, cyan-700 text, opens the marketing site in a new tab).
- Border-bottom: 1px slate-200.

```tsx
<header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between">
  <a href="https://plansightai.com">
    <Image src="/brand/plansight-logo-primary.svg" alt="PlanSight AI" width={140} height={28} />
  </a>
  <a
    href="https://plansightai.com"
    target="_blank"
    rel="noopener"
    className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
  >
    View on PlanSight →
  </a>
</header>
```

## Project header section

Generous padding (`py-12 px-6`), constrained max-width (`max-w-6xl mx-auto`).

```tsx
<section className="max-w-6xl mx-auto px-6 py-12">
  <div className="flex items-start justify-between gap-6 flex-wrap">
    <div>
      <p className="text-xs font-semibold tracking-wider uppercase text-cyan-700">
        Project plan
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {planName}
      </h1>
      <p className="mt-3 text-base text-slate-700 max-w-2xl leading-7">
        {aiNarrativeSummary}
      </p>
    </div>
    <RagIndicator status={ragStatus} />
  </div>

  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
    <MetricCard label="Total tasks" value={totalTasks} />
    <MetricCard label="At risk" value={atRiskCount} accent={atRiskCount > 0 ? "red" : "default"} />
    <MetricCard label="On critical path" value={criticalPathCount} />
    <MetricCard label="Days remaining" value={daysRemaining} />
  </div>
</section>
```

## Risks card

The AI-generated risks list, presented as the headline insight. Each risk references specific task IDs in monospace.

```tsx
<section className="max-w-6xl mx-auto px-6 pb-12">
  <h2 className="text-lg font-semibold text-slate-900 mb-4">Risks identified</h2>

  <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
    {risks.map(risk => (
      <div key={risk.id} className="p-5 flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-900 leading-6">{risk.description}</p>
          {risk.taskRefs.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              References:{" "}
              {risk.taskRefs.map(id => (
                <code key={id} className="font-mono bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                  {id}
                </code>
              ))}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
</section>
```

If there are no risks, show a green-tinted empty state: "No risks identified. The plan looks healthy."

## Workspace (read-only Gantt + table)

Same patterns as `data-display.md`, with a few stakeholder-mode tweaks:

- All editing affordances hidden (no row hover handles, no "+" buttons, no kebab menus).
- Filter / search bar above the workspace is OK — stakeholders may want to find a specific task.
- "Critical path" toggle is visible and prominent — it's the most useful filter for non-PMs.
- Default zoom: **Week**.
- Default scroll position: today's date centered.

## Footer

A quiet trust strip — no marketing pitch, just a calm signal that PlanSight is professional.

```tsx
<footer className="border-t border-slate-200 py-8 px-6 mt-16">
  <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
    <div className="flex items-center gap-3">
      <Image src="/brand/plansight-monogram-light.svg" alt="" width={20} height={20} />
      <p className="text-xs text-slate-500">
        Built on <a href="https://plansightai.com" className="text-cyan-700 hover:text-cyan-800 font-semibold">PlanSight AI</a> · Your data isn't training data
      </p>
    </div>
    <p className="text-xs text-slate-400 font-mono">
      Last updated {lastUpdatedISO}
    </p>
  </div>
</footer>
```

## OG / social card metadata

When the share link is pasted into Slack, email, or social, the unfurl should read well. Set OG meta on every share page:

```tsx
<head>
  <title>{planName} — PlanSight AI</title>
  <meta name="description" content={aiNarrativeSummary.slice(0, 160)} />
  <meta property="og:title" content={`${planName} — PlanSight AI`} />
  <meta property="og:description" content={aiNarrativeSummary.slice(0, 160)} />
  <meta property="og:image" content={`/api/og?planId=${planId}`} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
```

The `/api/og` route should generate a 1200×630 image with: stacked logo top-left, plan name large, RAG indicator, and 4 metrics. Match the brand exactly — not a generic auto-card.

## Robots and indexing

Share pages should **not** be indexed by search engines (the URL is unguessable on purpose, and indexing would defeat the privacy model).

```tsx
<meta name="robots" content="noindex, nofollow" />
```

## Mobile

Stack everything vertically. Workspace becomes: filter bar, RAG, metrics, risks, then a tabbed view of "Tasks | Gantt" since both don't fit comfortably side by side. Default to "Tasks" tab on mobile — easier to scan.

## Don'ts

- ✗ No "Sign up to see more" gating. The whole point of the share view is frictionless access.
- ✗ No popups, no chat widgets, no "Made with [tool] 💚" cookie-cutter footers.
- ✗ No tracking pixels for ads (analytics OK, but minimal).
- ✗ No upsell to "claim this plan" if the viewer is signed in — that goes elsewhere.
- ✗ No "stakeholder mode" theme switcher. There is one share view.

## Related docs

- `data-display.md` — Gantt and table conventions, applied here
- `voice.md` — narrative tone, especially for the AI summary
- `logo.md` — wordmark sizing for the header

---

## Section: assets.md

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

---

## Section: donts.md

# Don'ts

The boundary list. When tempted to do any of these, stop and read the relevant doc instead.

## Logo and brand mark

- ✗ Don't recolor the cyan accent. Cyan is fixed.
- ✗ Don't stretch, distort, rotate, skew, or flip any element of the mark.
- ✗ Don't add effects: no drop shadows, glows, gradients, strokes, or outlines.
- ✗ Don't redraw the mark in a different style.
- ✗ Don't set "AI" larger than the wordmark cap height.
- ✗ Don't place the lockup on busy or low-contrast backgrounds.
- ✗ Don't compose the mark with a competing logo without clear-space (X minimum).
- ✗ Don't use the simplified monogram for sizes >32px.
- ✗ Don't recreate the logo as inline SVG in components — always reference the file.
- ✗ Don't apply CSS filters to recolor (`filter: hue-rotate()`). Use the monochrome variant with `currentColor`.

## Color

- ✗ Don't introduce a second accent color. There is no purple, no orange, no pink.
- ✗ Don't use red on UI that isn't about project status. (No red delete buttons, no red "danger" zones.)
- ✗ Don't use cyan for body text — it's an accent, not a content color.
- ✗ Don't use cyan in three places on the same screen. One CTA, one accent, max.
- ✗ Don't use pure black (`#000`) — use ink (`#0B1220`).
- ✗ Don't use Tailwind's default gray scale — use slate, which the brand is built on.
- ✗ Don't pair colored fills with plain black or generic gray text. Use the 800-stop of the same hue.

## Typography

- ✗ Don't use font-weight 500. Two weights only: 400 and 600.
- ✗ Don't use font-weight 700+ in product UI.
- ✗ Don't use ALL CAPS or Title Case. Sentence case, always.
- ✗ Don't use serif fonts. The brand is sans-only.
- ✗ Don't use more than three font sizes on a single screen.
- ✗ Don't add drop shadows, text-stroke, gradient text, or any text effects.
- ✗ Don't use emoji as typography. (No 🚀, no ✨, no 📊, anywhere.)
- ✗ Don't combine bold + italic in the same span.
- ✗ Don't use Geist Mono for body copy — it's for data only.

## Voice

- ✗ Don't use banned words: *unleash, supercharge, revolutionize, transform, empower, leverage, seamless, frictionless, effortless, magical, delightful, AI-powered, next-gen, cutting-edge, state-of-the-art, industry-leading, best-in-class, world-class, crush it, level up, game-changer, 10x, pro tip, fun fact, hot take, hack.*
- ✗ Don't use exclamation marks in UI copy. (Acceptable rarely in marketing, never in product.)
- ✗ Don't use emojis in any product copy, ever.
- ✗ Don't anthropomorphize the AI ("I think you should…"). The narrative is third-person.
- ✗ Don't write "Click here" — write the actual action ("Upload plan").
- ✗ Don't sign off emails with "the PlanSight team!! 💚". Sign off plainly.
- ✗ Don't invent new taglines without updating `voice.md`.

## Components and UI

- ✗ Don't use Tailwind's default `shadow-md` / `shadow-lg`. Use the custom navy-tinted shadows from `tokens.md`.
- ✗ Don't use `rounded-2xl` and above — too soft, breaks the analytical feel.
- ✗ Don't use bouncy or springy animations. Default ease-out, 150ms or 300ms only.
- ✗ Don't add toasts that auto-dismiss with countdown bars.
- ✗ Don't add confetti, celebratory animations, or count-up number effects.
- ✗ Don't add streaks, achievements, or completion percentages on the dashboard.
- ✗ Don't add "Tip of the day" cards or onboarding mascots.
- ✗ Don't have more than one primary CTA visible at once.
- ✗ Don't use red for "destructive" actions in dense UI — use neutral with text confirmation.
- ✗ Don't combine border AND shadow on the same card. Pick one.

## Data display

- ✗ Don't use 3D bars or isometric Gantt views.
- ✗ Don't animate Gantt bars on appearance.
- ✗ Don't use emojis as status indicators (no 🟢🟡🔴 — use the actual badge components).
- ✗ Don't add celebratory states ("All on track! 🎉").
- ✗ Don't add count-up animations to metrics.
- ✗ Don't compare to "industry benchmarks" unless real benchmark data exists.
- ✗ Don't use stripes/patterns for progress fills — solid color overlay only.
- ✗ Don't recolor entire rows for status — use the Status column badge.
- ✗ Don't use thicker than 1.5px for any line in the Gantt (dependency, today line, borders).

## Share view (stakeholder-facing)

- ✗ Don't add "Sign up to see more" gating.
- ✗ Don't add popups, chat widgets, or cookie banners beyond the legally required minimum.
- ✗ Don't add tracking pixels for ads.
- ✗ Don't index share pages in search engines (`noindex, nofollow`).
- ✗ Don't have a "stakeholder mode" theme switcher. There is one share view.

## Architecture and data

- ✗ Don't show the user's own data back to them with "training data" framing — the brand promise is that we don't train on it.
- ✗ Don't display PII or financial data outside what was in the uploaded file.
- ✗ Don't auto-share plans without explicit PM action.
- ✗ Don't expire share links silently. If they expire, surface why.

## Tokens and tooling

- ✗ Don't add a new color outside the palette without updating the brand docs.
- ✗ Don't add a new font size outside the scale without updating `typography.md`.
- ✗ Don't add a new shadow, animation duration, or border-radius value without consensus.
- ✗ Don't extend `tailwind.config.ts` with values that conflict with `tokens.md`.

## When in doubt

If a design choice would surprise a senior PM or feel theatrical, it's wrong. Choose the quieter option.

## Related docs

- `brand-essence.md` — the why behind these don'ts
- All other docs — the do's that pair with each don't
