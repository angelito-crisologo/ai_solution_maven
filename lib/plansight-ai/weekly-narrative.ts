import { extractTokenUsage, type TokenUsage } from "./ai-usage/cost";
import { formatPeriodLabel } from "./reporting-period";
import type { WeeklyReportData } from "./weekly-report-data";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MODEL_ID = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 300;

export type WeeklyNarrativeResult = {
  text: string | null;
  usage: TokenUsage | null;
};

const SYSTEM_PROMPT = `You write the Status Summary paragraph for a PM's Weekly Status Report. The PM will paste a structured snapshot: reporting period (the week being reviewed), current week (the week we are now in), project health, what slipped last week, what's at risk now, milestones in the reporting period (hit/miss), milestones coming up.

Reply with one paragraph, ~70 words, plain language, no headings, no bullets, no markdown, no emoji.

Two halves:
1. PAST TENSE for the reporting period: lead with where the project stands at end of last week. Reference 1–2 specific slipped or missed-milestone task names. Use "Last week..." or the calendar date range.
2. PRESENT/FUTURE TENSE for what's next: name the most important risk or upcoming milestone to watch this week. Use "This week..." or "Coming up...".

Be factual. Don't invent context the PM didn't give you. Don't use words like "AI-powered", "supercharge", "unleash", "magical", "powered by". Don't pad. If both halves have nothing notable to report and the project is green, say so plainly in two sentences.`;

type AnthropicResponse = {
  content: Array<{ type: string; text?: string }>;
  usage?: unknown;
};

function buildPromptInput(data: WeeklyReportData) {
  return {
    reportingPeriod: {
      label: formatPeriodLabel(data.reportingPeriod),
      start: data.reportingPeriod.start.toISOString().slice(0, 10),
      end: data.reportingPeriod.end.toISOString().slice(0, 10)
    },
    currentWeek: {
      label: formatPeriodLabel(data.currentPeriod),
      start: data.currentPeriod.start.toISOString().slice(0, 10),
      end: data.currentPeriod.end.toISOString().slice(0, 10)
    },
    planTitle: data.plan.title,
    health: data.health,
    counts: data.counts,
    slippedLastWeek: data.slippedTasks.map((task) => ({
      id: task.id,
      name: task.name,
      percentComplete: task.percentComplete,
      finish: task.finish
    })),
    atRiskNow: data.atRiskTasks.map((task) => ({
      id: task.id,
      name: task.name,
      finish: task.finish
    })),
    milestonesLastWeek: data.milestonesInPeriod.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      finish: milestone.finish,
      status: milestone.hit ? "hit" : "missed"
    })),
    milestonesComingUp: data.milestonesUpcoming.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      finish: milestone.finish
    }))
  };
}

/**
 * Generate the Status Summary paragraph for the weekly report. Returns
 * { text: null, usage: null } on any failure — the PDF still renders without
 * it. Usage tokens are surfaced for ai_usage_log accounting.
 */
export async function generateWeeklyNarrative(
  data: WeeklyReportData
): Promise<WeeklyNarrativeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { text: null, usage: null };

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
          content: JSON.stringify(buildPromptInput(data), null, 2)
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

    if (!response.ok) return { text: null, usage: null };
    const json = (await response.json()) as AnthropicResponse;
    const text = json.content.find(
      (block): block is { type: string; text: string } =>
        block.type === "text" && typeof block.text === "string"
    );
    return {
      text: text?.text.trim() || null,
      usage: extractTokenUsage(json.usage)
    };
  } catch {
    return { text: null, usage: null };
  }
}
