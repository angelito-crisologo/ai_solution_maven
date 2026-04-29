import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import multer from "multer";
import { parseMppFile } from "./parserClient.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

const uploadDir = path.resolve(process.cwd(), "uploads");
const sampleProjectsDir = (() => {
  if (process.env.SAMPLE_PROJECTS_DIR) {
    return path.resolve(process.env.SAMPLE_PROJECTS_DIR);
  }
  const cwdLocal = path.resolve(process.cwd(), "sample_projects");
  if (fsSync.existsSync(cwdLocal)) {
    return cwdLocal;
  }
  return path.resolve(process.cwd(), "../sample_projects");
})();
fsSync.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/api/samples", async (_, res) => {
  try {
    const files = await fs.readdir(sampleProjectsDir, { withFileTypes: true });
    const sampleFiles = files
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mpp"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    res.json({ samples: sampleFiles });
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? `Failed to list sample projects: ${error.message}`
          : "Failed to list sample projects"
    });
  }
});

app.post("/api/parse", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file was uploaded. Expected field name: file" });
    return;
  }

  const originalName = req.file.originalname.toLowerCase();
  if (!originalName.endsWith(".mpp")) {
    await fs.unlink(req.file.path).catch(() => undefined);
    res.status(400).json({ error: "Invalid file type. Please upload a .mpp file." });
    return;
  }

  try {
    const project = await parseMppFile(req.file.path);
    res.json(project);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown parser error"
    });
  } finally {
    await fs.unlink(req.file.path).catch(() => undefined);
  }
});

app.post("/api/parse-sample", async (req, res) => {
  const fileName = typeof req.body?.fileName === "string" ? req.body.fileName : "";
  const sanitizedFileName = path.basename(fileName);
  if (!sanitizedFileName || sanitizedFileName !== fileName || !sanitizedFileName.toLowerCase().endsWith(".mpp")) {
    res.status(400).json({ error: "Invalid sample project file name." });
    return;
  }

  const samplePath = path.join(sampleProjectsDir, sanitizedFileName);

  try {
    await fs.access(samplePath);
    const project = await parseMppFile(samplePath);
    res.json(project);
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error
          ? `Failed to parse sample project: ${error.message}`
          : "Failed to parse sample project"
    });
  }
});

app.get("/", (_, res) => {
  res.send("PlanSight import service is running");
});

app.listen(port, () => {
  console.log(`PlanSight import service listening on port ${port}`);
});
