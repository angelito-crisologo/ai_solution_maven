# Pricing section — three-tier comparison

Spec for the section of the PlanSight AI marketing page that compares Anonymous, Free signed-up, and Pro tiers. Replaces the earlier "Free for the first analysis. Pro for daily use." card layout, which conflated tiers and gave the impression that Pro features were "coming soon" rather than live.

## Purpose

This section sits below the hero on the marketing page. Its job is to communicate three things in order:

1. **Visitors can try the full product without signing up.** No friction.
2. **Signing up is free and adds one tangible benefit** (plan persistence).
3. **Pro is live today and unlocks AI you can run as often as the plan changes.**

The earlier section failed at #3 — the "Pro tier ahead" badge implied roadmap, not shop. This spec fixes that by leading with availability ("Pro is live today") and showing a clear price + CTA.

## Section structure

```
ANALYSIS (eyebrow)
PMP-grade insights, free. AI on demand, Pro. (h1)
[Intro paragraph, 3 sentences mapped to the 3 tiers]

─ Tier 1: Anonymous · no signup ─
  Eyebrow + "Live" badge
  Lede line
  Deterministic insights card (1 wide)
  AI analysis cards (2 across)
  Footer line: share link · Excel export · 24-hour retention

─ Tier 2: Free · with signup ─
  Eyebrow + "Live" badge
  Lede line
  "Your latest plan, kept" card (1 wide)

─ Tier 3: Pro · AI on demand ─
  Eyebrow + price-toggle pill (Monthly $19/mo · Annual $190/yr)
  Lede line
  AI cards (3 across, cyan left-border accent)
  "Pro · workflow" sub-row
  Workflow cards (2 across, no accent)

CTA row: [Try free · no signup needed]  [Upgrade to Pro · $19/mo]
```

The three tiers are separated by horizontal hairlines (0.5px slate-200), reinforcing that these are distinct offerings, not a gradient.

## Visual hierarchy rationale

Each tier's visual weight is calibrated to its role in the funnel:

| Tier | Visual weight | Why |
|---|---|---|
| Anonymous | Heaviest — 3 feature blocks | Most visitors start here. Show the full extent of what they get without signing up. |
| Free signed-up | Lightest — 1 card | The increment from anonymous is a single feature. Honest representation. |
| Pro | Heaviest, split into two sub-rows | This is what the section is selling. AI sub-row gets cyan left-border accent. |

The Pro tier is the only one with cards that carry an accent color (cyan left border on the three AI cards). This signals that AI features are where the headline value lives. Workflow features below get neutral cards — they're supporting, not headline.

## Copy

### Eyebrow
`ANALYSIS`

### Headline
`Critical-path insights, free. AI on demand, Pro.`

Captures the actual dichotomy without borrowing authority from PMI certification. "Critical path" is the most universally recognized PM concept; it signals depth without sounding presumptuous. Free isn't a teaser — it's a real tool with a deterministic engine and one AI run. Pro is what you upgrade to when you're running the same plan weekly.

The Anonymous tier card still keeps the italic `Computed per PMBOK conventions.` footnote for credibility — that's the right place for the certification signal, not the section headline.

### Intro paragraph
> Upload any .mpp file and PlanSight computes critical path, late tasks, at-risk tasks, and overall project health — for free, no signup needed. Sign up and your most recent plan stays in your account between sessions. Pro is live today — upgrade for AI you can re-run whenever the plan changes, a one-click weekly status report, and inline "Explain this task" AI on any task. Plus a multi-plan dashboard and PDF export.

Three sentences, each mapped to a tier in funnel order.

### Tier labels

| Tier | Eyebrow | Status badge | Lede line |
|---|---|---|---|
| Anonymous | `ANONYMOUS · NO SIGNUP` | `Live` (cyan-50 fill, cyan-700 text) | Upload, view, analyse, share. The full toolkit, no friction. |
| Free | `FREE · WITH SIGNUP` | `Live` | Everything in Anonymous, plus your latest plan stays. |
| Pro AI | `PRO · AI ON DEMAND` | Price toggle (see below) | AI you can run as often as the plan changes. |
| Pro workflow | `PRO · WORKFLOW` | (none) | (no lede) |

## Cards

### Anonymous tier — Deterministic insights (1 card, wide)

| Field | Value |
|---|---|
| Title | Deterministic insights |
| Body | Critical path · Late tasks · Tasks at risk · Lagging tasks · Per-task status · Summary counts |
| Footnote (italic) | Computed per PMBOK conventions. |

Single card with a comma-separated list rather than six individual tiles. Reads as "a full insights engine," not "six features." The italic PMBOK line is the credibility signal that earns PM trust.

### Anonymous tier — AI analysis (2 cards)

Sub-heading above the cards: `AI analysis · one generation per plan`

The "one generation per plan" qualifier is essential — it's what makes Pro's regenerate feature valuable later. Without it, Free reads as "unlimited AI," which makes the Pro pitch weaker.

| Card | Icon | Body |
|---|---|---|
| AI summary | sparkle/star | Narrative read of the project's current state. |
| Recommendations | check | Prescriptive actions tied to specific tasks. |

Cards use the standard `surface-card` pattern (white bg, 0.5px slate-200 border, rounded-lg). No accent.

### Anonymous footer line

After the cards, a single line of tertiary text:

```
Stakeholder share link · Excel export · Plan kept 24 hours
```

Three items in order of decreasing excitement: share link is the viral hook, Excel export is the deliverable, 24-hour retention is the constraint that powers the Free signup pitch (sign up and the plan — plus its share link — sticks around).

### Free tier — Your work, kept (1 card, two bullets)

| Field | Value |
|---|---|
| Title | Your work, kept |
| Icon | grid-2x2 (matches "dashboard" semantics without implying multiple plans yet) |
| Body | Two things you get for signing up:<br>• **Your latest plan, kept.** Your most recent upload stays in your account — re-open it any time without re-uploading. Replaced when you upload a new one.<br>• **Share links that don't expire.** Send a stakeholder the URL and it still works months later, instead of breaking after 24 hours. |

One card, two bullets. The second bullet is the conversion lever — a PM whose share link doesn't break in front of their CEO has a concrete reason to sign up. Don't pad with a third.

#### Free signup link (text link, not button)

Directly below the Free card, a single inline text link:

```
Save my plan — sign up free →
```

| Field | Value |
|---|---|
| Style | Text link, `text-cyan-700`, `text-caption` (12px), no underline at rest, underline on hover |
| Destination | `/signup?redirectTo=/products/plansight-ai` |
| Position | Centered horizontally below the card, ~12px gap |

Deliberately a text link rather than a button. Two reasons: (1) preserves the section's "two-button decision" frame so the Pro CTA stays the focal action; (2) lets a PM who's already convinced about Free skip the upload step and create an account first. This is the section's quiet trial→signup conversion mechanic.

### Pro AI tier — three cards

Cards have a 2px cyan-600 left border (the only deliberate exception to the 0.5px border rule — components.md allows it for "featured" emphasis). Border-radius is set to 0 on the left side so the accent reads as a flag, not a stripe.

| Card | Icon | Subtitle |
|---|---|---|
| Regenerate AI | refresh-cw | Re-run any time the plan changes. |
| Weekly status report | file-text | One click, ready to send. |
| Explain this task | sparkle/star | Single-task AI on demand. |

Titles are the verbs/nouns the user will recognize. Subtitles are five-word value statements, not feature descriptions.

### Pro workflow tier — two cards

Neutral cards (no accent border). Same `surface-card` pattern as Anonymous cards.

| Card | Icon | Subtitle |
|---|---|---|
| My Plans dashboard | grid-2x2 | Unlimited plans, one workspace. |
| PDF export | file-text | Landscape, ready to forward. |

Two cards is the right number. Workflow features that aren't built (custom branding, task annotations, saved filtered views, higher upload limits) are explicitly excluded — see `PLANSIGHT_PRO_FEATURES.md` for the trimmed source of truth.

## Price toggle (Pro tier only)

A small segmented control sits in the Pro tier header where a static price badge would otherwise live. It is the only interactive element in the section. Two segments:

| Segment | Label (top) | Sub-label (small, below) | Default |
|---|---|---|---|
| Monthly | `$19/mo` | (none) | ✓ selected on page load |
| Annual | `$190/yr` | `save 17%` (cyan-700) | — |

| Field | Value |
|---|---|
| Width | Auto-fit, ~180px combined |
| Style | Pill, slate-200 border (0.5px), rounded-md, white bg; selected segment fills cyan-700 with white text; unselected segment is slate-700 on white |
| Position | Right-aligned in the Pro tier header row, vertically centered with the `PRO · AI ON DEMAND` eyebrow |
| Component | Client component — this is the section's one exception to the "static display" rule |
| State | URL-less (component state only). No querystring. The selection only affects this section's price + CTA. |

The toggle controls **two** pieces of copy on the page:

1. The price shown next to the toggle (already the toggle's own label, no extra render).
2. The right-hand CTA button label — see CTAs section below.

The toggle does NOT change the destination URL of the Pro CTA. Plan selection is captured on the Stripe Checkout page itself; the toggle is a marketing affordance that previews the choice and primes annual buyers before they reach checkout.

When **Annual** is selected, a small caption appears below the toggle:

```
Two months free · billed annually
```

Caption is `text-caption` (12px), `text-slate-500`, fades in 150ms when annual is selected, fades out when monthly returns. Reserves vertical space at all times so the layout doesn't jump.

## CTAs

Two buttons at the bottom of the section. Skip a separate CTA for Free signup — sign-up happens naturally when a PM uploads a second plan, and making it a focal CTA here would crowd the decision.

| Button | Style | Action | Label |
|---|---|---|---|
| Left (secondary) | Outline | Smooth-scroll to the workspace anchor (`PlanSightProductShell`) with focus moved to the upload zone. No route change, no querystring. | Try free · no signup needed |
| Right (primary) | Cyan-700 fill | → `/upgrade` today; swap to Stripe Checkout when Phase 5 lands (destination change only) | `Upgrade to Pro · $19/mo` (Monthly) / `Upgrade to Pro · $190/yr` (Annual) — label tracks the price toggle |

Both buttons match `components.md` patterns. The right button is the only primary CTA on this section — and arguably one of two on the entire marketing page.

## Voice notes

- The price ($19/mo, with $190/yr as an annual option) is shown in a price-toggle pill in the Pro tier header, not buried in body copy. Visitors should see the monthly price within one second of scrolling into the section; the annual option is one click away for the price-sensitive segment.
- "Live" badges on Anonymous and Free remove any ambiguity that these are "coming soon."
- The Pro AI sub-row's lede ("AI you can run as often as the plan changes") frames the value as **frequency**, not capability. This is the right frame: every Pro AI feature is something you'd want to do *repeatedly*, and that's what justifies a subscription over a one-time purchase.
- No banned words (`voice.md`). No exclamation marks. No emojis.

## Accent color usage

This section uses cyan in exactly four places, per `colors.md`'s "cyan is precious" rule:

1. The eyebrow text on `ANALYSIS` and `PRO · AI ON DEMAND` (cyan-700 on light bg).
2. The `Live` status pills on Anonymous and Free tiers (cyan-50 fill, cyan-700 text).
3. The 2px left border on the three Pro AI cards (cyan-600).
4. The selected segment of the price toggle (cyan-700 fill, white text) and the `save 17%` sub-label on the annual segment (cyan-700).

The primary CTA button uses cyan-700 fill. That's the final cyan moment.

**Non-cyan eyebrows** (`ANONYMOUS · NO SIGNUP`, `FREE · WITH SIGNUP`, `PRO · WORKFLOW`) use `text-slate-500` — visible but neutral, so cyan stays earned. Anywhere else in the section, cyan would dilute the signal.

## Tokens used

From `tokens.md`:

- Surfaces: `bg-white`, `bg-slate-50` (none used — section sits on page bg)
- Borders: `border-slate-200` (0.5px hairlines)
- Card radius: `rounded-lg`
- Accent: `cyan-600` (border), `cyan-700` (text, button fill, primary)
- Text: `text-slate-900` (titles), `text-slate-700` (body), `text-slate-500` (lede), `text-slate-400` (footnotes)
- Font sizes: `h1` 22px (display-trimmed), `body` 14px, `caption` 12px, `micro` 11px (eyebrow uppercase tracking)

## States and interactions

Cards are intentionally non-interactive — no click, no hover. Telegraphing interactivity on a static comparison creates a "where do I click?" dead end. The only interactive elements in the section are the price toggle, the two CTAs, and the Free signup text link.

- **Cards (Anonymous, Free, Pro AI, Pro workflow):** no hover state, no click handler. Pointer stays default. The cyan left-border accent on Pro AI cards is purely a visual flag, not an affordance.
- **Price toggle:** standard segmented-control behavior — hover lifts the unselected segment's bg to slate-50; selected segment shows cyan-700 fill at all times. Focus visible on each segment per below.
- **Free signup text link:** underline on hover, cyan-700 color, no other change.
- **CTAs:** standard button hover states per `components.md` (primary darkens cyan-700 → cyan-800; secondary border darkens slate-200 → slate-300).
- **Focus visible (all interactive elements):** standard 2px cyan-400 ring with 2px offset (per `components.md`).

## Mobile layout (<768px)

- Tiers stack vertically (they already do at all widths thanks to single-column flow).
- All multi-card grids collapse to single column.
- **Pro tier card padding tightens** from `p-6` to `p-4` on both the AI and workflow cards below 768px. With 5 cards stacking, this trims ~80px of vertical scroll without losing the card frame or icon. Anonymous and Free cards keep `p-6` — they're fewer in number and the breathing room matters.
- CTAs stack vertically with the primary on top.
- The price toggle stays right-aligned in the Pro tier header on tablet, drops to full-width below the eyebrow on phones (<480px).
- The Pro AI sub-row's left-border accent stays — it still works in single column.
- The deterministic-insights comma list becomes a `<ul>` with one item per line below 480px.

## Accessibility

- Eyebrows use `font-size: 11px` (the minimum permitted by the design system) with uppercase + letter-spacing. Visible to screen readers as section labels — no `aria-hidden`.
- The cyan-50 / cyan-700 status pills pass WCAG AA (4.6:1).
- Card titles are `<h3>` semantically; sub-row labels ("Pro · AI on demand", "Pro · workflow") are `<h4>`.
- The PMBOK conventions line is plain prose — not a footnote element. Screen readers read it in order with the rest of the card content.

## Out of scope for this section

The pricing section deliberately does *not*:

- Include a feature-by-feature comparison table. Each tier stands on its own; comparison happens visually through the layout, not through a literal table.
- Mention the 14-day retention or signed-up persistence as standalone "features." They're constraint/footer language, not selling points.
- Show roadmap features (custom branding, task annotations, saved filtered views, version compare, AI chat). Marketing only shows what ships today.
- Repeat the hero's value proposition. The hero answers "what is PlanSight?"; this section answers "what does it cost?".

## Related docs

- `voice.md` — copy guidelines this section follows
- `colors.md` — cyan usage rules, contrast pairs
- `components.md` — card and button patterns
- `tokens.md` — Tailwind classes referenced above
