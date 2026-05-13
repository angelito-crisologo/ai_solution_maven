# Legal documents moved

The PlanSight legal documents (Terms of Service, Privacy Policy, Refund
Policy) live at **`content/plansight-legal/`** and are served by the
runtime via `app/products/plansight-ai/legal/[slug]/page.tsx`.

**Edit there, not here.** This directory is kept only as a pointer.

- `content/plansight-legal/terms.md` → https://aisolutionmaven.com/products/plansight-ai/legal/terms
- `content/plansight-legal/privacy.md` → https://aisolutionmaven.com/products/plansight-ai/legal/privacy
- `content/plansight-legal/refunds.md` → https://aisolutionmaven.com/products/plansight-ai/legal/refunds

The previous `/legal/:slug` URLs are 301 redirected to the new paths
(see `next.config.mjs`).

See [`docs/plansight-ai/services.md`](../services.md) for the broader
service inventory and [`docs/plansight-ai/CHANGELOG.md`](../CHANGELOG.md)
for the migration entry under v1.1.
