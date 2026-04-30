# AI Solution Maven

AI Solution Maven is a Next.js site for a freelance AI builder portfolio and lead-generation site.

## Local Development

```bash
npm install
npm run dev
```

For local `.mpp` imports, run the parser service on port `3005`. The Next app falls back to `http://localhost:3005` in development if `PLANSIGHT_IMPORT_SERVICE_URL` is not set.

## Production Build

```bash
npm run build
npm run start
```

## Vercel Deployment

This project is ready for Vercel.

1. Push the repository to GitHub.
2. Import `angelito-crisologo/ai_solution_maven` into Vercel.
3. Add these environment variables in Vercel:
   - `RESEND_API_KEY`
   - `CONTACT_FROM_EMAIL`
   - `CONTACT_TO_EMAIL`
   - `PLANSIGHT_IMPORT_SERVICE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy the project.

Recommended values:
- `CONTACT_FROM_EMAIL`: a verified sender address in Resend
- `CONTACT_TO_EMAIL`: your inbox address
- `PLANSIGHT_IMPORT_SERVICE_URL`: the deployed MPP parser service URL
- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your Supabase anon public key

## Supabase Setup

1. Open your Supabase project.
2. Go to the SQL editor and run `supabase/schema.sql`.
3. Add the env vars above to `.env.local` for local development and to Vercel for production.
4. Keep using the anon public key only for the current share flow.

## MPP Import Deployment

PlanSight AI keeps the Next.js app on Vercel, but the `.mpp` parser must run in a separate service because Vercel does not host the Java runtime used by the parser.

The parser service now lives in `services/plansight-import/` and is deployed with the root `render.yaml`.

Deploy that service to Render, then point `PLANSIGHT_IMPORT_SERVICE_URL` at the resulting service URL.

## Login

The product will need authenticated user sessions for the private workspace. The cleanest next step is to add a managed auth provider such as Clerk or Supabase Auth, then protect the signed-in app area while keeping public stakeholder share links open.

## Brand Assets

Brand and metadata assets live in `app/`:
- `app/icon.svg`
- `app/apple-icon.svg`
- `app/opengraph-image.tsx`
- `app/manifest.ts`
- `app/robots.ts`
- `app/sitemap.ts`
