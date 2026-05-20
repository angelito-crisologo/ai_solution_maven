-- Utility: delete a single user and all associated data.
--
-- NOT a schema migration. Run manually in the Supabase SQL editor
-- when you need to fully purge a user account (e.g. GDPR request,
-- test-account cleanup, bad-actor removal).
--
-- Usage:
--   1. Replace the email value below with the target user's email.
--   2. Run in the Supabase SQL editor (use the production project).
--   3. Confirm the NOTICE output matches the expected user before
--      any cascades commit — wrap in BEGIN/ROLLBACK to preview first.
--
-- What this deletes:
--   upload_events      — rows where user_id matches (FK is SET NULL, not CASCADE,
--                        so these must be deleted explicitly before auth.users)
--   auth.users         — the auth record; triggers cascades to all tables below
--     └─ public.users          (CASCADE)
--     └─ product_activations   (CASCADE)
--     └─ user_billing          (CASCADE)
--     └─ ai_usage_log          (CASCADE)
--     └─ ai_spend_alerts       (CASCADE)
--     └─ plans                 (CASCADE via owner_user_id)
--           └─ plan_tasks      (CASCADE via share_id)
--           └─ share_views     (CASCADE via share_id)
--
-- What this does NOT delete:
--   explain_task_cache  — keyed by (plan_content_hash, task_id), not by user.
--                         generated_by SET NULLs on delete. Safe to leave:
--                         these are content-addressed and may benefit other users.
--   stripe_events       — webhook dedupe log; no user_id column.
--
-- Preview mode (dry-run, no permanent changes):
--   Wrap the entire block in BEGIN; ... ROLLBACK; to see what would be deleted.

DO $$
DECLARE
  _email    TEXT := 'user@example.com';  -- ← replace with target email
  _user_id  UUID;
  _plan_count    INT;
  _upload_count  INT;
BEGIN
  -- Resolve user ID
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _email;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row found for email: %', _email;
  END IF;

  RAISE NOTICE 'Deleting user % (%)', _email, _user_id;

  -- Count what will be removed (informational)
  SELECT COUNT(*) INTO _plan_count
  FROM public.plans
  WHERE owner_user_id = _user_id;

  SELECT COUNT(*) INTO _upload_count
  FROM public.upload_events
  WHERE user_id = _user_id;

  RAISE NOTICE '  plans to delete: %', _plan_count;
  RAISE NOTICE '  upload_events to delete: %', _upload_count;

  -- Step 1: explicitly delete upload_events (FK is SET NULL, not CASCADE)
  DELETE FROM public.upload_events
  WHERE user_id = _user_id;

  -- Step 2: delete the auth record — cascades to:
  --   public.users, product_activations, user_billing,
  --   ai_usage_log, ai_spend_alerts,
  --   plans → plan_tasks, share_views
  DELETE FROM auth.users
  WHERE id = _user_id;

  RAISE NOTICE 'Done. User % fully removed.', _email;
END $$;
