# PlanSight AI — Launch Improvements

**For:** Claude Code, working on the AI Solution Maven / PlanSight AI codebase.
**Scope:** Concrete changes to ship before the public launch. Each task is independently shippable.
**Voice constraint:** Per `PlanSightAIBrandGuidelines.pdf` — calm, specific, no marketing adjectives, no startup hype. Concrete nouns, active verbs. When in doubt, cut it in half. Do not invent copy that violates this register.
**Live page being improved:** `/products/plansight-ai`

---

## Priority order

Ship in this order. Items 1–5 and 7 are the highest-ROI page changes and they unblock the T-7 soft launch. Items 6 and 8 can ship in parallel or immediately after. Item 9 is a checklist, not a code change, but must be green before announcing publicly.

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | Hero CTA — visible primary action above the fold | High | S |
| 2 | Hero visual — screenshot or short demo | High | S–M |
| 3 | Promote the "Pro is live today" line | Medium | S |
| 4 | Sharpen Free vs Pro contrast in pricing | Medium | S |
| 5 | Claude credibility line | Low | XS |
| 6 | Stakeholder-facing landing variant | High | M |
| 7 | Rename "Anonymous" pricing column header | Low | XS |
| 8 | One additional guide for SEO | Medium | M |
| 9 | Pre-launch readiness checks | Required | M |

---

## 1. Hero CTA — visible primary action above the fold

**Problem.** The hero has no primary button. A first-time visitor cannot tell what action to take. The upload control sits below the fold and looks the same as everything else on the page.

**Change.** Add one primary CTA in the hero that scrolls to (or expands) the importer and moves focus to the file input. Add one secondary link to pricing.

**Copy.**
- Primary button label: `Upload your .mpp file`
- Secondary link label: `See pricing`

Do not use "Try it free" or "Get started." Both are generic and conflict with the brand voice.

**Behavior.**
- Click primary → smooth-scroll to `#plansight-workspace`, move focus to the file input.
- Use the brand cyan accent (`#22D3EE`) for the primary button.
- Keyboard accessible. Visible focus ring.
- Full-width on mobile within the hero container.

**Acceptance.**
- Primary action is visible above the fold on 1366×768 and on 390×844.
- A first-time visitor can identify the next action within 3 seconds.
- Lighthouse accessibility score does not regress.

---

## 2. Hero visual — screenshot or short demo

**Problem.** The hero is text-only. PMs need to see a Gantt before they will trust the upload flow.

**Change.** Add one visual asset to the hero. Pick the cheapest option that works:

1. **Static screenshot** of the workspace with a real-looking plan loaded. No annotations. Use the dark surface from the brand palette (`#0B1220`) as chrome. *Fastest.*
2. **Short looping video** (10–15 seconds, muted, autoplay, respects `prefers-reduced-motion: reduce`) showing upload → render → analysis appearing. *Stronger but more work.*

Use a real-looking plan, not Lorem Ipsum. If a non-sensitive sample plan exists in the codebase, use that.

**Constraints.**
- Image budget: ≤200 KB. Video poster + first frame: ≤800 KB. Lazy-load the video itself.
- The visual must remain useful at 320px wide. Use an art-directed mobile crop if needed.
- No stock photography. No 3D illustrations. No abstract gradients.

**Acceptance.**
- No horizontal scroll on 390×844.
- CLS for the hero does not regress.
- Image carries explicit `width` and `height` attributes and descriptive `alt` text.

---

## 3. Promote the "Pro is live today" line

**Problem.** The strongest sales sentence on the page is buried inside a paragraph in the pricing section:

> *"Pro is live today — re-run AI whenever the plan changes, generate weekly status reports, and get inline 'Explain this task' AI on any task."*

**Change.** Promote it to a callout or short heading directly above the pricing grid. Keep the copy. Style as a single line, not a banner. No emoji. No badge ornament beyond a small dot or a thin underline if needed.

**Acceptance.**
- The line renders as its own block above the three-column pricing grid.
- The visual treatment matches the calm, restrained register defined in the brand guidelines (no ribbons, no "NEW!" stickers).

---

## 4. Sharpen Free vs Pro contrast in pricing

**Problem.** The free tier reads as "almost complete" on first scan. The single-plan limit (the actual constraint that drives upgrades) is one row in a long table and is easy to miss. PMs scanning the table will conclude free is enough.

**Change.** Two small additions to the existing pricing block:

1. **A subhead under the pricing grid.**
   Copy: `Free fits one project. Pro fits your portfolio.`
   Place it directly under the table, before the CTAs. Slate 500 body text, not a marketing banner.

2. **Visually emphasize the "Plans saved" row.**
   - Free column cell: `1 plan` (bold the number)
   - Pro column cell: `Unlimited` (bold)
   - Anonymous column cell: `Auto-delete after 24 hours` (unbold, slate 500)

Do not add new copy beyond the subhead. Do not change the price.

**Acceptance.**
- The plan-count limit is the single most legible row in the pricing table.
- Subhead renders below the table on both desktop and mobile.

---

## 5. Claude credibility line

**Problem.** No on-page signal that the AI is Anthropic's Claude. PMs evaluating an "AI tool" in 2026 have learned to ask which model — being explicit borrows credibility and signals this is not a thin GPT wrapper.

**Change.** One line near the hero, or directly under the three-step "Product flow" block:

Copy: `Analysis runs on Anthropic's Claude Haiku 4.5.`

Style: slate 400 caption (`#94A3B8`), 11/18/400 per the brand type scale. No logo. No badge. No "Powered by." A factual line, set quietly.

**Acceptance.**
- The line is present on the live page.
- It does not visually compete with the headline or the CTA.

---

## 6. Stakeholder-facing landing variant

**Problem.** The viral loop assumes a stakeholder receives a share link, clicks through, likes what they see, and asks "what is this?" — then lands on the product page. The product page is pitched at PMs ("Upload an .mpp file"), which is the wrong pitch for a stakeholder. The stakeholder bounces.

**Change.** Add a stakeholder-facing entry point. Two options, pick one:

### Option A — Dedicated route `/products/plansight-ai/for-stakeholders`

A short page (one screen tall on desktop) that pitches the tool from the stakeholder's perspective. Linked from the share-page header ("What is PlanSight?") and from a small footer link on the main product page.

**Suggested structure.**

- **Headline.** `Your PM sent you a project plan you can actually read.`
- **One paragraph (2–3 sentences).** Calm explanation: this is a read-only view of a Microsoft Project plan. The PM owns the data. You did not need to install anything.
- **Three short bullets.**
  - `Read the plan in your browser. Nothing to install.`
  - `See the critical path, late tasks, and overall project health.`
  - `Ask your PM to share other plans the same way.`
- **CTA.** `Tell your PM about PlanSight` → mailto link with a pre-filled subject and a one-sentence body. The body must not be marketing copy — it must read like a forward, in the brand voice.

  Suggested mailto body:
  > `Saw a project plan shared through this — clean read-only view, AI summary on top. Worth a look if you're sharing .mpp files with stakeholders. https://aisolutionmaven.com/products/plansight-ai`

### Option B — In-page section on the existing product page

If a dedicated route is heavier than warranted, add a section near the bottom of the product page titled `Received a share link?` with the same three bullets and the same mailto CTA. Less SEO surface, faster to ship.

**Acceptance.**
- A stakeholder arriving at the page with no prior context can understand the tool in under 15 seconds.
- The "tell your PM" mailto works on mobile and on desktop mail clients.
- The link is reachable from the share-page header or footer (not only from the marketing site).

---

## 7. Rename "Anonymous" pricing column header

**Problem.** "Anonymous" as a tier header reads like a security feature, not a tier. PMs scanning the table parse it as confusing.

**Change.** Rename the column header.

- Current: `ANONYMOUS · no signup`
- New: `NO SIGNUP · try it`

Keep the subhead structure (uppercase tier + descriptive subhead) consistent with the other two columns. Do not change the underlying tier logic or the row contents.

**Acceptance.**
- The column header is replaced across all viewports.
- No references to "Anonymous" remain in the pricing component.

---

## 8. One additional guide for SEO

**Problem.** The existing guides ("Critical path explained," "How to open an .mpp file without MS Project," "How to share a project plan with a stakeholder who doesn't have MS Project") are strong SEO doorways. One more guide closes a high-intent search gap.

**Change.** Add one guide:

**Title:** `How to share a project plan as a PDF (without screenshotting it)`
**Slug:** `share-project-plan-as-pdf`

**Structure.**
- Why screenshots break: no dates, no critical-path context, stale within a week.
- Four ways to produce a PDF: native MS Project print-to-PDF, Excel-then-print, PowerPoint-then-print, PlanSight's PDF export. Rank by friction and by stakeholder readability.
- Closing: a short paragraph on what stakeholders actually look at in a project-plan PDF (RAG, milestones, what slipped), tying back to the weekly status snapshot feature.

**Constraints.**
- Length: 800–1,200 words. Match the register of the existing guides (working PM voice).
- Include one comparison table.
- Internal-link to `share-project-plan-with-stakeholder` and to the Pro pricing page.
- Schema.org `Article` metadata, matching the other guides.

**Acceptance.**
- Guide is published at `/products/plansight-ai/guides/share-project-plan-as-pdf`.
- It appears in the guides index list.
- Title and meta description are filled in. The meta description reads as a sentence, not as keyword stuffing.

---

## 9. Pre-launch readiness checks

These are not features. They are checks to run before announcing publicly. Treat as a gating checklist.

### Product flow

- [ ] End-to-end run with a fresh browser profile: upload → view → AI analysis → share link → Excel export → PDF export → Stripe Checkout → use a Pro feature → cancel → re-subscribe. Run this twice.
- [ ] Three external users (PMs ideally) run the same flow cold. Capture every hesitation point. Fix the ones that block activation; defer the rest.
- [ ] Render parser is warm. UptimeRobot pings are firing every 5 minutes. Confirm via the UptimeRobot dashboard.
- [ ] First parse from a cold start completes in under 10 seconds (the Vercel Hobby function ceiling).

### Stripe

- [ ] Live-mode keys rotated and deployed.
- [ ] Webhook signing secret verified end-to-end with a real test event.
- [ ] One real $19 charge processed and refunded on a personal card. Confirm tier flips on subscribe and reverts on cancel.
- [ ] Customer portal link works from the dashboard.
- [ ] Refund policy page is live and linked from the pricing page.

### Content

- [ ] Hero CTA renders (Task 1).
- [ ] Hero visual is in place (Task 2).
- [ ] "Pro is live today" line is promoted (Task 3).
- [ ] Pricing contrast is sharpened (Task 4).
- [ ] Claude credibility line is on the page (Task 5).
- [ ] Stakeholder entry point exists (Task 6).
- [ ] "Anonymous" column header is replaced (Task 7).
- [ ] At least one new guide is published (Task 8).
- [ ] Legal pages render: Terms, Privacy, Refunds.

### Final

- [ ] OG image renders correctly when the product page is shared on LinkedIn and on X.
- [ ] Favicon and monogram render at 16px, 32px, and 180px (per brand guidelines).
- [ ] No console errors on the product page in production.
- [ ] No "TODO" or `lorem ipsum` strings in any shipped page.

---

## What this file deliberately does not cover

- **No copy rewrites of existing strong sections.** The tagline, three-step flow, and guides list are working — leave them.
- **No new Pro features.** All eight Pro features in `specs/pro-features.md` are in scope for launch; this file does not add to that list.
- **No pricing changes.** $19/mo and $190/yr are the launch prices. Do not A/B test pricing in the first 30 days.
- **No teardown of the existing pricing component.** All changes in tasks 3, 4, and 7 are additive or label-level.

---

## Working notes for Claude Code

- Brand voice: re-read the `Voice` section of `PlanSightAIBrandGuidelines.pdf` (page 2) before writing any new copy. Compare drafts against the "Do say / Don't say" table.
- Colors and typography: use the values from the brand guidelines, not hand-picked tailwind defaults. Brand cyan is `#22D3EE`, deep slate is `#0B1220`, the wordmark muted is slate 500 (`#64748B`).
- Monospace (`Geist Mono` / `JetBrains Mono`) is for task IDs, durations, dates, and computed values only. Do not use it for body copy.
- All new buttons and links must have a visible focus state. Accessibility is not negotiable.
- If a task copy direction conflicts with the brand voice, fix the copy direction, not the voice. Flag the conflict in the PR description.
