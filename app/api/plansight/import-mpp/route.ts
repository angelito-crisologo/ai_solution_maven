import { NextResponse } from "next/server";
import {
  normalizeParsedProject,
  type ParsedProject
} from "@/lib/plansight-ai/adapters/mpp";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const PARSER_TIMEOUT_MS = 25_000; // 25s, leaves headroom under Vercel Hobby's 10s ceiling for the typical case

// MS Compound Document magic bytes — every .mpp file starts with this.
const MPP_MAGIC_BYTES = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

function resolveParserServiceUrl() {
  const configuredUrl = process.env.PLANSIGHT_IMPORT_SERVICE_URL?.trim();
  const isPlaceholder =
    !configuredUrl ||
    configuredUrl.includes("your-parser-service.example.com") ||
    configuredUrl.includes("example.com");

  if (!isPlaceholder) {
    return configuredUrl;
  }

  return process.env.NODE_ENV === "development" ? "http://localhost:3005" : "";
}

function hasMppMagicBytes(bytes: Uint8Array) {
  if (bytes.length < MPP_MAGIC_BYTES.length) return false;
  for (let i = 0; i < MPP_MAGIC_BYTES.length; i += 1) {
    if (bytes[i] !== MPP_MAGIC_BYTES[i]) return false;
  }
  return true;
}

export async function POST(request: Request) {
  const parserServiceUrl = resolveParserServiceUrl();

  if (!parserServiceUrl) {
    return NextResponse.json(
      {
        error:
          "PLANSIGHT_IMPORT_SERVICE_URL is not configured. The MPP parser runs in a separate service."
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file was uploaded. Expected field name: file." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File exceeds maximum size of 25 MB." },
      { status: 413 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".mpp")) {
    return NextResponse.json(
      { error: "Invalid file type. Please upload a .mpp file." },
      { status: 400 }
    );
  }

  // Magic-byte check: refuse non-compound-document content even with a .mpp extension.
  const head = new Uint8Array(await file.slice(0, MPP_MAGIC_BYTES.length).arrayBuffer());
  if (!hasMppMagicBytes(head)) {
    return NextResponse.json(
      { error: "File does not appear to be a valid Microsoft Project (.mpp) file." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PARSER_TIMEOUT_MS);

  try {
    const parserFormData = new FormData();
    parserFormData.append("file", file);

    const response = await fetch(`${parserServiceUrl.replace(/\/$/, "")}/api/parse`, {
      method: "POST",
      body: parserFormData,
      signal: controller.signal
    });

    const payload = (await response.json().catch(() => null)) as
      | (ParsedProject & { error?: string })
      | null;

    if (!response.ok || !payload || !("tasks" in payload)) {
      const errorMessage =
        payload && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Failed to import the MPP file.";

      return NextResponse.json({ error: errorMessage }, { status: response.status || 500 });
    }

    const plan = normalizeParsedProject(payload, new Date().toISOString());
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "The MPP parser took too long to respond. Please try again." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to import the MPP file. Please try again in a moment." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
