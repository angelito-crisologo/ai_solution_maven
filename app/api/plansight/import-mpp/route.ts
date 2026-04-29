import { NextResponse } from "next/server";
import {
  normalizeParsedProject,
  type ParsedProject
} from "@/lib/plansight-ai/adapters/mpp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parserServiceUrl = process.env.PLANSIGHT_IMPORT_SERVICE_URL;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file was uploaded. Expected field name: file." },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".mpp")) {
    return NextResponse.json(
      { error: "Invalid file type. Please upload a .mpp file." },
      { status: 400 }
    );
  }

  if (!parserServiceUrl) {
    return NextResponse.json(
      {
        error:
          "PLANSIGHT_IMPORT_SERVICE_URL is not configured. The MPP parser now runs in a separate service."
      },
      { status: 503 }
    );
  }

  try {
    const parserFormData = new FormData();
    parserFormData.append("file", file);

    const response = await fetch(`${parserServiceUrl.replace(/\/$/, "")}/api/parse`, {
      method: "POST",
      body: parserFormData
    });

    const payload = (await response.json()) as ParsedProject & { error?: string };

    if (!response.ok || !("tasks" in payload)) {
      return NextResponse.json(
        {
          error:
            "error" in payload && payload.error
              ? payload.error
              : "Failed to import the MPP file."
        },
        { status: response.status || 500 }
      );
    }

    const plan = normalizeParsedProject(payload, new Date().toISOString());
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import the MPP file."
      },
      { status: 500 }
    );
  }
}
