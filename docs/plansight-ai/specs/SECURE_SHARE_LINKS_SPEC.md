# Secure Share Links — Pro Feature Spec

**Status:** v1.2 shipped (subset) — see Implementation note below
**Tier:** Pro (password) + Free/Pro (revocation)
**Phase:** Shipped as Phase 15, separately from Phase 5 (Stripe billing)

> **Implementation note (2026-05-13, v1.2).** Two of the three features
> in this spec shipped. The third (share link expiry / view limits) was
> **deferred** at the planning step:
>
> - ✅ **Soft revocation + restore** — Free + Pro. Implemented via
>   `share_revoked_at` column + `share_password_version` bump on
>   revoke/restore so any active stakeholder cookies become invalid
>   immediately. Migration `15_phase15_secure_share_links.sql`.
> - ✅ **Password-protected share links** — Pro only, opt-in per share.
>   Hashing uses **scrypt via `node:crypto`** instead of the spec's
>   suggested bcrypt-via-pgcrypto — same legal/security posture
>   (slow-on-purpose KDF), zero extension or dependency footprint.
>   Cookie scheme is HMAC-signed JSON `{shareId, passwordVersion, exp}`
>   matching `lib/plansight-ai/share-security.ts`. Rate limiting via
>   `share_access_attempts` table (the spec's audit table doubles as
>   rate-limit storage).
> - ❌ **Share link expiry (date + view limits)** — **not implemented**.
>   The two-condition gating, view-count semantics, and owner carve-out
>   added meaningful UX complexity for what is, today, a thin product
>   demand signal. Anonymous plans still auto-expire at 24h via the
>   existing system-set `expires_at` column. Pro users cannot set a
>   user-configurable expiry. Re-open this spec when paying customers
>   ask.
>
> Verbatim-quoted password copy ("Anyone with this link…") is in the
> Manage Share modal helper text per §UI/UX.

---

## Overview

Add a new bundle of features under the umbrella **"Secure share links"** to PlanSight Pro. This protects stakeholder share URLs from accidental forwarding, screenshots, and indefinite circulation by allowing PMs to:

1. Set a password on a share link
2. Set an expiry date or view limit on a share link
3. Revoke a share link at any time from the dashboard

The viewer flow: anyone who opens a protected share URL sees a generic password prompt page (no plan name or other identifying metadata), enters the password, and on success gets a short-lived session cookie that lets them view the plan without re-prompting on every page load.

---

## Why this matters

The current share link is an unguessable 128-bit UUID. That defends against guessing attacks but does nothing once a link is forwarded, screenshotted, or pasted into chat. For PMs in regulated industries, consulting, enterprise IT, and government — exactly the segment most likely to pay $19/month — "unguessable" isn't enough. They cannot use a tool unless they can control who actually sees the output, even after a link leaves their hands.

Password protection (shared out-of-band) means a leaked or forwarded link is useless without the second factor. Expiry and revocation give the PM a way to wind down access without manual cleanup. Together they widen PlanSight's addressable market from "PMs who don't mind public-ish URLs" to "PMs whose employer has a security policy."

This is also the clearest "real product" signal in the Pro tier — security features feel different in users' minds than workflow features. They convert hesitant buyers ("is this enterprise-ready?") in a way that filtered views and PDF exports don't.

---

## Tier model

| Capability | Anonymous | Free | Pro |
|---|---|---|---|
| Create share link | ✓ | ✓ | ✓ |
| Revoke share link (delete it) | ✓ | ✓ | ✓ |
| Password-protect share link | – | – | ✓ |
| Set share link expiry date | – | – | ✓ |
| Set share link view limit | – | – | ✓ |

**Revocation is intentionally free for all tiers.** Letting any user kill a link they accidentally shared is a safety affordance, not a security feature, and gating it makes the product look hostile. The Pro-only part is *adding protections to a link in advance*.

---

## Feature 1: Password-protected share links

### Behaviour

- When creating a share link as a Pro user, the PM sees an optional "Require password" checkbox in the share dialog.
- If checked, the PM enters a password (minimum 8 characters, no other complexity rules — usability over theatre).
- The share record stores a hashed password using **bcrypt** or **argon2id** via Supabase's `pgcrypto` extension. Never plaintext. Never SHA-256-of-password.
- The PM shares the link and the password through separate channels (the UI should suggest this in helper text: *"Share the link in email, share the password in chat — or vice versa."*).

### Viewer flow

1. Viewer opens the share URL.
2. Server resolves the share ID and checks: does this share have a password?
3. If yes, render a **generic password prompt page**. This page must not display the plan name, the PM's name, the project description, or any other identifying metadata. The page title and content should reveal nothing beyond "this link is password-protected."
4. Viewer POSTs the password to a verify endpoint. **Never** pass the password as a URL query parameter.
5. Server verifies the hash. On success, set an HTTP-only, Secure, SameSite=Lax cookie scoped to the share ID, with a 4-hour expiry. On failure, return a generic error.
6. On subsequent requests for that share ID, the cookie bypasses the password prompt.

### Rate limiting

- 5 failed password attempts per IP per share ID → 15-minute lockout for that IP+share combination.
- Implement at the API route level using a small in-memory or Redis-backed counter. Lockouts should be silent (return the same generic "incorrect password" error) to avoid telling attackers when they've triggered the limit.
- Reset the counter on a successful auth.

### Data model

Add columns to the existing `plans` (or `shares`, depending on current schema — match what already exists) table:

```sql
ALTER TABLE plans ADD COLUMN share_password_hash TEXT NULL;
ALTER TABLE plans ADD COLUMN share_password_set_at TIMESTAMPTZ NULL;
```

Create a separate `share_access_attempts` table for rate limiting:

```sql
CREATE TABLE share_access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL,
  ip_address INET NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_access_attempts_share_ip
  ON share_access_attempts(share_id, ip_address, attempted_at DESC);
```

Old rows (>24 hours) can be cleaned up by a nightly job or pg_cron.

### API routes

- `POST /api/share/[id]/verify` — verify password, set cookie, return success/failure.
- `PATCH /api/share/[id]/password` — Pro-only. Add, update, or remove a password on a share link.

Both routes must use the service-role Supabase key (server-side) and validate the caller's session for the PATCH endpoint.

### UI components

- Share dialog: add "Require password" checkbox + password input + helper text suggesting out-of-band distribution.
- "My Plans" dashboard: indicate which shares are password-protected (small lock icon next to the share URL).
- Password prompt page: minimal, generic, no plan metadata. Title: "Password required". Body: one input, one submit button, one generic error state.

---

## Feature 2: Share link expiry

### Behaviour

When creating or editing a share link, the PM can optionally set:

- **Expiry date** — link stops working at the given date/time.
- **View limit** — link stops working after N successful views (counted per share, not per IP).

Either, both, or neither can be set. If neither is set, the link works indefinitely (current behaviour).

### Viewer flow

On every request to a share URL:

1. Server resolves the share record.
2. If `expires_at` is set and `now() > expires_at`, return a generic "this link has expired" page.
3. If `view_limit` is set and `view_count >= view_limit`, return the same expired page.
4. Otherwise, proceed (through password check if applicable).
5. On a successful render of the plan content, increment `view_count`.

A "view" is defined as a server-rendered fetch of the share page after any password check passes. Refreshes within the same 4-hour cookie session do not count as additional views (to avoid burning views on legitimate stakeholder re-checks). Implementation: only increment when no valid session cookie is present.

### Data model

```sql
ALTER TABLE plans ADD COLUMN share_expires_at TIMESTAMPTZ NULL;
ALTER TABLE plans ADD COLUMN share_view_limit INT NULL;
ALTER TABLE plans ADD COLUMN share_view_count INT NOT NULL DEFAULT 0;
```

### API routes

- `PATCH /api/share/[id]/expiry` — Pro-only. Set, update, or clear expiry date and view limit on a share link.

### UI components

- Share dialog: optional fields for "Expires on" (date picker) and "Max views" (number input).
- "My Plans" dashboard: for each share, show "Expires DD MMM YYYY" or "Views: 3 / 10" if set.
- Expired page: generic "this share link is no longer active" message. Do not reveal whether expiry was by date or view limit.

---

## Feature 3: Revoke share link

### Behaviour

The PM can revoke a share link from the dashboard. Revocation immediately invalidates the link for all viewers, including those with active session cookies (cookies should be invalidated server-side, not just deleted client-side).

**This is available to all tiers** — Free and Anonymous users included. Revocation is a safety feature, not a Pro upgrade.

### Implementation

Add a `share_revoked_at` column. Set it to `now()` on revocation. On every share-page request, check this field before anything else and return the expired page if set.

```sql
ALTER TABLE plans ADD COLUMN share_revoked_at TIMESTAMPTZ NULL;
```

Do not hard-delete the share record on revocation — the PM may want to re-enable it later, and audit trails are easier when records persist. Provide a "Re-enable share" action that clears `share_revoked_at`.

### API routes

- `POST /api/share/[id]/revoke` — all tiers. Sets `share_revoked_at = now()`.
- `POST /api/share/[id]/restore` — all tiers. Clears `share_revoked_at`.

### UI components

- "My Plans" dashboard: per-share "Revoke" button (red, requires confirmation modal).
- After revocation: button changes to "Restore". Share row shows "Revoked" badge.

---

## Critical security requirements (do not skip)

These are non-negotiable. Implementing the features without these is worse than not implementing them — it gives users false confidence.

### 1. Generic password prompt page

The password prompt must not leak plan metadata. No plan name, no PM name, no project description, no client name, no upload date. Just "Password required" + input + submit.

This matters because project names alone often *are* the sensitive thing the PM is trying to protect. "Acme Corp Acquisition — Phase 2 Plan" leaks the whole story before any password is entered.

### 2. Passwords never in URLs

All password submission must be via POST body to a verify endpoint. Never `?password=foo` in the URL. URL parameters leak to server logs, browser history, referrer headers, and analytics. Reviewers will catch this in audits — get it right the first time.

### 3. Hashed storage with proper algorithm

Use bcrypt (cost factor 12) or argon2id via Supabase's pgcrypto. Never plaintext. Never MD5/SHA-1/SHA-256 (these are fast hashes designed for non-password use; they're brute-forceable). The exact algorithm choice matters less than "is the algorithm slow on purpose."

### 4. Rate limiting

5 failed attempts per IP per share, 15-minute lockout. Without this, the unguessable share URL becomes a known target with a brute-forceable password. Generic error message regardless of whether the lockout triggered (don't tell attackers when they've hit the limit).

### 5. HTTP-only cookies

Session cookies set after successful password entry must be `HttpOnly`, `Secure`, `SameSite=Lax`, scoped to the share path. JavaScript on the page must not be able to read the cookie value.

### 6. Server-side session invalidation

When a share is revoked or its password changes, existing session cookies must become invalid immediately. Implement by storing a `password_version` integer on the share record, including it in the cookie payload (signed), and checking it on every request. Increment on password change or revocation.

### 7. Audit log columns

Even though we're not surfacing access history in v1, record successful and failed access attempts in `share_access_attempts`. This costs almost nothing and means when a paying customer eventually asks "who accessed this share?", the data is already there. Don't backfill — easier to have it from day one.

---

## UI/UX notes

### Share dialog (Pro version)

When a Pro user clicks "Share" on a plan, show an expanded dialog with three sections:

1. **The link** — URL with copy button (always present).
2. **Password protection** (Pro only) — checkbox + password input + helper text.
3. **Expiry** (Pro only) — collapsed accordion with "Set expiry date" and "Set view limit" options.

For Free users, only section 1 appears. Sections 2 and 3 show a subtle "Pro" badge that opens the upgrade modal on click — do not hide the features entirely, since their visibility is itself a conversion driver.

### Dashboard share management

In "My Plans" (Pro-only dashboard from Phase 4), each plan row should show:

- A small lock icon if the share is password-protected
- An hourglass icon if expiry is set, with the expiry date on hover
- A view counter if view limit is set ("3 / 10 views")
- A red "Revoked" badge if revoked

Clicking any share opens an edit modal where these can be changed.

### Copy guidance

Helper text on the password field:
> *Anyone with this link must enter the password to view. Share the password through a different channel than the link itself — for example, send the link by email and the password by chat.*

Helper text on expiry:
> *The link stops working after this date or view limit. You can revoke it at any time.*

Error message on the public password prompt page (any failure mode):
> *Incorrect password.*

Do not vary this message based on cause (wrong password, expired, revoked, rate-limited). All failure modes return the same string to avoid information disclosure.

---

## What's NOT in this feature (and why)

These are deliberately deferred to keep v1 shippable:

- **Email-gated access (allowlist of email addresses with magic-link verification).** This is the "real" enterprise solution and meaningfully bigger than v1 — requires reusing the Phase 4 auth infrastructure for a separate viewer-side flow, audit-trail UI, and allowlist management. Defer until paying customers ask for it. When it ships, it likely justifies a higher tier or a metered add-on.
- **Share link access history UI.** Data is being logged from day one (`share_access_attempts`), but the UI to surface it is a v1.1 feature. Adding it later is purely a frontend job since the data is already there.
- **Per-IP geographic restrictions.** Niche, expensive to support correctly (geo-IP databases are imperfect), and not a real ask from the target buyer.
- **SSO / SAML.** Belongs to a future Teams tier, not Pro.
- **Watermarking / DRM on the view page.** Watermarks deter casual screenshot sharing but don't actually prevent it, and they make the share view look hostile. Skip.

---

## Acceptance criteria

The feature is shippable when:

1. A Pro user can create a share link with a password from the share dialog.
2. The viewer flow shows a generic password prompt with no plan metadata.
3. Failed password entries are rate-limited (5 per IP per share, 15-min lockout).
4. Passwords are stored hashed (bcrypt or argon2id), never in plaintext, never in URLs.
5. A successful password entry sets an HttpOnly, Secure, SameSite=Lax session cookie scoped to the share ID, expiring after 4 hours.
6. A Pro user can set an expiry date and/or view limit on a share link.
7. Expired / over-limit links show a generic "no longer active" page that does not reveal which condition triggered.
8. Any tier of user (including Anonymous and Free) can revoke a share link from the relevant view, and revocation invalidates all existing session cookies for that share.
9. Free and Anonymous users see Pro security features in the share dialog with a "Pro" badge that opens the upgrade flow.
10. The dashboard shows lock / hourglass / view-counter / revoked indicators on each share.
11. All access attempts (successful and failed) are logged to `share_access_attempts` for future audit-trail surfacing.

---

## Update needed in `pro-features.md`

Add this feature to the Pro feature list as item 10, just after "Saved filtered views":

> **10. Secure share links**
>
> *What it does.* Protect share links with a password and set an expiry date or view limit. Revoke any link from your dashboard at any time. Share the password through a separate channel from the link itself, so even a forwarded or accidentally-posted link can't be opened by the wrong person.
>
> *Why a PM cares.* Many project plans contain information that isn't strictly secret but isn't meant for general circulation — vendor names, internal budget context, sensitive milestones, client identities. PMs in regulated industries, consulting, government, and enterprise IT routinely can't use a tool unless they can control who sees the output. Secure share links remove that blocker. For consultants specifically, password-protected client deliverables are table stakes.
>
> *Build cost.* Low. One new column for the password hash, one for expiry, one for view count, plus a small access-log table. A generic password prompt page on the viewer side and a checkbox group on the share dialog. Revocation is a single column flip.

Also add these rows to the tier comparison table at the top of that document:

| Capability | Free | Pro |
|---|---|---|
| Password-protected share links | – | ✓ |
| Share link expiry and view limits | – | ✓ |
| Revoke share link | ✓ | ✓ |
