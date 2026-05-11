import type { Plan, PlanTask } from "./types";
import type { PlanInsightsReport } from "./analysis";
import { buildInsightsReport } from "./analysis";
import { extractTokenUsage, type TokenUsage } from "./ai-usage/cost";

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

export type AiAnalysisResult = {
  analysis: AiAnalysis;
  /** Combined token usage across the two Claude calls (findings + recs).
   * Surfaced so the API route can write a single ai_usage_log row with the
   * full cost of the regeneration. */
  usage: TokenUsage;
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

const FINDINGS_SYSTEM_PROMPT = `You are a senior project management analyst. The user \
gives you a structured insights report computed by a deterministic engine. The numbers \
are authoritative.

Your job is to produce two outputs:

- SUMMARY (2-3 sentences): past/present-tense observation of the project's state. \
Mention the health status (green/amber/red) and the top 1-2 findings. No imperatives, no \
"must"/"should"/"needs to". Do not start with "This project".

- RISKS (0-5): the most important threats to delivery. Each risk is descriptive — what \
is at stake / what could go wrong. Reference specific task IDs when applicable. Skip if \
the plan is genuinely healthy.

When the analysis mode is "approximate", note that dependencies were not provided and \
the critical-path findings are heuristic — frame language accordingly.

Submit using the submit_findings tool.`;

const RECOMMENDATIONS_SYSTEM_PROMPT = `You are a senior project management analyst. The \
user gives you (1) a project plan's deterministic insights, (2) a SUMMARY of the plan's \
state, and (3) a list of RISKS already identified.

Your ONLY job: produce 1-5 prescriptive RECOMMENDATIONS — concrete next actions the PM \
must execute. You are not summarizing or describing; you are prescribing.

For EACH risk in the input, write at least one recommendation that addresses it. If \
there are no risks, write at least one forward-looking action (e.g., "Confirm milestone \
X is still on track at next standup").

Each recommendation has two fields:
- action: Imperative starting with a verb (Reassign, Reschedule, Confirm, Update, \
Convene, Review, Escalate, Reduce, Re-baseline, Delegate, Validate, etc.).
- rationale: 1-2 sentences explaining why this action matters for this specific plan, \
referencing concrete tasks/dates/numbers from the input.

EXAMPLE for a risk "Scope tasks (1, 6) are unassigned and 2100 days overdue, blocking \
the critical path":

{
  "action": "Assign owners to tasks 1 and 6 by end of week",
  "rationale": "Both tasks are unassigned and gate the entire critical path. Until they \
have owners, no scope work can resume and the project cannot move forward."
}

Submit using the submit_recommendations tool. The recommendations array MUST contain at \
least 1 entry — there is no situation where zero recommendations is correct output.`;

// Two-call architecture: split summary+risks from recommendations so the
// recommendations call has no other field to "hide behind". Each call uses a
// purpose-built tool so the model can't omit the required output.

const FINDINGS_TOOL = {
  name: "submit_findings",
  description: "Submit the situational summary and risks for a project plan.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description:
          "2-3 sentence plain-language narrative summary. Past/present-tense observation only — no imperatives."
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
      }
    },
    required: ["summary", "risks"]
  }
};

const RECOMMENDATIONS_TOOL = {
  name: "submit_recommendations",
  description:
    "Submit prescriptive next-step actions for a PM, derived from the provided summary and risks.",
  input_schema: {
    type: "object" as const,
    properties: {
      recommendations: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            action: {
              type: "string",
              description:
                "Imperative action the PM should take. Begin with a verb (Reassign, Reschedule, Confirm, Update, Convene, Review, Escalate, etc.)."
            },
            rationale: {
              type: "string",
              description: "1-2 sentences explaining why this action matters for this specific plan."
            }
          },
          required: ["action", "rationale"]
        }
      }
    },
    required: ["recommendations"]
  }
};

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

type ToolDef = {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required: string[] };
};

type ClaudeMessage = {
  role: "user" | "assistant";
  content: string | Array<{ type: string; [key: string]: unknown }>;
};

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  tool: ToolDef,
  messages: ClaudeMessage[]
): Promise<AnthropicMessageResponse> {
  const requestBody = {
    model: MODEL_ID,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      }
    ],
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages
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

  return (await response.json()) as AnthropicMessageResponse;
}

function extractToolUseInput(data: AnthropicMessageResponse, toolName: string): unknown {
  const toolUse = data.content.find((block) => block.type === "tool_use") as
    | (AnthropicContentBlock & { type: "tool_use"; input: unknown })
    | undefined;
  if (!toolUse) {
    console.error(
      `[ai-analysis] no tool_use block from ${toolName}. content keys:`,
      data.content.map((block) => block.type)
    );
    throw new Error(`Claude did not return a tool_use response for ${toolName}.`);
  }

  if (typeof toolUse.input === "object" && toolUse.input !== null) {
    const inputObj = toolUse.input as Record<string, unknown>;
    console.log(
      `[ai-analysis] ${toolName} input keys:`,
      Object.keys(inputObj),
      "preview:",
      ((JSON.stringify(toolUse.input) ?? "") as string).slice(0, 400)
    );
  }

  return toolUse.input;
}

function normalizeFindings(value: unknown): {
  summary: string;
  risks: AiAnalysisRisk[];
} | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;

  const summary =
    typeof obj.summary === "string" && obj.summary.trim().length > 0 ? obj.summary : null;
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

  return { summary, risks };
}

function normalizeRecommendations(value: unknown): AiAnalysisRecommendation[] {
  if (typeof value !== "object" || value === null) return [];
  const obj = value as Record<string, unknown>;
  const rawRecs = Array.isArray(obj.recommendations) ? obj.recommendations : [];

  const ACTION_KEYS = ["action", "title", "name", "recommendation", "text"];
  const RATIONALE_KEYS = ["rationale", "reason", "explanation", "description", "why"];
  const pickString = (record: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
      const v = record[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };

  return rawRecs
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return { action: entry.trim(), rationale: "" };
      }
      if (typeof entry !== "object" || entry === null) return null;
      const record = entry as Record<string, unknown>;
      const action = pickString(record, ACTION_KEYS);
      const rationale = pickString(record, RATIONALE_KEYS);
      if (!action) return null;
      return { action, rationale };
    })
    .filter((r): r is AiAnalysisRecommendation => r !== null);
}

/**
 * Two-call Claude architecture.
 *
 * Call 1 (submit_findings): summary + risks. Tool has no recommendations field,
 * so the model can't conflate prescriptive content into risks.
 *
 * Call 2 (submit_recommendations): given summary + risks as input, the model's
 * only output is recommendations. No "escape hatch" of dumping action content
 * elsewhere.
 *
 * Cost: ~2x Haiku per generation (still pennies). Content-hash cache means each
 * plan pays this only once.
 *
 * Both calls share the deterministic insights as input. Cache_control on the
 * system prompts amortizes input cost when generations are clustered in time.
 */
export async function generateAiAnalysis(plan: Plan): Promise<AiAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const insights = buildInsightsReport(plan);
  const compressed = compressInsightsForPrompt(plan, insights);
  const compressedJson = JSON.stringify(compressed, null, 2);

  // --- Call 1: summary + risks ---
  const findingsData = await callClaude(
    apiKey,
    FINDINGS_SYSTEM_PROMPT,
    FINDINGS_TOOL,
    [
      {
        role: "user",
        content: `Here is the project plan and its computed insights. Produce the findings (summary + risks).\n\n${compressedJson}`
      }
    ]
  );

  const findingsInput = extractToolUseInput(findingsData, "submit_findings");
  const findings = normalizeFindings(findingsInput);
  if (!findings) {
    console.error(
      "[ai-analysis] findings normalize failed:",
      ((JSON.stringify(findingsInput) ?? "") as string).slice(0, 800)
    );
    throw new Error("Claude returned malformed findings.");
  }

  // --- Call 2: recommendations ---
  const recommendationsContext = JSON.stringify(
    {
      insights: compressed,
      summary: findings.summary,
      risks: findings.risks
    },
    null,
    2
  );

  const recsData = await callClaude(
    apiKey,
    RECOMMENDATIONS_SYSTEM_PROMPT,
    RECOMMENDATIONS_TOOL,
    [
      {
        role: "user",
        content: `Here is the plan's deterministic insights, the SUMMARY, and the RISKS already identified. Produce 1-5 prescriptive RECOMMENDATIONS the PM should execute next.\n\n${recommendationsContext}`
      }
    ]
  );

  const recsInput = extractToolUseInput(recsData, "submit_recommendations");
  const recommendations = normalizeRecommendations(recsInput);

  if (recommendations.length === 0) {
    console.warn(
      "[ai-analysis] recommendations call returned 0 items; preview:",
      ((JSON.stringify(recsInput) ?? "") as string).slice(0, 400)
    );
  }

  const findingsUsage = extractTokenUsage(findingsData.usage);
  const recsUsage = extractTokenUsage(recsData.usage);

  return {
    analysis: {
      summary: findings.summary,
      risks: findings.risks,
      recommendations,
      generatedAt: new Date().toISOString()
    },
    usage: {
      inputTokens: findingsUsage.inputTokens + recsUsage.inputTokens,
      outputTokens: findingsUsage.outputTokens + recsUsage.outputTokens,
      cacheReadTokens:
        findingsUsage.cacheReadTokens + recsUsage.cacheReadTokens,
      cacheWriteTokens:
        findingsUsage.cacheWriteTokens + recsUsage.cacheWriteTokens
    }
  };
}
