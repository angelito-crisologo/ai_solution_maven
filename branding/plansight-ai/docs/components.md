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
