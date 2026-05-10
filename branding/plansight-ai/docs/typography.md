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
