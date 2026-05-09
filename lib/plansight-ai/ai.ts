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

You produce three FIELDS. They are different by construction:

- SUMMARY: 2-3 sentences. Past/present-tense observation. NO actions, no imperatives.
- RISKS: what is at stake / what could go wrong (descriptive). Each entry is a passive \
warning the stakeholder needs to know about.
- RECOMMENDATIONS: what the PM must DO next (prescriptive). Each entry starts with an \
imperative verb (Reassign, Reschedule, Confirm, Update, Schedule, Convene, Review, \
Escalate, etc.). RECOMMENDATIONS is NOT a restatement of RISKS — they sit alongside \
risks, not instead of them.

EXAMPLE OF DIFFERENCE:

For a finding "Scope tasks (1, 6) are unassigned and 2100 days overdue, blocking the \
critical path":

  RISK entry:
    {
      "title": "Critical path is gated by unassigned scope work",
      "explanation": "Tasks 1 and 6 are on the critical path and have no resource owner, \
so scope clarification cannot start without intervention.",
      "taskIds": [1, 6]
    }

  RECOMMENDATION entry (REQUIRED — describes the action, NOT the situation):
    {
      "action": "Assign owners to tasks 1 and 6 by end of week",
      "rationale": "Both tasks are unassigned and gate the entire critical path; until \
they have owners no scope work can resume."
    }

  Notice: the risk states the situation. The recommendation prescribes the action. They \
are NEVER the same content. For every risk, there must be a corresponding recommendation \
that moves the plan forward.

REQUIREMENTS:

1. Generate the SUMMARY with passive observation only — no "must", "should", "needs to".
2. Generate at least 1 RECOMMENDATION for every risk you produce, plus at least 1 \
forward-looking recommendation if there are no risks.
3. recommendations MUST contain at least 1 entry. An empty recommendations array is \
ALWAYS invalid output, even if all problems are already covered in risks. Risks are \
descriptive; recommendations are prescriptive. A risk does not satisfy the requirement \
to provide recommendations.
4. Each recommendation begins its "action" with an imperative verb.

When the analysis mode is "approximate", note that dependencies were not provided and the \
critical-path findings are heuristic — frame language accordingly.

Submit your analysis using the submit_analysis tool.`;

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

  type ClaudeMessage = {
    role: "user" | "assistant";
    content: string | Array<{ type: string; [key: string]: unknown }>;
  };

  const callClaude = async (messages: ClaudeMessage[]) => {
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
  };

  const extractAndNormalize = (data: AnthropicMessageResponse) => {
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

    if (typeof toolUse.input === "object" && toolUse.input !== null) {
      const inputObj = toolUse.input as Record<string, unknown>;
      // JSON.stringify(undefined) returns undefined (not a string), so guard
      // before calling .slice. We log "undefined" / "null" verbatim when the
      // field is missing — that's still useful diagnostic info.
      const recsSample =
        inputObj.recommendations === undefined
          ? "<missing>"
          : (JSON.stringify(inputObj.recommendations) ?? "<unstringifiable>").slice(0, 400);
      console.log(
        "[ai-analysis] tool_use input keys:",
        Object.keys(inputObj),
        "recommendations sample:",
        recsSample
      );
    }

    return { toolUse, normalized: normalizeAiAnalysisInput(toolUse.input) };
  };

  const initialMessages: ClaudeMessage[] = [
    {
      role: "user",
      content: `Here is the project plan and its computed insights. Produce the analysis.\n\n${JSON.stringify(compressed, null, 2)}`
    }
  ];

  let data = await callClaude(initialMessages);
  let { toolUse, normalized } = extractAndNormalize(data);

  // Retry-on-empty-recommendations: if Claude obeyed the schema but returned an
  // empty recommendations array (which the model sometimes does despite minItems:1),
  // send a single corrective turn that explicitly demands recommendations.
  if (normalized && normalized.recommendations.length === 0) {
    console.warn("[ai-analysis] empty recommendations; retrying with corrective turn");

    const retryMessages: ClaudeMessage[] = [
      ...initialMessages,
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: toolUse.id ?? "toolu_initial",
            name: "submit_analysis",
            input: toolUse.input
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id ?? "toolu_initial",
            content:
              "The recommendations array was empty. This is invalid. Re-submit using the submit_analysis tool with the same summary and risks, plus a recommendations array containing at least 1 prescriptive action that starts with an imperative verb (Reassign, Reschedule, Confirm, Update, Convene, etc.). For each risk you returned, include at least one recommendation that addresses it directly."
          } as { type: string; tool_use_id: string; content: string }
        ]
      }
    ];

    data = await callClaude(retryMessages);
    ({ toolUse, normalized } = extractAndNormalize(data));
  }

  if (!normalized) {
    console.error(
      "[ai-analysis] malformed tool_use input:",
      (JSON.stringify(toolUse.input) ?? "<unstringifiable>").slice(0, 800)
    );
    throw new Error("Claude returned a malformed analysis shape.");
  }

  return {
    ...normalized,
    generatedAt: new Date().toISOString()
  };
}
