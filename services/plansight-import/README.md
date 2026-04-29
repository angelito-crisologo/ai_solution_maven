# mpp_viewer

Responsive web app for viewing Microsoft Project `.mpp` plans in the browser with:
- hierarchical task list (MS Project-style outline)
- synchronized Gantt chart
- dependency lines
- drag-resizable task columns
- drag-resizable task pane vs Gantt pane
- sample-project picker from `sample_projects/`

## Repository Layout

- `frontend/`: React + Vite UI
- `backend/`: Node + Express API
- `parser-java/`: Java MPXJ parser CLI
- `sample_projects/`: bundled sample `.mpp` files
- `render.yaml`: Render backend deployment config
- `frontend/vercel.json`: Vercel frontend config

## How It Works

1. User uploads a `.mpp` file or selects a sample project.
2. Frontend calls backend API.
3. Backend invokes Java parser (`MPXJ`) and returns normalized JSON.
4. Frontend renders task table + Gantt and keeps row heights aligned.

## Prerequisites

- Node.js 20+
- Java 17+
- Maven 3.9+

## Local Development

1. Build parser jar:
```bash
cd parser-java
mvn -q package
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Run frontend + backend:
```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Backend API

- `GET /api/health`
- `POST /api/parse` (multipart upload field: `file`)
- `GET /api/samples` (list `.mpp` files in `sample_projects`)
- `POST /api/parse-sample` (`{ "fileName": "..." }`)

## Production Deployment (Parser Service + Frontend)

### 1) Push code to GitHub

```bash
git add .
git commit -m "Prepare PlanSight import service deployment"
git push origin main
```

### 2) Deploy the parser service on Render

This repo includes `render.yaml` for the parser service.

In Render:
1. New -> Blueprint
2. Connect this repository
3. Render reads `render.yaml` and creates `plansight-import-service`

The service is Docker-based, so Render uses `Dockerfile` directly.

Required env var:
- `CORS_ORIGIN=https://<your-nextjs-domain>`

Already set by `render.yaml`:
- `SAMPLE_PROJECTS_DIR=/app/sample_projects`
- `MPP_PARSER_JAR=/app/parser-java/target/mpp-parser-cli-1.0.0-jar-with-dependencies.jar`

### 3) Deploy the frontend on Vercel

1. Import the PlanSight Next.js app repo in Vercel
2. Add env var:
   - `PLANSIGHT_IMPORT_SERVICE_URL=https://<your-render-service-domain>`
3. Deploy

### 4) Final production wiring

1. Copy the Vercel production URL
2. Set Render `CORS_ORIGIN` to that exact URL
3. Redeploy the parser service

### 5) Verification checklist

- `https://<render-service>/api/health` returns `{ "ok": true }`
- `https://<render-service>/` returns the service status message
- Upload `.mpp` from PlanSight works
- PlanSight can import and render a plan
- Daily/Weekly/Monthly views render correctly

## Notes

- Backend listens on `process.env.PORT` automatically (required by Render).
- If parser path changes, override:
  `MPP_PARSER_JAR=/absolute/path/to/mpp-parser-cli-...jar`
