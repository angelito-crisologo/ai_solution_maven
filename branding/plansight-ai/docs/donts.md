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
