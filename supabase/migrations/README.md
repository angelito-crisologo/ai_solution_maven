# Migration conventions

## After 2026-10-30: explicit GRANTs required on new `public` tables

Supabase is changing the Data API exposure default for the `public`
schema on existing projects starting **2026-10-30**. New projects
hit the same change on 2026-05-30. After that date, any table you
create in `public` is invisible to `supabase-js` / PostgREST /
GraphQL until you grant access to a role explicitly.

Existing PlanSight tables (everything through `15_phase15_…`) keep
their current grants and are unaffected. This rule applies only to
new tables added in migrations after 2026-10-30.

Failure mode is loud, not silent: PostgREST returns a `42501` error
with the GRANT statement it wants you to add.

## Grant template for new tables

PlanSight uses two access patterns:

- **Server-only via the service role** — most tables. Service role
  bypasses RLS and is the only writer.
- **Client reads via the anon key** — currently only `plans` (the
  share-view loader). Anything new that a stakeholder share view
  needs to read goes here.

Pick the grants that match how the table is actually accessed:

```sql
-- Always: server-side reads + writes
grant select, insert, update, delete on public.<new_table> to service_role;

-- Only if a share-view or other client-side anon read needs this table
grant select on public.<new_table> to anon;

-- Only if you've moved to PostgREST authenticated reads via RLS
-- (not the current PlanSight pattern)
grant select, insert, update, delete on public.<new_table> to authenticated;

-- RLS still applies independently of grants
alter table public.<new_table> enable row level security;
```

## Utility scripts

Scripts prefixed `util_` are **admin utilities, not schema migrations**. They are never run automatically — copy-paste into the Supabase SQL editor and run manually as needed.

| File | Purpose |
|---|---|
| `util_delete_user.sql` | Fully purge a user and all associated data (plans, tasks, share views, billing, AI usage log, upload events, product activations). Use for GDPR/CCPA deletion requests or test-account cleanup. Replace the email variable at the top before running. Wrap in `BEGIN; … ROLLBACK;` to preview what would be deleted without committing. |

---

## When the date arrives

Before writing the next post-2026-10-30 migration, sanity-check this
file is current — if the Data API exposure policy has changed again,
the grant template above may need updating.
