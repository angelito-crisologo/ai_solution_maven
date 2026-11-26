# aisolutionmaven.com

Marketing site for AI Solution Maven: digital workplace strategy and bespoke
business applications. Next.js 14 App Router, TypeScript and Tailwind, on Vercel.

PlanSight AI (plansight.aisolutionmaven.com) and ScrumReady
(scrumready.aisolutionmaven.com) are separate apps; this site only links to them.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run test
npm run build
npm run check:placeholders   # fails while unresolved facts remain
```

## Environment variables

Names only; see `.env.example`.

| Variable | Used by | Needed for |
| --- | --- | --- |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | `/api/contact` | Sending the contact form (runtime) |
| `NEXT_PUBLIC_BOOKING_URL` | Booking buttons | Optional; defaults to the Cal.com link |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 | Optional; analytics is off when unset (build time) |

The build needs none of them.

## Structure

- `app/`: routes `/`, `/services`, `/how-i-work`, `/work`, `/about`, `/contact`, `/privacy`, plus the `/api/contact` route.
- `content/`: all site copy, typed.
- `components/`: layout, cards, blocks and the contact form.
- `lib/`: analytics, booking link, contact validation, metadata helper, UI class recipes.

Conventions, tokens, voice and claims rules are in `CLAUDE.md`.
