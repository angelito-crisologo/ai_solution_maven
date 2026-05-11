import { buildInsightsReport } from "./analysis";
import type { Plan } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MODEL_ID = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 250;

const SYSTEM_PROMPT = `You write a 2-3 sentence weekly status paragraph for a project manager to send to stakeholders. The PM will paste a structured snapshot of their plan: project health (RAG), late tasks, at-risk tasks, milestones this week, milestones next week. Reply with one paragraph, ~60 words, plain language, no headings, no bullets, no markdown, no emoji.

Lead with the bottom line: where the project stands. Reference 1–2 specific late or at-risk tasks by name (not by ID). Mention the closest upcoming milestone if there is one. Avoid phrases like "AI-powered", "supercharge", "unleash", "magical". Avoid words that imply you don't have the data ("might be", "could potentially"). Stay factual.

If late and at-risk lists are empty and health is green, say so plainly without padding.`;

type AnthropicResponse = {
  content: Array<{ type: string; text?: string }>;
  stop_reason?: string | null;
};

function buildSnapshot(plan: Plan, asOf: Date) {
  const report = buildInsightsReport(plan);
  // Compute "this week" / "next week" milestone buckets so the narrative
  // can reference them by name. Mirrors the logic in the PDF template.
  const day = asOf.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const thisWeekStart = new Date(asOf);
  thisWeekStart.setDate(asOf.getDate() + diff);
  thisWeekStart.setHours(0, 0, 0, 0);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(thisWeekStart.getDate() + 7);
  const nextWeekEnd = new Date(thisWeekStart);
  nextWeekEnd.setDate(thisWeekStart.getDate() + 14);

  const inRange = (iso: string | null, from: Date, to: Date) => {
    if (!iso) return false;
    const t = Date.parse(iso);
    return Number.isFinite(t) && t >= from.getTime() && t < to.getTime();
  };

  const milestonesThisWeek = plan.tasks
    .filter((task) => task.milestone && inRange(task.finish, thisWeekStart, nextWeekStart))
    .map((task) => ({ id: task.id, name: task.name, finish: task.finish }))
    .slice(0, 4);

  const milestonesNextWeek = plan.tasks
    .filter((task) => task.milestone && inRange(task.finish, nextWeekStart, nextWeekEnd))
    .map((task) => ({ id: task.id, name: task.name, finish: task.finish }))
    .slice(0, 4);

  const lateTasks = report.insights.lateTasks
    .slice(0, 5)
    .map((task) => ({ id: task.id, name: task.name, daysLate: task.daysLate }));

  const atRiskTasks = report.insights.atRiskTasks
    .slice(0, 5)
    .map((task) => ({ id: task.id, name: task.name, finish: task.finish }));

  return {
    planTitle: plan.title,
    asOf: asOf.toISOString(),
    health: report.summary.healthStatus,
    counts: {
      total: report.summary.totalTasks,
      completed: report.summary.completedTasks,
      late: report.summary.lateTasks,
      atRisk: report.summary.atRiskTasks,
      critical: report.summary.criticalTasks
    },
    lateTasks,
    atRiskTasks,
    milestonesThisWeek,
    milestonesNextWeek
  };
}

/**
 * Generate a 2–3 sentence weekly narrative for the PDF snapshot. Returns
 * null when ANTHROPIC_API_KEY is missing or the call fails — the PDF
 * still renders, just without the narrative paragraph at the top.
 */
export async function generateWeeklyNarrative(
  plan: Plan,
  asOf: Date = new Date()
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const requestBody = {
      model: MODEL_ID,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }
        }
      ],
      messages: [
        {
          role: "user",
          content: JSON.stringify(buildSnapshot(plan, asOf), null, 2)
        }
      ]
    };

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
        "content-type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) return null;

    const data = (await response.json()) as AnthropicResponse;
    const textBlock = data.content.find(
      (block): block is { type: string; text: string } =>
        block.type === "text" && typeof block.text === "string"
    );
    return textBlock?.text.trim() || null;
  } catch {
    return null;
  }
}
