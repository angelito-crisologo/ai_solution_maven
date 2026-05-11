import type { Plan, PlanTask } from "./types";
import type { PlanInsightsReport } from "./analysis";
import { buildInsightsReport } from "./analysis";
import { extractTokenUsage, type TokenUsage } from "./ai-usage/cost";
import { buildAIPayload } from "./ai-payload/build-ai-payload";
import { estimatePayloadTokens } from "./ai-payload/token-estimate";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MODEL_ID = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 800;
const TOP_N_PER_CATEGORY = 8;

type PayloadVersion = "v1" | "v2";

/**
 * Resolve the AI payload version per-request from env.
 *
 * - unset / "v2" / anything else → v2 (the bounded, curated payload built by
 *   buildAIPayload — see AI_PAYLOAD_IMPLEMENTATION_BRIEF.md).
 * - "v1" → fall back to the legacy compressInsightsForPrompt path. Kept as
 *   an emergency rollback lever; the goal is to remove v1 entirely once v2
 *   has run on real traffic for ~2 weeks without quality complaints.
 *
 * Read per-request so flipping the Vercel env var doesn't require a redeploy.
 */
function resolvePayloadVersion(): PayloadVersion {
  const raw = (process.env.AI_PAYLOAD_VERSION ?? "").toLowerCase().trim();
  return raw === "v1" ? "v1" : "v2";
}

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

// v2 prompts — used when the bounded AIPayload is sent. Wording is close to v1
// so output style stays consistent, with the only meaningful change being that
// they reference the new payload sections (criticalTasks, lateTasks,
// milestones, upcoming, structure, resources) by name.

const FINDINGS_SYSTEM_PROMPT_V2 = `You are a senior project management analyst. The user \
gives you a structured project plan payload (its schema is described in the schema header \
above). The numbers in the payload are authoritative.

Your job is to produce two outputs:

- SUMMARY (2-3 sentences): past/present-tense observation of the project's state. \
Mention the meta.ragStatus (green/amber/red) and the top 1-2 findings drawn from the \
sections (health counts, criticalTasks, lateTasks, atRiskTasks, milestones, bottlenecks, \
upcoming, resources). No imperatives, no "must"/"should"/"needs to". Do not start with \
"This project".

- RISKS (0-5): the most important threats to delivery. Each risk is descriptive — what \
is at stake / what could go wrong. Reference specific task IDs when applicable; you may \
reference any ID that appears in the included task entries OR in referencedTaskIds. \
Skip if the plan is genuinely healthy.

When meta.mode is "approximate", note that dependencies were not provided and the \
critical-path findings are heuristic — frame language accordingly.

Submit using the submit_findings tool.`;

const RECOMMENDATIONS_SYSTEM_PROMPT_V2 = `You are a senior project management analyst. \
The user gives you (1) a project plan payload (schema described in the schema header \
above), (2) a SUMMARY of the plan's state, and (3) a list of RISKS already identified.

Your ONLY job: produce 1-5 prescriptive RECOMMENDATIONS — concrete next actions the PM \
must execute. You are not summarizing or describing; you are prescribing.

For EACH risk in the input, write at least one recommendation that addresses it. If \
there are no risks, write at least one forward-looking action (e.g., "Confirm milestone \
X is still on track at next standup").

Each recommendation has two fields:
- action: Imperative starting with a verb (Reassign, Reschedule, Confirm, Update, \
Convene, Review, Escalate, Reduce, Re-baseline, Delegate, Validate, etc.).
- rationale: 1-2 sentences explaining why this action matters for this specific plan, \
referencing concrete tasks/dates/numbers from the payload.

EXAMPLE for a risk "Scope tasks (1, 6) are unassigned and 2100 days overdue, blocking \
the critical path":

{
  "action": "Assign owners to tasks 1 and 6 by end of week",
  "rationale": "Both tasks are unassigned and gate the entire critical path. Until they \
have owners, no scope work can resume and the project cannot move forward."
}

Submit using the submit_recommendations tool. The recommendations array MUST contain at \
least 1 entry — there is no situation where zero recommendations is correct output.`;

/**
 * v2 payload schema header. Static across all requests — placed in its own
 * cache_control block so Anthropic's ephemeral cache discount applies to it
 * the same way it applies to the system prompt. Variable plan content stays
 * in the user message (uncached).
 *
 * Describing the shape here rather than re-deriving it from runtime payload
 * inspection means Claude doesn't have to discover field semantics from the
 * data — it already knows what each section means and can reference flags,
 * sort orders, and referencedTaskIds intelligently.
 */
const PAYLOAD_SCHEMA_HEADER = `The user message contains a project plan summary as \
compact JSON. The shape is stable across requests:

- meta: { title, startDate, finishDate, totalTasks, percentComplete, ragStatus \
("green"|"amber"|"red"), criticalPathDurationDays, mode ("cpm"|"approximate") }
- health: { lateCount, atRiskCount, criticalCount, laggingCount, bottleneckCount, \
riskSummary (one-line) }
- criticalTasks: up to 20 tasks. In "cpm" mode these are zero-slack tasks on the \
critical path (sorted: longest first). In "approximate" mode these are tasks closest \
to project end with the highest schedule impact (sorted: nearest-to-end first).
- lateTasks: up to 20 tasks past their finish date and not 100% complete \
(sorted: most overdue first).
- atRiskTasks: up to 20 tasks due in the next 14 days, not yet complete \
(sorted: soonest due first).
- milestones: up to 15 milestone tasks (critical-flagged first, then by finish date).
- bottlenecks: up to 10 tasks blocking 2+ downstream tasks (sorted: most-blocking first).
- upcoming: up to 30 tasks with start or finish in the next 30 days \
(sorted: earliest date first).
- structure: up to 50 WBS summary nodes at outline levels 1-3, each with leafTaskCount.
- resources: up to 10 resources sorted by taskCount desc. The "overallocated" flag is \
true when the resource is assigned to 2+ currently-active tasks.
- referencedTaskIds: every distinct task ID surfaced as a predecessor across the \
included tasks. Use this when describing dependencies — you can name an ID even if the \
task itself isn't in the included sections.

Each task entry carries: id, name, start, finish, durationDays, percentComplete, \
flags { critical, late, atRisk, milestone, bottleneck }, predecessorIds (up to 5 \
most-relevant predecessor IDs).

Trust the numbers in the payload — they were computed by a deterministic engine. Your \
job is narrative and judgment, not data crunching.`;

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
  messages: ClaudeMessage[],
  /**
   * Optional second cached block placed after the system prompt. v2 puts the
   * AIPayload schema header here so it benefits from the same ephemeral-cache
   * 90% discount as the system prompt, while the variable plan content stays
   * in the (uncached) user message.
   */
  cachedSchemaHeader?: string
): Promise<AnthropicMessageResponse> {
  type SystemBlock = {
    type: "text";
    text: string;
    cache_control?: { type: "ephemeral" };
  };

  const systemBlocks: SystemBlock[] = [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" }
    }
  ];
  if (cachedSchemaHeader) {
    systemBlocks.push({
      type: "text",
      text: cachedSchemaHeader,
      cache_control: { type: "ephemeral" }
    });
  }

  const requestBody = {
    model: MODEL_ID,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemBlocks,
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
 * Cost: ~2x Haiku per generation. Content-hash cache means each plan pays this
 * only once.
 *
 * Dispatches on AI_PAYLOAD_VERSION env (default "v2"):
 * - v2: bounded AIPayload via buildAIPayload — sections include milestones,
 *   upcoming, structure, resources; cost+latency are flat across plan sizes.
 * - v1: legacy compressInsightsForPrompt path. Kept as emergency rollback.
 */
export async function generateAiAnalysis(plan: Plan): Promise<AiAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const insights = buildInsightsReport(plan);
  const version = resolvePayloadVersion();
  console.log(`[ai-analysis] payload version: ${version}`);

  if (version === "v1") {
    return generateAiAnalysisV1(plan, insights, apiKey);
  }
  return generateAiAnalysisV2(plan, insights, apiKey);
}

async function generateAiAnalysisV1(
  plan: Plan,
  insights: PlanInsightsReport,
  apiKey: string
): Promise<AiAnalysisResult> {
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

  return assembleResult(findings.summary, findings.risks, recommendations, findingsData, recsData);
}

async function generateAiAnalysisV2(
  plan: Plan,
  insights: PlanInsightsReport,
  apiKey: string
): Promise<AiAnalysisResult> {
  const payload = buildAIPayload(plan, insights);

  // Dev-mode budget check: surface if a real plan ever pushes near the 10k
  // ceiling so we know to tighten per-section caps before it bites in prod.
  if (process.env.NODE_ENV !== "production") {
    const estimated = estimatePayloadTokens(payload);
    if (estimated > 9_000) {
      console.warn(
        `[ai-payload] near token ceiling: ~${estimated} tokens for plan "${plan.title}" (${plan.tasks.length} tasks)`
      );
    }
  }

  // Compact JSON for the user message — pretty-printing adds 30-40% to the
  // serialized length with no benefit for the model.
  const payloadJson = JSON.stringify(payload);

  // --- Call 1: summary + risks ---
  const findingsData = await callClaude(
    apiKey,
    FINDINGS_SYSTEM_PROMPT_V2,
    FINDINGS_TOOL,
    [
      {
        role: "user",
        content: `Project plan payload (JSON):\n\n${payloadJson}\n\nProduce the findings (summary + risks).`
      }
    ],
    PAYLOAD_SCHEMA_HEADER
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
  // Per the brief: the recommendations call gets the same bounded payload
  // (so it can reference specific tasks) plus the findings from call 1.
  const recsContext = JSON.stringify(
    {
      payload,
      summary: findings.summary,
      risks: findings.risks
    }
  );

  const recsData = await callClaude(
    apiKey,
    RECOMMENDATIONS_SYSTEM_PROMPT_V2,
    RECOMMENDATIONS_TOOL,
    [
      {
        role: "user",
        content: `Plan payload + findings (JSON):\n\n${recsContext}\n\nProduce 1-5 prescriptive RECOMMENDATIONS the PM should execute next.`
      }
    ],
    PAYLOAD_SCHEMA_HEADER
  );

  const recsInput = extractToolUseInput(recsData, "submit_recommendations");
  const recommendations = normalizeRecommendations(recsInput);

  if (recommendations.length === 0) {
    console.warn(
      "[ai-analysis] recommendations call returned 0 items; preview:",
      ((JSON.stringify(recsInput) ?? "") as string).slice(0, 400)
    );
  }

  return assembleResult(findings.summary, findings.risks, recommendations, findingsData, recsData);
}

function assembleResult(
  summary: string,
  risks: AiAnalysisRisk[],
  recommendations: AiAnalysisRecommendation[],
  findingsData: AnthropicMessageResponse,
  recsData: AnthropicMessageResponse
): AiAnalysisResult {
  const findingsUsage = extractTokenUsage(findingsData.usage);
  const recsUsage = extractTokenUsage(recsData.usage);

  return {
    analysis: {
      summary,
      risks,
      recommendations,
      generatedAt: new Date().toISOString()
    },
    usage: {
      inputTokens: findingsUsage.inputTokens + recsUsage.inputTokens,
      outputTokens: findingsUsage.outputTokens + recsUsage.outputTokens,
      cacheReadTokens: findingsUsage.cacheReadTokens + recsUsage.cacheReadTokens,
      cacheWriteTokens: findingsUsage.cacheWriteTokens + recsUsage.cacheWriteTokens
    }
  };
}
