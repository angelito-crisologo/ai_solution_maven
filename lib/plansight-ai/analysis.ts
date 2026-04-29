import type { Plan, PlanMetrics, PlanTask } from "./types";

export type PlanInsight = {
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
};

const MY_TASK_OWNER = "Angelito Crisologo";

function getProgressBucket(task: PlanTask) {
  if (task.percentComplete == null) {
    return "not-started";
  }

  if (task.percentComplete >= 100) {
    return "completed";
  }

  if (task.percentComplete > 0) {
    return "in-progress";
  }

  return "not-started";
}

function hasValidDependency(task: PlanTask, taskIds: Set<number>) {
  return task.predecessors.every((dependency) => {
    if (dependency.predecessorTaskId == null) {
      return false;
    }

    return taskIds.has(dependency.predecessorTaskId);
  });
}

export function summarizePlan(plan: Plan): PlanMetrics {
  const taskIds = new Set(plan.tasks.map((task) => task.id));

  let summaryTasks = 0;
  let milestoneTasks = 0;
  let completedTasks = 0;
  let inProgressTasks = 0;
  let notStartedTasks = 0;
  let tasksWithoutDates = 0;
  let dependencyIssues = 0;
  let unassignedTasks = 0;
  let myTasks = 0;

  for (const task of plan.tasks) {
    if (task.summary) summaryTasks += 1;
    if (task.milestone) milestoneTasks += 1;
    if (task.start == null || task.finish == null) tasksWithoutDates += 1;
    if (task.resourceNames.length === 0) unassignedTasks += 1;
    if (task.resourceNames.some((resource) => resource === MY_TASK_OWNER)) {
      myTasks += 1;
    }

    const progress = getProgressBucket(task);
    if (progress === "completed") completedTasks += 1;
    if (progress === "in-progress") inProgressTasks += 1;
    if (progress === "not-started") notStartedTasks += 1;

    if (!hasValidDependency(task, taskIds)) {
      dependencyIssues += 1;
    }
  }

  return {
    totalTasks: plan.tasks.length,
    summaryTasks,
    milestoneTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    tasksWithoutDates,
    dependencyIssues,
    unassignedTasks,
    myTasks
  };
}

export function analyzePlan(plan: Plan): PlanInsight[] {
  const metrics = summarizePlan(plan);
  const insights: PlanInsight[] = [];

  if (metrics.dependencyIssues > 0) {
    insights.push({
      title: "Dependency validation needed",
      description:
        "One or more tasks reference missing or incomplete predecessors. This should be checked before sharing the plan.",
      severity: "high"
    });
  }

  if (metrics.tasksWithoutDates > 0) {
    insights.push({
      title: "Incomplete scheduling data",
      description:
        "Some tasks do not have both start and finish dates yet, which weakens timeline analysis and stakeholder clarity.",
      severity: "medium"
    });
  }

  if (metrics.unassignedTasks > 0) {
    insights.push({
      title: "Ownership gaps detected",
      description:
        "A few tasks do not have named resources attached. Assigning owners will make the stakeholder view more actionable.",
      severity: "medium"
    });
  }

  if (metrics.summaryTasks > 0) {
    insights.push({
      title: "Workstream structure is present",
      description:
        "The plan is already organized into higher-level summary tasks, which makes it easier to produce a clean stakeholder summary.",
      severity: "low"
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Plan structure looks ready",
      description:
        "The uploaded plan has enough structure to generate a readable summary and a stakeholder-friendly share view.",
      severity: "low"
    });
  }

  return insights;
}
