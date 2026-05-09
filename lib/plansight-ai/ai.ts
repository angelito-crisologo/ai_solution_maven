import type { Plan, PlanTask } from "./types";
import type { PlanInsightsReport } from "./analysis";
import { buildInsightsReport } from "./analysis";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MODEL_ID = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 800;
const TOP_N_PER_CATEGORY = 8;

export type AiAnalysisRisk = {
  title: string;
  explanation: string;
  taskIds: number[];
};

export type AiAnalysisRecommendation = {
  action: string;
  rationale: string;
};

export type AiAnalysis = {
  summary: string;
  risks: AiAnalysisRisk[];
  recommendations: AiAnalysisRecommendation[];
  generatedAt: string;
};

/**
 * SHA-256 over a canonical subset of plan content. Stable across re-imports
 * of identical content. If this matches the cached `ai_analysis_content_hash`
 * on the plan row, the cached AI analysis is still valid.
 *
 * Excludes plan.id, plan.importedAt, and any timestamp/identity fields that
 * would otherwise change between identical re-imports.
 */
export async function computePlanContentHash(plan: Plan): Promise<string> {
  const canonical = JSON.stringify({
    title: plan.title,
    startDate: plan.startDate,
    finishDate: plan.finishDate,
    tasks: [...plan.tasks]
      .sort((a, b) => a.id - b.id)
      .map((task) => ({
        id: task.id,
        parentId: task.parentId,
        name: task.name,
        outlineLevel: task.outlineLevel,
        outlineNumber: task.outlineNumber,
        start: task.start,
        finish: task.finish,
        duration: task.duration,
        percentComplete: task.percentComplete,
        summary: task.summary,
        milestone: task.milestone,
        predecessors: task.predecessors,
        resourceNames: task.resourceNames,
        notes: task.notes
      }))
  });

  const bytes = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function compressInsightsForPrompt(plan: Plan, insights: PlanInsightsReport) {
  const taskById = new Map(plan.tasks.map((task) => [task.id, task] as const));

  const formatTask = (task: { id: number; name: string }) => ({
    id: task.id,
    name: task.name
  });

  const lateTasks = insights.insights.lateTasks.slice(0, TOP_N_PER_CATEGORY).map((task) => ({
    ...formatTask(task),
    daysLate: task.daysLate,
    finish: task.finish,
    assignee: task.assignee
  }));

  const atRiskTasks = insights.insights.atRiskTasks
    .slice(0, TOP_N_PER_CATEGORY)
    .map((task) => ({
      ...formatTask(task),
      daysRemaining: task.daysRemaining,
      finish: task.finish,
      progress: task.progress,
      assignee: task.assignee
    }));

  const criticalSource = insights.mode === "approximate"
    ? insights.insights.potentialCriticalTasks
    : insights.insights.criticalTasks;
  const criticalTasks = criticalSource.slice(0, TOP_N_PER_CATEGORY).map((task) => ({
    ...formatTask(task),
    start: task.start,
    finish: task.finish,
    assignee: task.assignee
  }));

  const laggingTasks = insights.insights.laggingTasks
    .slice(0, TOP_N_PER_CATEGORY)
    .map((task) => ({
      ...formatTask(task),
      expectedProgress: task.expectedProgress,
      actualProgress: task.progress,
      gap: task.gap
    }));

  const bottlenecks = insights.insights.bottlenecks.slice(0, TOP_N_PER_CATEGORY).map((task) => ({
    ...formatTask(task),
    dependentTaskCount: task.dependentTaskCount
  }));

  return {
    title: plan.title,
    startDate: plan.startDate,
    finishDate: plan.finishDate,
    mode: insights.mode,
    summary: insights.summary,
    lateTasks,
    atRiskTasks,
    criticalTasks,
    laggingTasks,
    bottlenecks,
    totalPlanTasks: plan.tasks.length,
    summaryTaskCount: plan.tasks.filter((t: PlanTask) => t.summary).length,
    milestoneCount: plan.tasks.filter((t: PlanTask) => t.milestone).length,
    leafTaskCount: insights.summary.totalTasks
  };
}

const SYSTEM_PROMPT = `You are a senior project management analyst. The user gives you a \
structured insights report computed by a deterministic engine. The numbers are \
authoritative.

Produce a coherent three-part analysis: SUMMARY, RISKS, RECOMMENDATIONS. They reinforce \
each other — every problem the summary identifies must be addressed by at least one \
recommendation.

WORK IN THIS ORDER:

Step 1 — Identify the 2-4 most important findings from the data (e.g., "all tasks late", \
"foundational tasks blocking downstream work", "critical path is heavily gated"). Hold \
this list in mind for the rest of the analysis.

Step 2 — SUMMARY (2-3 sentences). State what IS the case for each finding from Step 1. \
Use past/present-tense observation: "All 74 tasks are overdue", "53 tasks sit on the \
critical path", "Eight foundational tasks block downstream work". Mention the health \
status (green/amber/red). Do not start with "This project".

Step 3 — RISKS (0-5 items). For each finding from Step 1 that represents a threat to \
delivery, write one risk entry with a title, an explanation in plain language, and the \
specific task IDs it references. Skip if the plan is genuinely healthy.

Step 4 — RECOMMENDATIONS (1-5 items, REQUIRED at least 1). For EACH finding from Step 1, \
write at least one matching recommendation. The recommendation specifies the action the PM \
should take to address that finding. Each recommendation has an "action" field (the \
imperative — what to do) and a "rationale" field (why it matters for this plan). Prefer \
actions tied to specific tasks or task groups. If the plan is healthy, write at least one \
forward-looking action (e.g., "Confirm milestone X at next standup").

Mapping requirement: if your SUMMARY mentions "foundational tasks blocking downstream \
work", your RECOMMENDATIONS must include an action addressing those foundational tasks. \
If the SUMMARY mentions "schedule has slipped", your RECOMMENDATIONS must include a \
rescheduling action. Never describe a problem in the summary without prescribing a \
response to it in recommendations.

When the analysis mode is "approximate", note that dependencies were not provided and the \
critical-path findings are heuristic — frame language accordingly ("tasks near project \
completion that may impact delivery") rather than declaring something definitively \
critical.

Submit your analysis using the submit_analysis tool. The recommendations array MUST contain \
at least one item.`;

const ANALYSIS_TOOL = {
  name: "submit_analysis",
  description: "Submit the structured plan analysis.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description: "2-3 sentence plain-language narrative summary."
      },
      risks: {
        type: "array",
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short risk label (4-8 words)." },
            explanation: {
              type: "string",
              description: "1-2 sentences explaining the risk in plain language."
            },
            taskIds: {
              type: "array",
              items: { type: "number" },
              description: "Task IDs from the input that this risk references."
            }
          },
          required: ["title", "explanation", "taskIds"]
        }
      },
      recommendations: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            action: { type: "string", description: "What the PM should do." },
            rationale: { type: "string", description: "Why this matters for this plan." }
          },
          required: ["action", "rationale"]
        }
      }
    },
    required: ["summary", "risks", "recommendations"]
  }
};

/**
 * Normalize Claude's tool_use input into our AiAnalysis shape. Tolerant of
 * minor schema deviations: missing/null risks or recommendations become empty
 * arrays. Returns null only if the response is genuinely unusable (no summary).
 */
function normalizeAiAnalysisInput(
  value: unknown
): Omit<AiAnalysis, "generatedAt"> | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;

  const summary = typeof obj.summary === "string" && obj.summary.trim().length > 0
    ? obj.summary
    : null;
  if (!summary) return null;

  const rawRisks = Array.isArray(obj.risks) ? obj.risks : [];
  const risks: AiAnalysisRisk[] = rawRisks
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const r = entry as Record<string, unknown>;
      const title = typeof r.title === "string" ? r.title : null;
      const explanation = typeof r.explanation === "string" ? r.explanation : null;
      if (!title || !explanation) return null;
      const taskIds = Array.isArray(r.taskIds)
        ? r.taskIds.filter((id): id is number => typeof id === "number")
        : [];
      return { title, explanation, taskIds };
    })
    .filter((r): r is AiAnalysisRisk => r !== null);

  // Tolerant recommendation parser. Accepts:
  //  - { action, rationale } (preferred shape per schema)
  //  - alternative field names: title/name/recommendation, reason/explanation/description/why
  //  - bare strings (entire entry is treated as the action)
  // Falls back to "Recommendation N" if the action is missing entirely.
  const rawRecs = Array.isArray(obj.recommendations) ? obj.recommendations : [];
  const droppedRecs: unknown[] = [];
  const ACTION_KEYS = ["action", "title", "name", "recommendation", "text"];
  const RATIONALE_KEYS = ["rationale", "reason", "explanation", "description", "why"];

  const pickString = (record: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  const recommendations: AiAnalysisRecommendation[] = rawRecs
    .map((entry, index) => {
      if (typeof entry === "string" && entry.trim()) {
        return { action: entry.trim(), rationale: "" };
      }
      if (typeof entry !== "object" || entry === null) {
        droppedRecs.push(entry);
        return null;
      }

      const record = entry as Record<string, unknown>;
      const action = pickString(record, ACTION_KEYS);
      const rationale = pickString(record, RATIONALE_KEYS);

      if (!action) {
        droppedRecs.push(entry);
        return null;
      }

      return { action, rationale };
    })
    .filter((r): r is AiAnalysisRecommendation => r !== null);

  if (droppedRecs.length > 0) {
    console.warn(
      "[ai-analysis] dropped malformed recommendation entries:",
      JSON.stringify(droppedRecs).slice(0, 400)
    );
  }

  return { summary, risks, recommendations };
}

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: string; [key: string]: unknown };

type AnthropicMessageResponse = {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string | null;
  usage?: { input_tokens?: number; output_tokens?: number };
};

/**
 * Call Claude Haiku 4.5 to produce an analysis from the deterministic insights.
 *
 * Uses prompt caching on the system prompt (5-min TTL) and the tool_use API
 * for structured JSON output. Compressed insights minimize input tokens.
 *
 * Calls the Anthropic Messages REST API directly via fetch (no SDK) to keep
 * the route Edge-runtime compatible.
 *
 * Throws on missing API key, network failure, or malformed model output.
 */
export async function generateAiAnalysis(plan: Plan): Promise<AiAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const insights = buildInsightsReport(plan);
  const compressed = compressInsightsForPrompt(plan, insights);

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
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: "submit_analysis" },
    messages: [
      {
        role: "user",
        content: `Here is the project plan and its computed insights. Produce the analysis.\n\n${JSON.stringify(compressed, null, 2)}`
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

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Anthropic API returned ${response.status}: ${errorBody.slice(0, 200) || response.statusText}`
    );
  }

  const data = (await response.json()) as AnthropicMessageResponse;

  const toolUse = data.content.find((block) => block.type === "tool_use") as
    | (AnthropicContentBlock & { type: "tool_use"; input: unknown })
    | undefined;
  if (!toolUse) {
    console.error(
      "[ai-analysis] no tool_use block in response. content keys:",
      data.content.map((block) => block.type)
    );
    throw new Error("Claude did not return a tool_use response.");
  }

  // Diagnostic: log the structure Claude returned so we can spot prompt drift.
  // Trimmed to keep log payloads small. Safe to keep in production.
  if (typeof toolUse.input === "object" && toolUse.input !== null) {
    const inputObj = toolUse.input as Record<string, unknown>;
    console.log(
      "[ai-analysis] tool_use input keys:",
      Object.keys(inputObj),
      "recommendations sample:",
      JSON.stringify(inputObj.recommendations).slice(0, 400)
    );
  }

  const normalized = normalizeAiAnalysisInput(toolUse.input);
  if (!normalized) {
    console.error(
      "[ai-analysis] malformed tool_use input:",
      JSON.stringify(toolUse.input).slice(0, 800)
    );
    throw new Error("Claude returned a malformed analysis shape.");
  }

  return {
    ...normalized,
    generatedAt: new Date().toISOString()
  };
}
