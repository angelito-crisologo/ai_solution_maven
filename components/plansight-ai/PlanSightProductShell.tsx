"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { analyzePlan, summarizePlan } from "@/lib/plansight-ai/analysis";
import { demoPlan } from "@/lib/plansight-ai/demo";
import { createSharePayload } from "@/lib/plansight-ai/share";
import type { Plan } from "@/lib/plansight-ai/types";
import { PlanSightWorkspace } from "./PlanSightWorkspace";

export function PlanSightProductShell() {
  const [plan, setPlan] = useState<Plan>(demoPlan);
  const [status, setStatus] = useState<string>("Ready to import an MPP plan.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const metrics = useMemo(() => summarizePlan(plan), [plan]);
  const insights = useMemo(() => analyzePlan(plan), [plan]);
  const share = useMemo(() => createSharePayload(plan), [plan]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus("Choose an .mpp file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsSubmitting(true);
    setStatus(`Importing ${selectedFile.name}...`);

    try {
      const response = await fetch("/api/plansight/import-mpp", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as
        | { plan: Plan }
        | { error?: string };

      if (!response.ok || !("plan" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "Failed to import the MPP file.");
      }

      setPlan(payload.plan);
      setStatus(`Imported ${selectedFile.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to import the MPP file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="px-6 py-10">
        <div className="mx-auto max-w-[1200px] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Import MPP
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-dark">
                Upload a Microsoft Project file
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                This version supports `.mpp` files only. The file is parsed into the PlanSight
                schema, then rendered as an analyzed plan with a stakeholder share view.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:min-w-[420px]">
              <input
                type="file"
                accept=".mpp"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-dark file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isSubmitting ? "Importing..." : "Import MPP"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-sm text-slate-500">{status}</p>
        </div>
      </section>

      <PlanSightWorkspace plan={plan} metrics={metrics} insights={insights} share={share} />
    </>
  );
}
