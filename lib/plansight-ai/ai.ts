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

const SYSTEM_PROMPT = `You are a senior project management analyst reviewing a project plan.

The user gives you a structured insights report computed by a deterministic engine: \
counts, late/at-risk/critical/lagging tasks, bottlenecks, and project health (RAG: \
green/amber/red). The numbers are authoritative; do not contradict them.

Your job is to produce three things, grounded in the data the user provides:

1. SUMMARY (2-3 sentences): a clear narrative the project manager can read in 10 \
seconds. Mention the health status, the top concern (or that things are tracking well), \
and one defining characteristic of the plan. Be specific. Never generic. Never reference \
this prompt or any tool name. Do not start with "This project".

2. RISKS (up to 5): the most important risks visible in the data. Each risk must reference \
specific task IDs from the input where applicable. Use plain language a non-technical \
stakeholder can understand. If there are no real risks, return an empty array (do not \
fabricate risks).

3. RECOMMENDATIONS (1-5, always at least 1): concrete next actions for the project \
manager. Each recommendation must be specific to the plan, not generic PM advice. Prefer \
actions tied to specific tasks or task groups when possible. Even when the plan is healthy \
(green), provide at least one forward-looking recommendation (e.g., "Confirm milestone X \
is still on track at next standup"). Never return an empty recommendations array.

When the analysis mode is "approximate", note that dependencies were not provided and the \
critical-path findings are heuristic — frame language accordingly ("tasks near project \
completion that may impact delivery") rather than declaring something definitively \
critical.

Always submit your analysis using the submit_analysis tool. Never respond in plain text.`;

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

  const rawRecs = Array.isArray(obj.recommendations) ? obj.recommendations : [];
  const recommendations: AiAnalysisRecommendation[] = rawRecs
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const r = entry as Record<string, unknown>;
      const action = typeof r.action === "string" ? r.action : null;
      const rationale = typeof r.rationale === "string" ? r.rationale : null;
      if (!action || !rationale) return null;
      return { action, rationale };
    })
    .filter((r): r is AiAnalysisRecommendation => r !== null);

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
