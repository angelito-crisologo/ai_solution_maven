# plansight-import — `.mpp` parser microservice

Standalone backend service that PlanSight AI's Next.js app calls to
parse Microsoft Project `.mpp` files. Deployed separately (Render
Free) because Vercel can't host a JVM.

The Next.js app at `/api/plansight/import-mpp` proxies uploads to this
service via the `PLANSIGHT_IMPORT_SERVICE_URL` environment variable.

## Repository layout

- `backend/` — Node + Express API that wraps the Java CLI
- `parser-java/` — Java MPXJ parser CLI (Maven-built jar)
- `sample_projects/` — bundled sample `.mpp` files served via the
  samples API
- `Dockerfile` — multi-stage build (Maven for the jar, Node for the API)
- `render.yaml` — Render Blueprint config

## How it works

1. Next.js app posts a multipart upload to `POST /api/parse`.
2. Node API writes the file to a temp path and invokes the Java jar.
3. Java parser uses MPXJ to read the `.mpp` and emits normalized JSON.
4. Node API returns the JSON; Next.js app renders the workspace.

## Prerequisites (local dev)

- Node.js 20+
- Java 17+
- Maven 3.9+

## Local development

Build the parser jar, install Node deps, run the server:

```bash
cd parser-java && mvn -q package && cd ..
npm install
npm run dev
```

Backend listens on `http://localhost:3001` by default (override with
`PORT`).

## Backend API

- `GET /api/health` → `{ ok: true }`
- `POST /api/parse` — multipart upload, field name `file`
- `GET /api/samples` — list `.mpp` files in `sample_projects/`
- `POST /api/parse-sample` — body `{ "fileName": "..." }`

## Production deployment (Render Blueprint)

In Render:
1. **New → Blueprint**
2. Connect this repository
3. Render reads `render.yaml` and creates `plansight-import-service`
   (Docker-based — uses `Dockerfile` directly)

Set the env var on the Render service after first deploy:
- `CORS_ORIGIN=https://aisolutionmaven.com`

Already set by `render.yaml`:
- `SAMPLE_PROJECTS_DIR=/app/sample_projects`
- `MPP_PARSER_JAR=/app/parser-java/target/mpp-parser-cli-1.0.0-jar-with-dependencies.jar`

Then in Vercel, set `PLANSIGHT_IMPORT_SERVICE_URL` to the Render
service URL.

## Verification

- `https://<render-service>/api/health` returns `{ "ok": true }`
- An MPP upload from PlanSight succeeds and renders a plan

## Notes

- Backend listens on `process.env.PORT` automatically (required by
  Render).
- Render Free has aggressive cold-start behavior — UptimeRobot or a
  similar pinger should hit `/api/health` every ~5 min during business
  hours to keep the parser warm. Cold-start time is the dominant
  parse-time outlier; the `parser_duration_ms` field in
  `upload_events` shows this in production.
- If the parser path changes, override `MPP_PARSER_JAR` to the absolute
  path.
