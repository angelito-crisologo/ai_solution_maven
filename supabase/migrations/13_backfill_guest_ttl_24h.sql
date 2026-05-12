-- 13_backfill_guest_ttl_24h.sql
--
-- One-time backfill. When the anonymous TTL dropped from 30 days to 24 hours
-- (commit 31e1f6b), existing guest rows kept their 30-day expires_at because
-- the value is set at insert time, not computed on read. The opportunistic
-- cleanup in saveSharedPlan() will only delete them once their original 30-day
-- window elapses, so users created during the brief 30-day era enjoy a longer
-- lifespan than the policy now advertises on the pricing page.
--
-- This migration caps every still-live guest row to expire within 24 hours of
-- the migration's apply time. Anyone mid-session keeps a full 24h to act;
-- rows already due to expire sooner are left alone.
--
-- Safe to re-run: after the first apply, no guest rows have expires_at > now+24h.

UPDATE plans
SET expires_at = NOW() + INTERVAL '24 hours'
WHERE owner_type = 'guest'
  AND expires_at > NOW() + INTERVAL '24 hours';
