# Stripe Setup — PlanSight AI

This is the **complete, step-by-step manual** for configuring Stripe to
support PlanSight AI. It's intentionally over-detailed because setting
up Live mode wrong is hard to recover from — refunds, customer
confusion, broken receipts, missing GST invoices.

> **Read this top-to-bottom on first setup.** Every section says where to
> click in the Dashboard, what to enter exactly, why it matters, and
> which env var (if any) it produces.

> **Test mode and Live mode are entirely separate Stripe environments.**
> No settings, products, prices, webhook secrets, coupons, customers, or
> subscriptions sync between them. Everything in this doc must be done
> twice — once in Test, once in Live. The toggle is at the top-left of
> the Stripe Dashboard ("Test mode" switch).

---

## Table of contents

1. [What this produces](#what-this-produces)
2. [Account prerequisites](#1-account-prerequisites)
3. [API keys → env vars](#2-api-keys--env-vars)
4. [Product and Prices (monthly + annual)](#3-product-and-prices-monthly--annual)
5. [Webhook endpoint](#4-webhook-endpoint)
6. [Customer Portal](#5-customer-portal)
7. [Checkout settings (Terms / Privacy URLs)](#6-checkout-settings-terms--privacy-urls)
8. [Customer email settings](#7-customer-email-settings)
9. [Branding and public business info](#8-branding-and-public-business-info)
10. [Australian GST handling](#9-australian-gst-handling)
11. [Promotion Codes (per-campaign)](#10-promotion-codes-per-campaign)
12. [End-to-end test verification](#11-end-to-end-test-verification)
13. [Going Live — migration checklist](#12-going-live--migration-checklist)
14. [Common gotchas and recovery](#13-common-gotchas-and-recovery)

---

## What this produces

After completing sections 1–10 in **both** Test and Live mode, you'll
have the following Vercel environment variables, **set separately per
environment** (Vercel "Preview" should point at Stripe Test values;
"Production" should point at Stripe Live values):

| Env var | Source | Test format | Live format |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | §2 — Developers → API keys → Secret key | `sk_test_...` | `sk_live_...` |
| `STRIPE_PRICE_ID` | §3 — Products → PlanSight Pro → monthly price ID | `price_...` | `price_...` |
| `STRIPE_PRICE_ID_ANNUAL` | §3 — Products → PlanSight Pro → annual price ID | `price_...` | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | §4 — Developers → Webhooks → endpoint → Signing secret | `whsec_...` | `whsec_...` |

**Critical rule:** never put a `sk_live_*` key into the same environment
as a `price_test_*` id, or vice versa. The #1 production billing bug is
"test-mode price id leaked into live env" — Stripe will reject the
checkout with a misleading error.

---

## 1. Account prerequisites

Before any of the steps below, your Stripe account needs to be ready to
accept money.

### 1.1 If you haven't created the Stripe account yet

1. Go to https://dashboard.stripe.com/register.
2. Enter your business email and password.
3. Choose **Australia** as the country (this drives default currency,
   tax handling, payout schedule).
4. Confirm your email when Stripe sends the verification link.

### 1.2 Activate the account (required for Live mode)

Test mode works without activation. **Live mode does not.** You can't
take real payments until the account is activated.

1. **Dashboard** → **top-left mode toggle: switch to Live mode**.
2. A banner appears at the top: *"Activate your account"* or
   *"Verify your business"*. Click it.
3. Complete the activation form. Stripe will ask for:
   - **Business type:** sole trader, company, etc. (For AI Solution
     Maven as a one-person operation: usually "Individual / sole
     trader". Check with your accountant if unsure.)
   - **Business legal name:** the legal name you trade under (this is
     what appears on receipts and tax invoices).
   - **ABN** (if you have one — recommended for GST).
   - **Business address** (your registered Queensland address).
   - **Industry:** "Software" → "Software as a Service (SaaS)".
   - **Product description:** one line, e.g. *"PlanSight AI — project
     plan visualisation and analysis SaaS subscription."*
   - **Bank account:** the account where payouts go (BSB + account
     number for AU bank).
   - **Personal verification:** ID document scan (driver licence /
     passport), required by AUSTRAC for AML compliance.
4. Submit and wait for Stripe to verify (usually < 24h, sometimes
   instant).

Until the account is activated, **do not configure live-mode webhook
secrets, prices, or any of the sections below in live mode** — they may
need to be re-done after activation.

---

## 2. API keys → env vars

### 2.1 Find your keys

**Dashboard** → **Developers** (left sidebar) → **API keys**.

You will see two keys per mode:

- **Publishable key** (`pk_test_...` or `pk_live_...`) — not used by
  PlanSight (we don't load Stripe.js on the client). Ignore.
- **Secret key** (`sk_test_...` or `sk_live_...`) — **this is the one
  PlanSight needs.**

> Stripe shows the secret key only once on creation. If you already
> created one and lost the value, click **Roll key** and you'll get a
> new one (old one stops working immediately).

### 2.2 Set in Vercel

1. **Vercel Dashboard** → your project → **Settings** → **Environment
   Variables**.
2. Add `STRIPE_SECRET_KEY`:
   - **Test value** (sk_test_...): set for **Preview** and
     **Development** environments.
   - **Live value** (sk_live_...): set for **Production** environment
     only.
3. Save.

> **Never** commit either key to git. Never paste a live key into
> Slack, chat, or screenshots. If a live key leaks, immediately
> **Roll key** in the Stripe Dashboard and update Vercel.

### 2.3 (Optional) Restricted keys for ops

For production scripts and admin tools, prefer creating a **Restricted
key** with only the permissions you need, instead of using the
full-access secret key. Not needed for the PlanSight app itself.

---

## 3. Product and Prices (monthly + annual)

### 3.1 Create the Product

**Dashboard** → **Product catalogue** → **+ Add product**.

Fill in:

- **Name:** `PlanSight AI Pro`
- **Description:** *"PlanSight AI Pro subscription. Unlimited saved
  plans, AI analysis regeneration, Explain-this-Task, weekly status
  reports, PDF export, higher upload limits."*
  (This appears on Stripe Checkout and on receipts.)
- **Image** (optional): upload the PlanSight monogram from
  `public/products/plansight-ai/brand/plansight-monogram-dark.svg`
  (export as PNG if Stripe rejects SVG).
- **Statement descriptor:** `PLANSIGHT AI` (max 22 chars, this is what
  shows on the customer's bank/card statement).
- **Statement descriptor (shortened, mobile):** `PLANSIGHT` (max 10
  chars).
- **Tax behavior:** **Inclusive** of tax (matches `legal/refunds.md`
  *"Fees are inclusive of GST where applicable"*).
- **Tax code:** **SaaS** (`txcd_10000000`) — Stripe's standardised code
  for SaaS subscriptions. Used by Stripe Tax if you ever enable it.

**Click "Add product"** before adding prices (some Stripe layouts let
you add the first price inline; if so, that's the monthly price below).

### 3.2 Add the Monthly price

In the new product page, click **+ Add another price** (or set the
first price if Stripe presents an inline form):

- **Pricing model:** **Standard pricing** (flat fee per period).
- **Price:** `19.00`
- **Currency:** **AUD** (Australian Dollar) ← **decide carefully**.
  > **Currency note:** `legal/terms.md` §7.1 says *"All fees are in
  > Australian Dollars (AUD) unless otherwise specified"*. The original
  > marketing copy referenced "$19 USD". Choose AUD to match the
  > legal documents (recommended — you're an AU business, GST applies,
  > your bank account is AUD). If you choose USD, you must update
  > `content/plansight-legal/terms.md` to say USD before launch.
- **Billing period:** **Monthly** (`every 1 month`).
- **Description / nickname (internal):** `Monthly $19 AUD` (helps you
  find it in the Dashboard later; not shown to customers).
- **Tax behavior:** **Inclusive of tax** (inherits from product).

**Click "Add price"**. Stripe creates a price ID like `price_1Q...`.

**Copy this `price_...` value.** This becomes `STRIPE_PRICE_ID` in
Vercel.

### 3.3 Add the Annual price

On the same product page, click **+ Add another price**:

- **Pricing model:** **Standard pricing**.
- **Price:** `190.00`
- **Currency:** **AUD** (must match monthly — Stripe Portal switching
  requires same-currency prices on the same product).
- **Billing period:** **Yearly** (`every 1 year`).
- **Description / nickname:** `Annual $190 AUD (≈2 months free)`.
- **Tax behavior:** **Inclusive of tax**.

**Click "Add price"**.

**Copy this `price_...` value.** This becomes `STRIPE_PRICE_ID_ANNUAL`
in Vercel.

### 3.4 Set both env vars in Vercel

| Env var | Vercel scope |
|---|---|
| `STRIPE_PRICE_ID` (monthly test) | Preview, Development |
| `STRIPE_PRICE_ID` (monthly live) | Production |
| `STRIPE_PRICE_ID_ANNUAL` (annual test) | Preview, Development |
| `STRIPE_PRICE_ID_ANNUAL` (annual live) | Production |

### 3.5 Verify

Both prices should appear on the product page under **Pricing**, both
showing **Active**, both with **Inclusive** tax behaviour. The yearly
price should show a per-month equivalent of ~$15.83/mo.

> **Pitfall:** if you accidentally created a one-time price instead of
> recurring, the checkout will fail with *"price not recurring"*.
> Recurring prices show a clock icon and the billing period; one-time
> prices don't.

---

## 4. Webhook endpoint

PlanSight relies on webhooks for the entire post-payment flow —
flipping `product_activations.tier` to Pro, recording cancellation,
auto-revoking on disputes.

### 4.1 Create the endpoint

**Dashboard** → **Developers** → **Webhooks** → **+ Add an endpoint**.

Fill in:

- **Endpoint URL:**
  - **Test mode:** during local development you can use the Stripe CLI
    instead (see §11.1). For a deployed Preview env that you want to
    push webhooks to, use the preview URL, e.g.
    `https://<preview-branch>-aism.vercel.app/api/billing/webhook`. For
    the persistent Test endpoint, use:
    `https://aisolutionmaven.com/api/billing/webhook` (Test secrets fire
    here too if the env on production points at Test mode — but in
    practice you'll set Production to Live, so use a Preview URL or the
    CLI).
  - **Live mode:** `https://aisolutionmaven.com/api/billing/webhook`
- **Description:** `PlanSight production webhook` (or `Test webhook`).
- **Events to send:** click **Select events** and tick exactly these
  six (use the search box):

  | Event | Why |
  |---|---|
  | `checkout.session.completed` | Initial subscription flips tier to Pro |
  | `customer.subscription.created` | Backup path if Checkout webhook is missed |
  | `customer.subscription.updated` | Renewals, status changes (past_due, cancel_at_period_end), interval switches |
  | `customer.subscription.deleted` | End-of-period cancellation flips tier to Free |
  | `charge.dispute.created` | Auto-revoke Pro + cancel subscription + email operator |
  | `charge.dispute.closed` | Email operator with won/lost outcome |

  Do **not** subscribe to "all events" — it bills you for webhook
  invocations on event types your handler doesn't care about, and
  raises the surface for unhandled errors.

- **API version:** **Latest** (Stripe will offer a specific version
  string — choose the latest available).

Click **Add endpoint**.

### 4.2 Copy the signing secret

After creation, the endpoint detail page shows **Signing secret** — a
value starting with `whsec_...`. Click **Reveal** then copy the value.

> Each endpoint has its **own** signing secret. The Test and Live
> endpoints will have different secrets — they are not interchangeable.
> Setting the wrong one causes every webhook to fail signature
> verification and 400 out.

Set in Vercel:

| Env var | Source | Vercel scope |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` (test) | Test webhook signing secret | Preview, Development |
| `STRIPE_WEBHOOK_SECRET` (live) | Live webhook signing secret | Production |

### 4.3 Verify after the next deploy

1. Re-deploy your project so the env vars apply.
2. **Stripe Dashboard** → **Developers** → **Webhooks** → click your
   endpoint → **Send test webhook** → choose
   `customer.subscription.updated` → **Send**.
3. The endpoint's recent deliveries list should show **200 OK** within
   a few seconds.
4. If you see **400 Webhook signature verification failed**, the secret
   in Vercel doesn't match — re-copy from the endpoint detail page,
   update Vercel, redeploy.

---

## 5. Customer Portal

The Customer Portal is the Stripe-hosted page customers land on when
they click **Manage billing** in `/my-plans`. It handles cancellation,
plan switching (monthly ↔ annual), and card updates.

### 5.1 Open the Portal settings

**Dashboard** → **Settings** → search "Customer portal" → click
**Billing → Customer portal**.

You'll see a multi-tab page. Configure each tab as follows.

### 5.2 Features → Subscriptions

- ✅ **Customers can cancel subscriptions** — *required* by
  `/products/plansight-ai/legal/refunds` (the "cancel anytime" promise).
  - **Mode:** *At end of billing period* (matches refunds.md §1: *"you
    keep Pro access until the end of your current billing period"*).
  - ❌ Do **not** enable "Immediate cancellation" as the default — it
    contradicts the refund policy.

- ✅ **Customers can switch plans**
  - Click **Add product** → select **PlanSight AI Pro** →
    **tick both prices** ($19/mo AUD AND $190/yr AUD). Without ticking
    both, the **Update plan** button won't appear in the Portal.
  - **Proration behaviour:** *Create prorations* (Stripe default). This
    credits unused time on the old interval against the new one.

### 5.3 Features → Payment methods

- ✅ **Customers can update payment method** — useful for expired cards.
- Default payment method types: leave as Stripe's defaults (card +
  whatever's enabled in your account).

### 5.4 Features → Invoice history

- ✅ **Customers can view invoice history** — gives them self-service
  access to receipts, reduces support load.

### 5.5 Business information

This is where the legal links get wired across every Portal page **and**
every cancellation confirmation email Stripe sends.

- **Headline / business name:** `PlanSight AI`
- **Privacy policy URL:** `https://aisolutionmaven.com/products/plansight-ai/legal/privacy`
- **Terms of service URL:** `https://aisolutionmaven.com/products/plansight-ai/legal/terms`

There is **no separate** "Refund policy URL" field — but if you want
to call it out, add it to the headline area or use the **Headline**
text to mention it.

### 5.6 Save

Click **Save** at the top of the page. The Portal updates immediately —
no deploy required.

### 5.7 Verify

In Test mode, as a subscribed user, click **Manage billing** on
`/my-plans`. You should see:

- An **Update plan** button alongside **Cancel subscription**.
- Clicking Update plan shows both Monthly and Annual as options.
- The footer of the Portal page shows **Privacy policy** and **Terms
  of service** as clickable links.

Repeat all of §5 in Live mode.

---

## 6. Checkout settings (Terms / Privacy URLs)

These appear on every Stripe Checkout page (the page customers land on
after clicking "Upgrade to Pro").

### 6.1 Open Checkout settings

**Dashboard** → **Settings** → search "Checkout" → **Payments → Checkout
and Payment Links** (the exact label varies by account vintage; if you
don't see it, search for "Checkout settings").

### 6.2 Consent collection / Legal links

Find the section labelled **Consent collection** or **Terms of service
and privacy policy** or **Compliance**.

- **Terms of service URL:** `https://aisolutionmaven.com/products/plansight-ai/legal/terms`
- **Privacy policy URL:** `https://aisolutionmaven.com/products/plansight-ai/legal/privacy`

This makes Stripe render *"Terms of service · Privacy policy"* as a
footer link on every Checkout page automatically.

### 6.3 (Optional) Promo codes

- ✅ Toggle **Allow promotion codes in Checkout** — this controls the
  default. PlanSight's checkout route opts in per-session (`allow_promotion_codes: true`)
  when no promo is pre-applied via URL, so the global setting matters
  less. Leaving it on is fine and harmless.

### 6.4 Save

---

## 7. Customer email settings

These are the emails Stripe sends *to your customers* on your behalf.

### 7.1 Open Customer emails

**Dashboard** → **Settings** → search "Customer emails" → **Subscriptions
and emails → Customer emails** (path varies — search by keyword).

### 7.2 Toggles

Enable these:

- ✅ **Successful payments** — sends receipts on each charge.
- ✅ **Refunds** — sends refund confirmations.
- ✅ **Failed payment notifications** — dunning emails when a card
  fails (helpful for the customer to fix before downgrade).

> There is **no "Cancellation" toggle** in this section. Cancellation
> confirmation emails are sent automatically by the Customer Portal
> when a customer cancels via the Portal (configured in §5). No extra
> setting needed.

### 7.3 Email footer (if your account shows the field)

Some Stripe accounts have a free-text **Footer** field on this same
page. If you see it, paste:

```
View our Terms, Privacy Policy, and Refund Policy:
https://aisolutionmaven.com/products/plansight-ai/legal/terms
https://aisolutionmaven.com/products/plansight-ai/legal/privacy
https://aisolutionmaven.com/products/plansight-ai/legal/refunds
```

If the field isn't there, the Terms / Privacy URLs from §6 already
render in the receipts on most accounts.

### 7.4 Save

---

## 8. Branding and public business info

Drives the appearance of Stripe Checkout, Customer Portal, receipts,
and invoices.

### 8.1 Branding

**Dashboard** → **Settings** → search "Branding" → **Business → Branding**.

- **Icon:** upload the PlanSight monogram (PNG, 128×128 or larger).
- **Logo:** upload the PlanSight wordmark (PNG, transparent background).
  Used in receipts and invoices.
- **Brand colour:** `#0E7490` (cyan-700 — matches PlanSight's primary
  CTA colour in the app).
- **Accent colour:** `#0F172A` (slate-900 — matches the dark navy
  used in PlanSight hero sections).

### 8.2 Public business information

**Dashboard** → **Settings** → search "Public details" → **Business →
Public business information** (or similar — labels vary).

- **Statement descriptor:** `PLANSIGHT AI` (already set on the product
  in §3.1, but should also be set at the account level as the default).
- **Shortened descriptor:** `PLANSIGHT`
- **Public business name:** `AI Solution Maven`
- **Public email:** `billing@aisolutionmaven.com`
- **Support email:** `billing@aisolutionmaven.com`
- **Support phone:** *(optional — leave blank if you don't want
  customers calling)*
- **Support URL:** `https://aisolutionmaven.com/contact`
- **Business address:** your registered Queensland address (appears on
  invoices/receipts — required for GST tax invoices in AU).
- **Country:** Australia.
- **Locale:** English (Australia).

### 8.3 Save

---

## 9. Australian GST handling

AI Solution Maven is an Australian business. If your turnover crosses
the GST threshold (currently AUD $75,000/yr) you must register for GST,
charge GST on AU sales, and issue tax invoices.

### 9.1 Below the threshold (default for early stage)

If you are **not** registered for GST:

- Leave **Stripe Tax** off (Dashboard → Settings → Tax → Stripe Tax is
  not enabled).
- Prices are GST-inclusive by default in `terms.md` (we set tax
  behaviour to **Inclusive** in §3.1 and §3.2).
- Stripe will issue receipts but not "Tax invoices" with a GST line.
- The receipt total simply matches the price paid.

You don't need to do anything else here at this stage.

### 9.2 After you register for GST

When you cross the threshold or voluntarily register:

1. **Stripe Dashboard** → **Settings** → **Tax** → enable **Stripe Tax**
   (this is a **paid** feature — $0.50 per transaction or 0.5% of
   transaction value, whichever is greater).
2. Add your **ABN** under **Tax settings**.
3. Add a **Tax registration** for Australia, type **GST**.
4. Stripe will start adding a "GST 10%" line to each invoice.
5. Set product **Tax code** to `txcd_10000000` (SaaS) — already done
   in §3.1.

Alternative (bootstrap-friendly, avoids the Stripe Tax fee): keep prices
GST-inclusive, manually issue tax invoices via your accounting software
on a monthly basis. Talk to your accountant about which is preferable
for your volume.

> **Don't enable Stripe Tax in Live mode without being GST-registered
> first.** Charging GST without an ABN is a compliance issue.

---

## 10. Promotion Codes (per-campaign)

For URL-based promo codes like
`/products/plansight-ai/upgrade?promo=LAUNCH50`. This section is run
**per campaign**, not at initial setup. Lives entirely in the Stripe
Dashboard — zero code changes per campaign.

### 10.1 Create the underlying Coupon

**Dashboard** → **Product catalogue** → **Coupons** → **+ New coupon**.

Example — *"50% off for 6 months, expires Aug 31"*:

- **Type:** **Percentage discount**.
- **Percent off:** `50`.
- **Duration:** **Repeating** (i.e. discount applies for N months
  after first redemption).
- **Number of months:** `6`.
- **Redemption limits:**
  - ☑ **Limit the date range when customers can redeem this coupon** →
    set end date to `2026-08-31 23:59 UTC` (Stripe enforces this — no
    code check needed).
  - ☑ **Limit the number of times this coupon can be redeemed** (optional)
    → e.g. `100`.
- **Apply to specific products:** if you want the offer to apply to
  monthly only, tick the monthly price under PlanSight AI Pro. To
  apply to both, leave unrestricted.
- **Coupon ID:** auto-generated (`promo_xxx` internally — not the
  customer-facing code).

**Click "Create coupon"**.

### 10.2 Create the Promotion Code (the customer-facing string)

**Dashboard** → **Product catalogue** → **Promotion codes** →
**+ New promotion code**.

- **Coupon:** select the coupon you just created.
- **Code:** type the customer-facing string, e.g. `LAUNCH50`.
  - Letters, numbers, hyphens. Case-insensitive when redeemed.
  - Must be globally unique among your active promotion codes.
- **Restrictions** (optional but useful):
  - ☑ **First-time order only** — if you want only first-ever Pro
    subscriptions to qualify.
  - **Expiry date** — can be tighter than the underlying coupon's
    redeem_by.
  - **Max redemptions** — can be tighter than the coupon's cap.
  - **Minimum order amount** — not useful for a single-price product.
  - **Eligible customer** — leave blank to allow anyone; specify a
    customer ID for personal codes.
- **Click "Create"**.

### 10.3 Share

Send to customers as:

```
https://aisolutionmaven.com/products/plansight-ai/upgrade?promo=LAUNCH50
```

PlanSight's upgrade page validates the code server-side, shows the
discount in a green banner, and pre-applies it at Checkout. Invalid /
expired codes show a yellow banner and the user can still pay full
price.

### 10.4 Track redemptions

- **Dashboard** → **Promotion codes** → click your code → see
  **Times redeemed**.
- For attribution by campaign, the checkout route stamps
  `metadata.promotion_code` on the subscription — query subscriptions
  by that metadata field in your reporting.

### 10.5 Test mode vs Live mode

Promotion codes are per-mode like everything else. **Test mode codes
do not work in Live mode and vice versa.** Create the same code in
both, or use different codes per environment for clarity (e.g.
`LAUNCH50TEST` vs `LAUNCH50`).

---

## 11. End-to-end test verification

Run this entire checklist in Test mode **before** going Live.

### 11.1 Local webhook setup (Stripe CLI)

For local dev, forward webhooks via the Stripe CLI:

```bash
# Install once (macOS):
brew install stripe/stripe-cli/stripe

# Authenticate:
stripe login

# Forward webhooks to your local Next.js:
stripe listen --forward-to localhost:3000/api/billing/webhook
```

The CLI prints a `whsec_...` value when it starts. Use **this** as
`STRIPE_WEBHOOK_SECRET` in `.env.local`, **not** the Dashboard test
webhook secret — the CLI's secret is different from the deployed
endpoint's secret.

### 11.2 The 12-step verification gauntlet

Run all of these in Test mode. They cover the major v1.1 surfaces:

| # | Action | Expected result |
|---|---|---|
| 1 | Visit `/upgrade` (logged out) | Sign-up CTAs visible, no Stripe call. |
| 2 | Sign up a new user, return to `/upgrade` | Monthly + Annual radio cards visible. Stripe Checkout button enabled. |
| 3 | Choose **Monthly**, pay with `4242 4242 4242 4242` | Redirected to `/my-plans?checkout=success`. Pro badge shows `Pro · Monthly`. |
| 4 | Stripe Dashboard → Customers → find the new customer | Subscription is `active`, on the monthly price. |
| 5 | Click **Manage billing** → **Update plan** → switch to Annual | Stripe shows proration credit. Confirm. Back in PlanSight, badge updates to `Pro · Annual` after page refresh. |
| 6 | In the Customer Portal, click **Cancel subscription** | Cancellation scheduled. PlanSight shows the yellow "Cancellation scheduled" banner with the period-end date and the Refund Policy link. |
| 7 | Stripe Dashboard → cancel the subscription immediately (not end-of-period) | Webhook fires `customer.subscription.deleted`. Tier flips to Free. |
| 8 | Visit `/upgrade?promo=TESTCODE50` (a valid coupon you made for this test) | Green banner shows the discount description. Hidden input on the form. |
| 9 | Complete checkout with the promo applied | Stripe Checkout shows the discounted price. Subscription metadata includes `promotion_code: TESTCODE50`. |
| 10 | Visit `/upgrade?promo=DEFINITELYNOTREAL` | Yellow banner, full-price checkout still works. |
| 11 | Stripe CLI: `stripe trigger charge.dispute.created` | Tier flips to Free, subscription cancels, operator email arrives via Resend. |
| 12 | Stripe CLI: trigger the same webhook event id twice | Second delivery returns `{ received: true, deduped: true }`. No double-toggle. |

If any step fails, **do not go Live until fixed.**

---

## 12. Going Live — migration checklist

When ready to flip to Live mode for the first time, work through this
in order. Don't skip steps.

### 12.1 Pre-flight

- [ ] Stripe account is **activated** (§1.2 — Live mode no longer
  shows the activation banner).
- [ ] All of §11 passed in Test mode end-to-end, including 3DS test
  card (`4000 0025 0000 3155`).
- [ ] `content/plansight-legal/terms.md` currency matches the Stripe Price
  currency you'll use in Live (AUD recommended — see §3.2 warning).
- [ ] Your Vercel **Production** environment has separate env vars
  from Preview / Development (they don't share by accident).
- [ ] You have $19 (or $190) of real money you can actually spend on
  yourself to run the live smoke test.

### 12.2 In Stripe Dashboard (Live mode)

Switch to **Live mode** (top-left toggle). Then:

- [ ] §2 — API keys: copy the `sk_live_...` secret key.
- [ ] §3 — recreate **PlanSight AI Pro** product + both prices
  (monthly $19 AUD, annual $190 AUD). Note the live `price_...` ids —
  they will be different from test.
- [ ] §4 — webhook endpoint at
  `https://aisolutionmaven.com/api/billing/webhook` with the same six
  events. Copy the live `whsec_...` signing secret.
- [ ] §5 — Customer Portal: all toggles + both prices + Terms/Privacy
  URLs.
- [ ] §6 — Checkout settings: Terms/Privacy URLs.
- [ ] §7 — Customer emails: receipts + refunds + dunning enabled,
  footer text.
- [ ] §8 — Branding: logo, colours, public business info.
- [ ] §9 — GST: configure based on registration status.

### 12.3 In Vercel (Production environment only)

- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_PRICE_ID` = live monthly price id
- [ ] `STRIPE_PRICE_ID_ANNUAL` = live annual price id
- [ ] `STRIPE_WEBHOOK_SECRET` = live webhook signing secret
- [ ] `NEXT_PUBLIC_APP_URL` = `https://aisolutionmaven.com` (not
  `localhost` or a preview URL — Checkout redirects to this on success)
- [ ] **Re-deploy** Production so the new env vars take effect.

### 12.4 The live smoke test (one real charge + refund)

1. Sign up a fresh account on the live site (use your own real email).
2. Visit `/upgrade`. Pay with a real card. Confirm the charge succeeds
   and you receive a real Stripe receipt by email.
3. Confirm tier flipped to Pro in Supabase
   (`select * from product_activations where user_id = '<your uuid>';`).
4. Confirm webhook delivery in Stripe Dashboard → Developers →
   Webhooks → your endpoint → recent deliveries: `checkout.session.completed`
   shows `200 OK` within seconds.
5. Test Pro features briefly (regenerate AI analysis, weekly report,
   PDF export — confirm they unlock).
6. Open Customer Portal → confirm Terms / Privacy footer links work.
7. **Refund and cancel** the subscription from Stripe Dashboard
   (Customers → your test customer → Refund + Cancel). Confirm:
   - Refund email arrives.
   - Cancellation confirmation arrives.
   - Tier flips to Free in Supabase.
8. Real money refunded. Live setup verified.

### 12.5 Ongoing monitoring

- Weekly: glance at Stripe Dashboard → Webhooks → endpoint deliveries.
  Any pattern of 3+ failures on the same event id means trouble.
- Monthly: reconcile `user_billing.subscription_status='active'` rows
  in Supabase against `subscription.status='active'` count in Stripe.
  Drift indicates a missed webhook.
- Per dispute: a `charge.dispute.created` webhook auto-revokes Pro
  and emails the operator (you). Review the dispute in Stripe Dashboard
  → Disputes within 7 days of receipt — Stripe lets the chargeback
  succeed by default if you don't respond.

---

## 13. Common gotchas and recovery

### 13.1 "Test price id in production env"

**Symptom:** customer clicks Upgrade, sees a Stripe error like *"No
such price: price_..."* or *"Price is in a different mode than the
API key being used"*.

**Cause:** `STRIPE_PRICE_ID` in Vercel Production points at a test
price id; `STRIPE_SECRET_KEY` is the live key.

**Fix:** open Stripe Dashboard in Live mode, copy the live price ids,
update Vercel Production env, redeploy. Tip: live and test
`price_...` strings often look similar — visually inspect the first
few characters or compare against a known live id.

### 13.2 "Webhook signature verification failed"

**Symptom:** every webhook delivery in the Dashboard returns 400.

**Cause:** wrong `STRIPE_WEBHOOK_SECRET` for the current mode. Each
endpoint has its own secret, and test/live secrets differ.

**Fix:** Dashboard → Developers → Webhooks → click your endpoint →
**Reveal signing secret** → copy → update Vercel for the env in
question → redeploy.

### 13.3 "Update plan button is missing from Portal"

**Symptom:** in the Customer Portal, only **Cancel** appears — no
**Update plan** option to switch monthly ↔ annual.

**Cause:** in §5.2, the product was added but **only one price** was
ticked. Stripe needs both prices explicitly enabled.

**Fix:** §5.2 → Customer Portal → product → tick the other price →
save.

### 13.4 "Customer received receipt with no Terms link"

**Symptom:** receipt email is bare — no footer with Terms / Privacy
links.

**Cause:** §6 URLs not set, or the Stripe email template doesn't
auto-include them on your account vintage.

**Fix:** §6 first. If still missing after a fresh test charge, also
set the receipt **Footer text** in §7.3.

### 13.5 "Cancelled customer is still Pro"

**Symptom:** customer cancelled in the Portal but their PlanSight
account still shows Pro.

**Cause options:**
1. **Expected if they cancelled at end-of-period** (the §5.2 default).
   They keep Pro until `current_period_end`, then Stripe fires
   `customer.subscription.deleted` and tier flips. Check the
   `/my-plans` cancellation-pending banner — it should show the date.
2. Webhook delivery failed — check Dashboard → Webhooks → recent
   deliveries.
3. Webhook delivered but Supabase service-role key is missing/wrong —
   check Vercel logs for errors from `/api/billing/webhook`.

**Fix:** match against the cause. If #2, click **Resend** on the
failed delivery in the Stripe Dashboard.

### 13.6 "I accidentally created the price in USD, not AUD"

**Symptom:** `legal/terms.md` says AUD but Stripe is charging USD.

**Cause:** §3.2 / §3.3 — currency was set wrong during product
creation. Stripe **does not** allow changing the currency on an
existing price.

**Fix:** create new prices in the correct currency (don't delete the
old ones — Stripe forbids deleting prices that have ever been used).
Mark the old prices as **Archive** (the toggle that hides them from
new checkouts). Update Vercel `STRIPE_PRICE_ID` / `STRIPE_PRICE_ID_ANNUAL`
to the new ids. Redeploy. Existing subscriptions on the old price keep
billing in USD until they cancel and re-subscribe — there's no way to
migrate a live subscription to a different currency. Reach out to
affected customers if any.

### 13.7 "Stripe Live mode shows 'Activation required'"

**Symptom:** you can't create products or charges in Live mode.

**Cause:** §1.2 not completed.

**Fix:** complete the activation form. Until then, do all setup work
in Test mode only.

---

## Appendix: Quick command reference

```bash
# Forward live-mode-looking webhooks to localhost for testing
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger specific webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger charge.dispute.created
stripe trigger charge.dispute.closed

# Re-send a previously-delivered event by id (for idempotency testing)
stripe events resend evt_xxx

# List recent events
stripe events list --limit 10
```

```sql
-- Reconcile Stripe vs Supabase
select user_id, subscription_status, billing_interval, cancel_at_period_end
from user_billing
where subscription_status in ('active', 'trialing', 'past_due')
order by updated_at desc;

-- Match against Stripe Dashboard's active subscription count.
```
