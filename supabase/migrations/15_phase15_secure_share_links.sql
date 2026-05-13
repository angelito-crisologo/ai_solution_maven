-- Phase 15: secure share links — soft revocation + optional password.
--
-- Implements docs/plansight-ai/specs/SECURE_SHARE_LINKS_SPEC.md
-- with the v1.2 scope reduction: expiry / view-limit deferred,
-- revocation and password protection only.
--
-- Tier model:
--   - Revocation (share_revoked_at): all signed-in users (Free + Pro)
--   - Password protection (share_password_hash et al): Pro only
--
-- Hashing happens in the Node runtime via node:crypto scrypt (no
-- npm dependency, no pgcrypto extension required). The stored format is
-- "scrypt$<salt-hex>$<derived-key-hex>".
--
-- share_password_version is incremented on every password change AND on
-- revoke / restore. It is embedded in the HMAC-signed session cookie
-- issued after a successful password entry, so any of those operations
-- invalidates all existing stakeholder sessions immediately.
--
-- Run after 14_phase14_stripe_dedupe_and_interval.sql. Idempotent.

alter table public.plans
  add column if not exists share_revoked_at timestamptz null;

alter table public.plans
  add column if not exists share_password_hash text null;

alter table public.plans
  add column if not exists share_password_set_at timestamptz null;

alter table public.plans
  add column if not exists share_password_version integer not null default 0;

comment on column public.plans.share_revoked_at is
  'Soft revocation flag. When set, the public /share/<id> route returns a generic "no longer available" page. Reversible via /api/plansight/share/restore.';

comment on column public.plans.share_password_hash is
  'Scrypt-derived password hash (format: scrypt$salt$key). Null = open share link. Pro-only feature; set/cleared via /api/plansight/share/password.';

comment on column public.plans.share_password_set_at is
  'Timestamp of the most recent password set or change. Surfaced in the Manage Share UI; null when no password is set.';

comment on column public.plans.share_password_version is
  'Incremented on every password change AND on revoke/restore. Embedded in HMAC-signed session cookies; mismatch on read invalidates the cookie. Defence-in-depth against stale sessions after security state changes.';

create index if not exists plans_share_revoked_idx
  on public.plans (share_revoked_at)
  where share_revoked_at is not null;

-- share_access_attempts: rate-limit + audit log for password verify route.
-- 5 failed attempts per (share_id, ip) within 15 minutes triggers a generic
-- error response (same string as a wrong password — never reveal lockout to
-- attackers). Audit trail kept indefinitely for future "who accessed this
-- share" surfacing.

create table if not exists public.share_access_attempts (
  id uuid primary key default gen_random_uuid(),
  share_id text not null,
  ip_address inet not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);

comment on table public.share_access_attempts is
  'Rate-limit counter + audit log for share-link password attempts. Written by /api/plansight/share/verify only. Counted via the (share_id, ip_address, attempted_at desc) index for sub-millisecond rate-limit lookups.';

create index if not exists share_access_attempts_share_ip_attempted_idx
  on public.share_access_attempts (share_id, ip_address, attempted_at desc);

alter table public.share_access_attempts enable row level security;
-- No policies: service-role bypass only. The verify endpoint uses the
-- service-role key; nothing on the client side should ever read this table.
