# PlanSight AI — Changelog

Notable, user-visible or operator-visible changes to PlanSight AI,
organised by version. Newest first. Follows
[Keep a Changelog](https://keepachangelog.com/) loosely — informal enough
to stay maintainable by one operator, structured enough to skim.

When you ship a change worth remembering (new feature, breaking change,
policy shift, schema migration, infra dependency), add a bullet to the
current in-progress section.

---

## v1.2 — 2026-05-13

### Added

- **Secure share links — soft revocation + optional password protection.**
  Implements [`specs/SECURE_SHARE_LINKS_SPEC.md`](specs/SECURE_SHARE_LINKS_SPEC.md)
  with the v1.2 scope reduction (expiry / view-limit deferred).
  - **Revocation + restore** (Free + Pro) — new "Manage share" button
    on each `/my-plans` row opens a modal with a Revoke / Restore
    action. Revoked links return a generic "no longer available" page
    server-side. `share_revoked_at` is a soft flag; the underlying
    plan and tasks are untouched, and any in-flight stakeholder
    cookies are invalidated by bumping `share_password_version`.
    `POST /api/plansight/share/{revoke,restore}` (signed-in only,
    ownership enforced).
  - **Password-protected share links** (Pro only, opt-in per share) —
    in the same "Manage share" modal, Pro users can toggle on a
    password and enter it. Hashed with **scrypt via `node:crypto`**
    (no npm dep, no pgcrypto extension), stored format
    `scrypt$<salt>$<key>`. `POST /api/plansight/share/password`.
  - **Generic password prompt page** at
    `app/share/[shareId]/password/page.tsx` — no plan name, no owner,
    no metadata. Title: "Password required." Single input, single
    submit. Same render for every failure mode (wrong password,
    revoked, doesn't exist, rate-limited) — no information leakage.
  - **HMAC-signed session cookies** issued by
    `POST /api/plansight/share/verify`. Cookie path is
    `/share/<shareId>` (per-share scope), `HttpOnly`, `Secure`,
    `SameSite=Lax`, absolute 4-hour lifetime (no slide). Payload
    embeds `passwordVersion`; any password change, revoke, or restore
    bumps the version and invalidates outstanding cookies.
  - **Rate limiting + audit log** — new `share_access_attempts` table
    (`(share_id, ip_address, attempted_at desc)` index). 5 failed
    attempts per (share, IP) in 15 minutes → silent lockout (same
    generic error as a wrong password, per spec §Critical security
    requirements). Every attempt (success or failure) logged for the
    future "who accessed this share" audit-trail surface.
  - **`/my-plans` row indicators** — yellow "Share revoked" badge,
    cyan "Password" badge with lock icon.
  - **Upgrade page Pro features list** — adds "Password-protected
    share links" entry.
  - **`SHARE_COOKIE_SECRET`** new env var, documented in README +
    services.md. Minimum 32 chars; generate with `openssl rand -hex 32`.
  - Migration: `supabase/migrations/15_phase15_secure_share_links.sql`.

- **Pricing table — revoke + password rows surfaced.** The
  `/products/plansight-ai` pricing comparison now shows "Revoke share
  link" as a Free+Pro row right under "Public share link", and
  "Password-protected share links" as a Pro-only row under PRO ·
  WORKFLOW. "Export as Excel" moved up to position three (right after
  Insights engine) so the Free block reads upload → view → export →
  analyse → share rather than burying export at the bottom.

- **Sign-in → /my-plans; sign-out → /products/plansight-ai.** Sign-in
  no longer drops users back on the marketing page they came from —
  every successful sign-in lands on the My Plans dashboard, matching
  sign-up. Sign-out returns the PlanSight product home (was AISM
  root). The per-page `signinRedirectTo` prop on `PlanSightNavbar` is
  removed along with its six call sites.

### Changed

- **Service-role Supabase reads bypass Next.js Data Cache.**
  `createSupabaseServiceClient()` now overrides `global.fetch` with
  `cache: "no-store"`. `dynamic = "force-dynamic"` on the share page
  opts out of the full-route cache but does not propagate `no-store`
  to fetches inside imported helpers — symptom was the share gate
  returning pre-revoke `share_revoked_at` values even though the
  write had landed in the DB. Production-only bug; fix verified
  end-to-end (revoke, restore, password).

- **`getShareSecurityStatus` uses the service-role client.** PostgREST
  was filtering the Phase 15 columns from the anon role on the live
  Supabase project despite `notify pgrst, 'reload schema'`. Service
  role bypasses the column-visibility filter. Server-only call;
  service key never reaches the browser.

- **Refund Policy link removed from under Manage Billing on
  /my-plans.** The footer surfaces Refunds on every PlanSight page so
  the duplicate was just visual clutter. The contextual Refund Policy
  link inside the cancellation-pending banner is left in place since
  it's specifically about what cancellation does and doesn't refund.

### Deferred

- Share link expiry by date and view limit — see
  `specs/SECURE_SHARE_LINKS_SPEC.md` implementation note for rationale.

---

## v1.1 — 2026-05-12

### Added

- **Annual billing — $190/yr.** Monthly ($19) and annual ($190, ~2 months
  free) selectable on `/upgrade`. New env var `STRIPE_PRICE_ID_ANNUAL`.
  Customer Portal lets existing subscribers switch intervals with
  automatic proration. Pro badge on `/my-plans` shows `Pro · Monthly` or
  `Pro · Annual`.

- **Stripe webhook idempotency.** New `public.stripe_events` dedupe
  table. Every webhook delivery is recorded by event id before
  processing; duplicate deliveries short-circuit with 200. Foundation
  for any future non-idempotent webhook handler.

- **Dispute / chargeback auto-revoke.** `charge.dispute.created` now
  flips the tier to free, cancels the subscription, and emails the
  operator via Resend. `charge.dispute.closed` (won or lost) sends a
  follow-up email. Policy: revoke on creation rather than waiting for
  lost outcome — keeps Pro features from being consumed during the
  dispute window and improves the fraud signal to Stripe.

- **URL-parameter promo codes.** `/upgrade?promo=LAUNCH50` looks up the
  promotion code server-side, shows a green confirmation banner with
  the human-readable discount description (e.g. "50% off for 6 months"),
  and pre-applies it at Stripe Checkout. Invalid or expired codes show
  a yellow banner and let the user check out at full price. No code
  changes needed to launch a campaign — create the Coupon + Promotion
  Code in the Stripe Dashboard and share the URL.

- **Public legal pages — `/products/plansight-ai/legal/{terms,privacy,refunds}`.** Terms of
  Service, Privacy Policy, and Refund Policy now render server-side from
  `content/plansight-legal/*.md` via a thin reader (`lib/legal/`) and dynamic
  route (`app/products/plansight-ai/legal/[slug]/page.tsx`), mirroring the existing guides
  pipeline. Indexed by `app/sitemap.ts` at low priority / yearly cadence.
  Doc content includes contradiction fixes against shipped state:
  GA4 disclosed in privacy cookies + sub-processor list, Resend added
  to sub-processor list, refund cancellation steps reference "My Plans
  → Manage billing" (the real path, not "Settings → Billing"), and
  `services.md` now references the 14-day money-back guarantee. Stale
  copies under `docs/plansight-ai/legal/` were removed; the directory
  now contains a `README.md` pointer so future edits land on the right
  files.

- **In-product AI disclaimers.** Implements
  [`specs/IN_PRODUCT_DISCLAIMERS_SPEC.md`](specs/IN_PRODUCT_DISCLAIMERS_SPEC.md)
  for the two PM-facing AI surfaces:
  - **AI Analysis tab** — info-styled banner at the top with the
    three-sentence spec wording. Dismissible per session via
    `sessionStorage` (`plansight:disclaimer:ai-analysis:dismissed`),
    reappears next session. "What is this?" trigger next to the
    "Generated by Claude" heading opens an explanation modal.
  - **Explain-this-Task modal** — compact, non-dismissible one-line
    variant: *"Generated by AI. Cross-check before acting on it."*
    Renders above the AI explanation text inside the existing modal.
  - **Insights tab** — muted, non-dismissible data-quality note above
    the grid. Deliberately not AI-disclaimer language (Insights are
    deterministic CPM math); frames the limit as input data quality.
  - **Regenerate button** updated tooltip and Pro-gate copy to the
    exact spec wording.
  - **Share view scope** — disclaimers do not render on the share
    view because it does not render the AI/insights panels.
    Documented in the spec as a deviation.
  - New components in `components/plansight-ai/disclaimers/`:
    `AiAnalysisDisclaimer`, `InsightsDataQualityNote`,
    `AiAnalysisAbout`. Three components total (link + modal bundled
    into one self-contained file).

- **Legal pages moved under the PlanSight product surface.** URLs
  changed from `/legal/{terms,privacy,refunds}` to
  `/products/plansight-ai/legal/{terms,privacy,refunds}`. Content
  moved from `content/legal/` to `content/plansight-legal/` to match
  the `content/plansight-guides/` naming convention. Reasoning: the
  legal docs are PlanSight-specific in body content, so scoping the
  URL under the product reflects that and leaves room for future
  product-specific legal docs at `/products/<slug>/legal/*`. The
  pages now render with `PlanSightNavbar` + `PlanSightFooter` chrome.
  A permanent 301 redirect from `/legal/:slug` to the new path is
  configured in `next.config.mjs` to preserve any pre-existing
  bookmarks, prior Stripe Dashboard configs, or email-template links.
  All footer/consent-line references across the codebase were updated
  in the same change.

- **Legal-page secondary surfaces (7–11).** Five additional placements:
  - `/my-plans` Manage-billing area gains a "Refund policy" link under
    the Manage billing button, and the cancellation-pending banner now
    references the Refund Policy directly ("see our Refund Policy for
    what cancellation does and doesn't refund").
  - Contact form (`components/ContactForm.tsx`) adds *"We handle messages
    per our **Privacy Policy**."* below the submit button.
  - Feedback form (`components/FeedbackForm.tsx`) adds the same line.
  - Error pages: `app/error.tsx` and `app/global-error.tsx` get an
    inline Terms · Privacy · Refunds strip beneath the action button.
    `app/not-found.tsx` already inherited the strip via the updated
    `<Footer />`. global-error uses plain `<a>` anchors (no `next/link`)
    since the root layout is gone in that boundary.
  - **Email receipts** are pure Stripe / Supabase Dashboard config —
    no in-code path emits customer-facing email. Documented in
    `docs/plansight-ai/services.md` under "Out-of-repo configuration":
    add a `View our Terms and Refund Policy at /legal` footer line to
    Stripe customer-email templates and the Supabase Auth signup +
    password-reset templates.

- **Legal-page surface wiring (1–6).** Six placements now link the legal
  documents:
  - Marketing site footer (`components/Footer.tsx`) — Terms · Privacy ·
    Refunds in a new small bottom strip with copyright.
  - PlanSight product footer (`components/plansight-ai/PlanSightFooter.tsx`)
    — same trio in a matching bottom strip.
  - Stakeholder share-view footer (`ShareViewFooterCta.tsx`) — Privacy
    link beside the share id (APP 5 notice-at-collection for the people
    we collect IP/telemetry from but never asked to register).
  - Signup form (`components/auth/SignUpForm.tsx`) — inline "By creating
    an account you agree to **Terms** and **Privacy Policy**" line below
    the submit button.
  - Anonymous upload CTA (`components/plansight-ai/PlanSightProductShell.tsx`)
    — inline consent line under the upload form description.
  - Upgrade form (`app/products/plansight-ai/upgrade/page.tsx`) — an
    **active consent checkbox** appears above the submit button:
    *"I agree to the **Terms**, **Refund Policy**, and **Privacy
    Policy**."* HTML5 `required` blocks submission until ticked.
    Defence-in-depth check in the checkout route rejects scripted
    bypass with a 400. Stronger contract formation posture than the
    earlier passive "By subscribing..." paragraph.

- **Operator alert helper.** New `lib/billing/operator-alert.ts` —
  generic Resend-backed operator email, used by the dispute handlers.
  Mirrors the pattern in `lib/plansight-ai/ai-usage/spend-alert.ts`.

### Changed

- `getStripePriceId()` now takes a `BillingInterval` argument instead of
  reading a single env var. Backwards-compatible default at the form-
  parse layer — missing `interval` falls through to monthly.

- `user_billing` table gains a `billing_interval` column (`month` /
  `year` / null). Populated by the webhook on subscription events.
  Existing rows stay null until their next billing event fires.

- `/api/billing/checkout` now accepts `interval=month|year` and
  optionally `promo=<code>` from the form body. Validates promo
  server-side and redirects back to `/upgrade?promo_error=invalid` on
  miss rather than silently charging full price.

### Operator setup (Stripe Dashboard / Vercel env, manual)

When deploying v1.1 to a new environment:

1. Create the annual Price ($190 USD / year) on the existing PlanSight
   Pro product in Stripe. Copy `price_…` → `STRIPE_PRICE_ID_ANNUAL` in
   Vercel.
2. Customer Portal → enable "Customers can switch plans" and list both
   prices.
3. Webhooks → subscribe the endpoint to `charge.dispute.created` and
   `charge.dispute.closed` in addition to the existing four events.
4. Run migration `supabase/migrations/14_phase14_stripe_dedupe_and_interval.sql`.
5. For campaigns: create a Coupon (e.g. `percent_off: 50`,
   `duration: repeating`, `duration_in_months: 6`, `redeem_by: <date>`)
   and a Promotion Code wrapping it. Share the URL
   `/products/plansight-ai/upgrade?promo=<CODE>`.

---

## v1.0 — initial release

Baseline shipped state captured in
[PRODUCT.md](PRODUCT.md). Stripe billing at $19/mo, Supabase auth,
Render parser, Anthropic Claude Haiku 4.5 for AI analysis.
