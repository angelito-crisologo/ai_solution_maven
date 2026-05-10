# PlanSight AI — Brand Kit

> Status: starter / placeholder. Currently inherits AI Solution Maven colors.
> This file is where you define how PlanSight AI looks and sounds independently
> of the parent AISM brand. Diverge from AISM whenever it sharpens the product's
> identity.

## 1. Brand Identity

**Name:** PlanSight AI
**Tagline:** Upload a plan, understand it fast, and share a clear stakeholder view.

**Positioning:**
- AI-enhanced project plan analyzer
- Built for project managers who need clarity, not another PM tool
- Stakeholder-friendly: read-only share view that anyone can open

**Personality:**
- Calm and confident
- Pragmatic, not flashy
- Precise — every claim is backed by data the PM can verify

---

## 2. Color System

> TODO: define a palette distinct from AISM. Suggested directions:
> - Teal / emerald primary (signals "insight", "clarity") with a warm
>   amber accent for risk/alerts
> - Or a single deep teal with neutral grays for an enterprise-feel
>
> Until customised, PlanSight reuses AISM tokens at `/lib/branding/aism.ts`.

### Suggested starting palette (placeholder)
- Primary: #008080 (teal)
- Accent: #34D399 (emerald)
- Risk / warning: #F59E0B
- Critical: #EF4444

---

## 3. Typography

Inter for now (matches AISM). PlanSight may eventually adopt a tighter
display face for product headers if AISM stays softer.

---

## 4. Voice & Tone

- Talk to PMs as peers — they're senior, they know their domain.
- Lead with the action ("Upload your plan") not the technology ("Powered by Claude").
- Risks are factual, not alarmist: "Two milestones depend on a task that's
  past due" beats "Critical issue detected!"

---

## 5. Imagery / Iconography

- Lucide icons in line/stroke style, same as AISM today.
- Product screenshots over abstract illustrations.

---

## 6. Logo

- Placeholder: gradient rounded square + Sparkles icon (same as AISM but
  emerald gradient).
- Source files (when designed): `/branding/plansight-ai/assets/`
- Web-served files: `/public/products/plansight-ai/`

---

## 7. Implementation

Tokens live at `/lib/branding/plansight.ts`.
Tailwind theme reads CSS variables that the PlanSight pages override at the
wrapper level. AISM pages keep the defaults from `globals.css`.
