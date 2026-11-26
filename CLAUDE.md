# aisolutionmaven.com: conventions

Marketing site for a one-person Australian consultancy and build business.
Next.js 14 App Router, TypeScript (strict), Tailwind 3, deployed on Vercel.
The one action the site drives is booking an intro call.

## Commands
- `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npx tsc --noEmit`
- `npm run check:placeholders`: lists unresolved facts; must pass before launch.
- Use npm (the repo has package-lock.json). Do not upgrade Next.js majors without a decision.

## Where things live
- Copy: `/content/*.ts` only. Components arrange words; they never contain them.
- Unresolved facts: `ph("...")` in `/content`, rendered as a `<Placeholder>` chip. Never hide or invent them.
- Tokens: `tailwind.config.ts` and `app/globals.css` (from the Claude Design export).
- Button and link recipes: `lib/ui.ts`. Booking link: `lib/booking.ts` (`NEXT_PUBLIC_BOOKING_URL`).
- Contact API: `app/api/contact/route.ts`, rules in `lib/contact/`, tests in `lib/contact/__tests__/`.

## Design tokens
- Navy 900 `#132440` headings and bands; Ink 700 `#3d4a5f` body; Ink 500 `#5b6779` help text.
- Teal 700 `#0b6c78`: all text links, buttons and the focus ring. Teal 500 `#1094a3`: mark and block graphics only (white on it fails AA).
- Focus: 3 px Teal 700 ring, 3 px offset (white on the navy band).
- Inter; body 18/1.6; nothing below 14 px. Breakpoints 375, 768, 1280; nav row from 1024.
- Cards: 1 px `#dbe1e8` line, 12 px radius, no shadows.

## Voice
- Australian English (organisation, licence/license, program unless a formal programme).
- First person singular. Plain, short sentences. Say "challenge" or "friction", not "pain point".
- Never: revolutionise, unlock, leverage, cutting-edge, seamless.
- Costs are discussed openly, including running costs.

## Claims rules
- Only what is true and checkable. No invented testimonials, logos, numbers or client lists.
- No client names or logos. artol-ai is not in this release.
- Demos always carry the label "Demo, synthetic data".
- PlanSight AI and ScrumReady are products I built, not client work.
- Publish only the business email, ABN 13 815 591 422 and "Adelaide, South Australia". No phone or street address.
- Credentials link to the issuer; no certification numbers.

## Keep working
- Redirects in `next.config.mjs` (PlanSight subdomain, legacy `/legal/:slug`, old `/products` and `/projects`).
- Google Search Console token in `app/layout.tsx`; GA4 gated on `NEXT_PUBLIC_GA4_MEASUREMENT_ID`.