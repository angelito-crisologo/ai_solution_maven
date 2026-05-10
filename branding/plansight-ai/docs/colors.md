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
