# Pricing section — three-tier comparison table

Spec for the section of the PlanSight AI marketing page that compares Anonymous, Free signed-up, and Pro tiers. Implemented in `components/plansight-ai/PlanSightPricingSection.tsx` and rendered on `/products/plansight-ai` below the workspace.

## Purpose

The section answers three questions in order:

1. **Can I try this without signing up?** Yes — Anonymous gets the full toolkit.
2. **What does signing up add?** Plan persistence and never-expiring share links.
3. **What does $19/mo unlock?** Re-runnable AI, weekly status PDFs, "Explain this task" AI, multi-plan dashboard, PDF export.

A prior iteration used three stacked tier blocks; visitors found it scattered. The shipped layout is a single comparison table with clickable rows that open a per-feature detail dialog.

## Layout

```
ANALYSIS                                                      (eyebrow, cyan-700)
Free for the first AI analysis. Pro for daily use.            (h1, ink)
[Intro paragraph — three sentences mapped to the three tiers]

┌──────────────────────────┬──────────────┬──────────────┬─────────────────┐
│                          │  ANONYMOUS   │   FREE       │  PRO            │
│                          │  no signup   │  with signup │  AI on demand   │
│                          │  Free        │  Free        │  $19/mo         │
│                          │              │              │  or $190/yr     │
│                          │              │              │  · save 17%     │
├──────────────────────────┼──────────────┼──────────────┼─────────────────┤
│ Upload .mpp file         │      ✓       │      ✓       │       ✓         │
│ Insights engine          │      ✓       │      ✓       │       ✓         │
│ Export as Excel          │      ✓       │      ✓       │       ✓         │
│ AI analysis              │ First free   │ First free   │  Included       │
│ Public share link        │  24 hours    │ Never expires│  Never expires  │
│ Revoke share link        │      —       │      ✓       │       ✓         │
│ Plans saved              │      —       │ 1 (most rec.)│  Unlimited      │
├──────────────────────────┴──────────────┴──────────────┼─────────────────┤
│ PRO · AI ON DEMAND                                      │   INCLUDED      │
├──────────────────────────┬──────────────┬──────────────┼─────────────────┤
│ Regenerate AI analysis   │      —       │      —       │       ✓         │
│ Weekly status report     │      —       │      —       │       ✓         │
│ Explain this task        │      —       │      —       │       ✓         │
├──────────────────────────┴──────────────┴──────────────┼─────────────────┤
│ PRO · WORKFLOW                                          │   INCLUDED      │
├──────────────────────────┬──────────────┬──────────────┼─────────────────┤
│ My Plans dashboard       │      —       │      —       │       ✓         │
│ Export as PDF            │      —       │      —       │       ✓         │
│ Password-protected links │      —       │      —       │       ✓         │
│ File size limit (muted)  │    5 MB      │    5 MB      │     25 MB       │
├──────────────────────────┼──────────────┼──────────────┼─────────────────┤
│ Click any row for detail │ [Try free →] │[Sign up free→]│ Upgrade·$19/mo │
└──────────────────────────┴──────────────┴──────────────┴─────────────────┘
```

Feature rows are buttons. Click anywhere on a row → opens a per-feature dialog. Section-divider rows (`PRO · AI ON DEMAND`, `PRO · WORKFLOW`) and the footer row are non-interactive.

## Header copy

| Element | Value |
|---|---|
| Eyebrow | `ANALYSIS` (cyan-700, micro 11px uppercase) |
| Headline | `Free for the first AI analysis. Pro for daily use.` |
| Intro | Three-sentence paragraph mapped to the three tiers — see component for exact wording. |

## Column headers

| Column | Eyebrow | Sub-label | Price |
|---|---|---|---|
| Anonymous | `ANONYMOUS` (slate-500) | `no signup` | `Free` |
| Free | `FREE` (slate-500) | `with signup` | `Free` |
| Pro | `PRO` (cyan-700) | `AI on demand` | `$19/mo` + `or $190/yr · save 17%` sub-line |

Pro column header sits on a continuous cyan-50 fill that extends the full height of the column (header → rows → footer). The annual sub-line is static text, not an interactive toggle — an earlier iteration had a Monthly/Annual toggle but the shipped design uses static text per the design comp.

## Rows

Each row carries a `kind`: `"feature"` (clickable) or `"divider"` (non-interactive section break).

### Feature rows

| Key | Label | Anonymous | Free | Pro |
|---|---|---|---|---|
| `upload` | Upload .mpp file | ✓ | ✓ | ✓ |
| `insights-engine` | Insights engine | ✓ | ✓ | ✓ |
| `excel-export` | Export as Excel | ✓ | ✓ | ✓ |
| `ai-analysis` | AI analysis | First analysis free | First analysis free | **Included** |
| `share-link` | Public share link | 24 hours | Never expires | **Never expires** |
| `revoke-share` | Revoke share link | — | ✓ | ✓ |
| `plans-saved` | Plans saved | — | 1 (most recent) | **Unlimited** |
| `regenerate-ai` | Regenerate AI analysis | — | — | ✓ |
| `weekly-report` | Weekly status report | — | — | ✓ |
| `explain-task` | Explain this task | — | — | ✓ |
| `my-plans` | My Plans dashboard | — | — | ✓ |
| `pdf-export` | Export as PDF | — | — | ✓ |
| `share-password` | Password-protected share links | — | — | ✓ |
| `file-size` | File size limit (muted) | 5 MB | 5 MB | 25 MB |

**Bold cells** render with `font-semibold text-cyan-700`. The `file-size` row is rendered muted (`text-slate-500`) since it's a constraint rather than a benefit.

### Divider rows

| Key | Left label (cols 1–3) | Right label (Pro col) |
|---|---|---|
| `div-ai` | `PRO · AI ON DEMAND` (slate-600, micro uppercase) | `INCLUDED` (cyan-700, micro uppercase) |
| `div-workflow` | `PRO · WORKFLOW` (slate-600, micro uppercase) | `INCLUDED` (cyan-700, micro uppercase) |

Divider rows visually segment the table into "shared features" / "Pro AI" / "Pro workflow". The left cell uses slate-50 background; the right cell uses cyan-100/60 to sit one shade deeper than the cyan-50 column fill.

## Detail dialog (on row click)

Triggered by clicking any feature row.

```
┌──────────────────────────────────────────────────────┐
│ {eyebrow}                                       [✕]  │
│ {feature.label}                                      │
│                                                      │
│ {lede paragraph — one sentence on what the feature   │
│  does and why a PM cares}                            │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ ANONYMOUS · NO SIGNUP                          │  │
│ │ {per-tier copy}                                │  │
│ └────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────┐  │
│ │ FREE · WITH SIGNUP                             │  │
│ │ {per-tier copy}                                │  │
│ └────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────┐  │
│ │ PRO · AI ON DEMAND     ← cyan-600 border       │  │
│ │ {per-tier copy}                                │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│                          [Close]  [Upgrade to Pro]   │
└──────────────────────────────────────────────────────┘
```

- White card on navy-tinted backdrop scrim, `bg-navy/70 backdrop-blur-sm`.
- Closes on backdrop click, Escape key, or `✕` button.
- Per-tier blocks are `<dl>` semantics for screen readers.
- The Pro tier block carries the same 2px cyan-600 border + cyan-50 fill used in the table.
- The bottom `Upgrade to Pro` button routes to `/upgrade` (same destination as the table's primary CTA).

Per-feature dialog content lives inline in the `ROWS` constant in the component file. Each entry has `detail.eyebrow`, `detail.lede`, and `detail.perTier.{anonymous,free,pro}`. Adding a row is one object literal.

## CTAs

Three buttons live inside the table's footer row, one per tier column.

| Column | Style | Destination | Label |
|---|---|---|---|
| Anonymous | Outline (secondary) | Smooth-scroll to `#plansight-workspace` anchor on the same page; focus moves to the first focusable element inside the workspace shell. No route change. | `Try free →` |
| Free | Outline (secondary) | `/signup?redirectTo=/products/plansight-ai` | `Sign up free →` |
| Pro | Cyan-700 fill (primary) | `/upgrade` today; swap to Stripe Checkout when Phase 5 lands (destination change only, no copy change) | `Upgrade · $19/mo` |

The footer row's first column (label position) shows a muted hint: `Click any row for details.`

The Pro footer cell carries the same cyan-50 fill as the rest of the Pro column.

## Pro column emphasis

The Pro column is the only differentiator the section sells. Visual treatment:

1. **Continuous cyan-50/70 fill** spanning header → every body cell → footer cell.
2. **cyan-200 bottom border** on the Pro header (vs slate-200 on the other two headers) to mark column ownership early.
3. **cyan-100/60 fill** on the Pro side of section divider rows so `INCLUDED` reads as the "answer" to the section title.
4. **cyan-700 text** on cyan accent values (`Included`, `Never expires` on Pro, `Unlimited`).
5. **cyan-700 fill** on the Upgrade button.

The column fill is applied per-cell rather than as an absolute overlay so it survives row hover states without misalignment.

## Mobile fallback (<768px)

Below 768px the table is replaced by three vertically stacked accordion cards — one per tier. Pro is open by default; Anonymous and Free are collapsed.

- Each card's header shows the tier eyebrow, sub-label, and price (`Free` or `$19/mo` + annual sub-line).
- Expanding a card reveals the same feature rows shown on desktop, with the values for that tier only. Section dividers render inline as small labels (with `INCLUDED` shown on the Pro card only).
- Feature rows remain clickable → same dialog.
- Each card has its own bottom CTA (Try free / Sign up free / Upgrade · $19/mo).
- The Pro card carries the bordered cyan emphasis (cyan-50 fill + cyan-600 2px border + subtle cyan shadow).

## States and interactions

The section has three interactive surfaces:

1. **Feature rows** — full-width button. Hover lifts background to `slate-50/80` on the first three cells and `cyan-50` on the Pro cell. Click opens the dialog. Focus ring on keyboard focus.
2. **Mobile accordion headers** — toggle expand/collapse. Pro card expanded by default.
3. **CTAs** — standard primary/secondary button hover states per `branding/plansight-ai/docs/components.md`.

Divider rows and the footer hint are not interactive. The file-size-limit row is clickable (it's a feature row, just rendered muted) so visitors who care about limits can drill in.

## Voice notes

- Headline frames the dichotomy as **time horizon** (first AI analysis vs daily use), not feature parity. This is the right frame: the same PM uses Free until they hit the "I need this re-run" moment.
- All three tiers show a price (`Free` / `Free` / `$19/mo`). No "coming soon" language anywhere. The Pro tier reads as live and shoppable.
- The annual sub-line (`or $190/yr · save 17%`) sits one type size below the monthly price — visible to price-sensitive readers, ignorable to everyone else.
- Per-tier copy in the dialog leads with the tier's relationship to the feature, not its absence. Example: Free's `Plans saved` reads "One saved plan. Uploading a new file replaces it." rather than "Limited to 1."

## Accent color usage

This section uses cyan in five places, per `branding/plansight-ai/docs/colors.md`'s "cyan is precious" rule:

1. The `ANALYSIS` eyebrow above the section headline.
2. The `PRO` column eyebrow + sub-label, the Pro column fill, and the divider rows' `INCLUDED` labels.
3. The bold accent values on Pro cells (`Included`, `Never expires`, `Unlimited`).
4. The `Upgrade to Pro` button on the table footer and in the dialog.
5. The dialog's Pro tier detail block (2px cyan-600 border, cyan-50 fill).

Non-Pro tier eyebrows (`ANONYMOUS`, `FREE`) use `text-slate-500`. Divider rows' Pro sub-labels (`PRO · AI ON DEMAND` etc.) use slate-600 because they're labels, not accents.

## Anonymous TTL and the in-product reminder

The 24-hour anonymous TTL is the conversion mechanic, not just a constraint. The workspace renders a persistent banner for anonymous users while a plan is loaded:

> ⏱ **This plan expires in 24 hours.** Anonymous plans and their share links are kept for 24 hours, then deleted. Sign up free to keep this plan — and its share link — forever. Upgrade to Pro to keep every plan you upload.
>
> [Save my plan — sign up free]

The banner uses a cyan-200 border + cyan-50 fill (one shade stronger than the surrounding workspace) so it reads as the next action, not a passive notice. Implemented in `PlanSightProductShell.tsx`; renders when `!signedIn` and a plan is loaded.

Backend enforcement: `lib/plansight-ai/guest.ts` exports `getGuestPlanExpiryIso(hours = 24)`. The share-storage `saveSharedPlan` sets `expires_at = getGuestPlanExpiryIso(24)` for guest rows and `null` for signed-in users. Cleanup runs opportunistically inside `saveSharedPlan` (best-effort, non-blocking). No scheduled job; no env-var override.

## Open questions / known gaps

_None at the moment._

## Out of scope

- Per-seat or team pricing (Pro is single-seat; team is a future tier).
- Pro v1.1 roadmap (version compare, AI chat). Marketing only shows what ships today.
- Repeating the hero's value prop. The hero answers "what is PlanSight?"; this section answers "what does it cost?".

## Related docs

- `branding/plansight-ai/docs/components.md` — card and button patterns referenced above
- `branding/plansight-ai/docs/colors.md` — cyan usage rules, contrast pairs
- `branding/plansight-ai/docs/tokens.md` — Tailwind classes referenced above
- `branding/plansight-ai/docs/voice.md` — copy guidelines this section follows
- `docs/plansight-ai/specs/pro-features.md` — source of truth for Pro tier feature list and gates
