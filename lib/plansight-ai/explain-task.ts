import type { Plan, PlanTask } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MODEL_ID = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 350;

const SYSTEM_PROMPT = `You are a project-management analyst helping a PM understand one task in their plan. The PM will paste a task plus its immediate dependency neighbourhood (predecessors, successors, parent summary). Reply with a short, plain-language explanation in this exact shape, no headings, no markdown:

1) One sentence on what the task is and why it matters in this plan.
2) One sentence on what depends on it slipping.
3) One sentence on the risk signal — late, at-risk, on-track, completed — based on the data given. Cite the numbers (% complete, dates) inline.

Total length: 3 sentences, ~80 words. No bullets. No emoji. Do not invent context the PM didn't give you. If the data is sparse, say what's missing rather than making something up.`;

type AnthropicResponse = {
  content: Array<{ type: string; text?: string }>;
  stop_reason?: string | null;
};

function pickTaskById(plan: Plan, taskId: number): PlanTask | null {
  return plan.tasks.find((task) => task.id === taskId) ?? null;
}

function summarizeTaskForPrompt(task: PlanTask) {
  return {
    id: task.id,
    name: task.name,
    summary: task.summary,
    milestone: task.milestone,
    start: task.start,
    finish: task.finish,
    duration: task.duration,
    percentComplete: task.percentComplete,
    resourceNames: task.resourceNames
  };
}

function neighbourhoodFor(plan: Plan, focus: PlanTask) {
  // Direct predecessors named on the focus task.
  const predecessorIds = new Set(
    focus.predecessors
      .map((dep) => dep.predecessorTaskId)
      .filter((id): id is number => typeof id === "number")
  );
  const predecessors = plan.tasks
    .filter((task) => predecessorIds.has(task.id))
    .map(summarizeTaskForPrompt);

  // Successors: tasks that name the focus as a predecessor.
  const successors = plan.tasks
    .filter((task) =>
      task.predecessors.some((dep) => dep.predecessorTaskId === focus.id)
    )
    .map(summarizeTaskForPrompt);

  // Parent summary task for outline context.
  const parent = focus.parentId
    ? plan.tasks.find((task) => task.id === focus.parentId) ?? null
    : null;

  return {
    parent: parent ? summarizeTaskForPrompt(parent) : null,
    predecessors,
    successors
  };
}

function buildUserMessage(plan: Plan, focus: PlanTask) {
  const neighbourhood = neighbourhoodFor(plan, focus);
  return JSON.stringify(
    {
      planTitle: plan.title,
      planFinishDate: plan.finishDate,
      focusTask: summarizeTaskForPrompt(focus),
      parent: neighbourhood.parent,
      predecessors: neighbourhoodFor(plan, focus).predecessors,
      successors: neighbourhoodFor(plan, focus).successors
    },
    null,
    2
  );
}

export async function explainTask(plan: Plan, taskId: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const focus = pickTaskById(plan, taskId);
  if (!focus) {
    throw new Error(`Task ${taskId} is not in this plan.`);
  }

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
        content: buildUserMessage(plan, focus)
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

  const data = (await response.json()) as AnthropicResponse;
  const textBlock = data.content.find(
    (block): block is { type: string; text: string } =>
      block.type === "text" && typeof block.text === "string"
  );

  if (!textBlock || !textBlock.text.trim()) {
    throw new Error("Claude returned an empty explanation.");
  }

  return textBlock.text.trim();
}
