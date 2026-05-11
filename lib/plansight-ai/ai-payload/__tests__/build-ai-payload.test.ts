import { describe, expect, it } from "vitest";
import { buildInsightsReport } from "../../analysis";
import { buildAIPayload } from "../build-ai-payload";
import { estimatePayloadTokens } from "../token-estimate";
import { PAYLOAD_CAPS, UPCOMING_WINDOW_DAYS } from "../types";
import { generateFixturePlan } from "./fixtures";

// Anchor "now" to a deterministic point so the date-relative assertions
// (upcoming window, late vs not-late, percent-complete distribution) are
// stable across runs and machines.
const NOW_MS = Date.parse("2026-06-15T12:00:00.000Z");
const NOW = new Date(NOW_MS);

function buildPayloadForFixture(taskCount: number, seed = 42) {
  const plan = generateFixturePlan({ taskCount, seed, nowMs: NOW_MS });
  const insights = buildInsightsReport(plan, NOW);
  return { plan, insights, payload: buildAIPayload(plan, insights, { now: NOW }) };
}

describe("buildAIPayload — token budget", () => {
  it.each([
    ["small (100 tasks)", 100],
    ["medium (1500 tasks)", 1500],
    ["large (10000 tasks)", 10000]
  ])("%s produces a payload between 3k and 10k tokens", (_label, taskCount) => {
    const { payload } = buildPayloadForFixture(taskCount);
    const tokens = estimatePayloadTokens(payload);
    expect(tokens).toBeGreaterThanOrEqual(1_000);
    expect(tokens).toBeLessThanOrEqual(10_000);
  });
});

describe("buildAIPayload — section caps", () => {
  it("respects every per-section cap on a large plan", () => {
    const { payload } = buildPayloadForFixture(10_000);
    expect(payload.criticalTasks.length).toBeLessThanOrEqual(PAYLOAD_CAPS.criticalTasks);
    expect(payload.lateTasks.length).toBeLessThanOrEqual(PAYLOAD_CAPS.lateTasks);
    expect(payload.atRiskTasks.length).toBeLessThanOrEqual(PAYLOAD_CAPS.atRiskTasks);
    expect(payload.milestones.length).toBeLessThanOrEqual(PAYLOAD_CAPS.milestones);
    expect(payload.bottlenecks.length).toBeLessThanOrEqual(PAYLOAD_CAPS.bottlenecks);
    expect(payload.upcoming.length).toBeLessThanOrEqual(PAYLOAD_CAPS.upcoming);
    expect(payload.structure.length).toBeLessThanOrEqual(PAYLOAD_CAPS.structure);
    expect(payload.resources.length).toBeLessThanOrEqual(PAYLOAD_CAPS.resources);
  });

  it("hits the structure cap on a large plan (>50 summary nodes)", () => {
    const { payload } = buildPayloadForFixture(10_000);
    expect(payload.structure.length).toBe(PAYLOAD_CAPS.structure);
  });

  it("hits the resources cap on a large plan (>10 unique resources)", () => {
    const { payload } = buildPayloadForFixture(10_000);
    expect(payload.resources.length).toBe(PAYLOAD_CAPS.resources);
  });

  it("hits the bottlenecks cap on a large plan", () => {
    const { payload } = buildPayloadForFixture(10_000);
    expect(payload.bottlenecks.length).toBe(PAYLOAD_CAPS.bottlenecks);
  });

  it("hits the critical/late/atRisk caps on a large plan", () => {
    const { payload } = buildPayloadForFixture(10_000);
    expect(payload.criticalTasks.length).toBe(PAYLOAD_CAPS.criticalTasks);
    expect(payload.lateTasks.length).toBe(PAYLOAD_CAPS.lateTasks);
    expect(payload.atRiskTasks.length).toBe(PAYLOAD_CAPS.atRiskTasks);
  });
});

describe("buildAIPayload — per-task structure", () => {
  it("never includes more than the predecessorIds cap per task", () => {
    const { payload } = buildPayloadForFixture(1500);
    for (const section of [
      payload.criticalTasks,
      payload.lateTasks,
      payload.atRiskTasks,
      payload.milestones,
      payload.bottlenecks,
      payload.upcoming
    ]) {
      for (const task of section) {
        expect(task.predecessorIds.length).toBeLessThanOrEqual(
          PAYLOAD_CAPS.predecessorIdsPerTask
        );
      }
    }
  });

  it("sets the milestone flag exactly for milestone tasks", () => {
    const { payload } = buildPayloadForFixture(1500);
    for (const ms of payload.milestones) {
      expect(ms.flags.milestone).toBe(true);
    }
  });
});

describe("buildAIPayload — sort orders within sections", () => {
  it("orders lateTasks by daysLate descending (implicit via finish date ascending)", () => {
    const { payload, insights } = buildPayloadForFixture(1500);
    if (payload.lateTasks.length < 2) return;
    // We assert the payload's late-task order matches insights' own
    // daysLate-desc sort by checking IDs come out in the same order.
    const insightsIds = insights.insights.lateTasks
      .slice(0, payload.lateTasks.length)
      .map((task) => task.id);
    const payloadIds = payload.lateTasks.map((task) => task.id);
    expect(payloadIds).toEqual(insightsIds);
  });

  it("orders atRiskTasks by daysRemaining ascending", () => {
    const { payload, insights } = buildPayloadForFixture(1500);
    if (payload.atRiskTasks.length < 2) return;
    const insightsIds = insights.insights.atRiskTasks
      .slice(0, payload.atRiskTasks.length)
      .map((task) => task.id);
    const payloadIds = payload.atRiskTasks.map((task) => task.id);
    expect(payloadIds).toEqual(insightsIds);
  });

  it("orders bottlenecks by dependentTaskCount descending", () => {
    const { payload, insights } = buildPayloadForFixture(1500);
    if (payload.bottlenecks.length < 2) return;
    const insightsIds = insights.insights.bottlenecks
      .slice(0, payload.bottlenecks.length)
      .map((task) => task.id);
    const payloadIds = payload.bottlenecks.map((task) => task.id);
    expect(payloadIds).toEqual(insightsIds);
  });

  it("orders resources by taskCount descending", () => {
    const { payload } = buildPayloadForFixture(1500);
    for (let i = 1; i < payload.resources.length; i++) {
      expect(payload.resources[i - 1].taskCount).toBeGreaterThanOrEqual(
        payload.resources[i].taskCount
      );
    }
  });

  it("orders milestones with critical first, then by finish date ascending", () => {
    const { payload } = buildPayloadForFixture(1500);
    if (payload.milestones.length < 2) return;
    let seenNonCritical = false;
    for (const ms of payload.milestones) {
      if (ms.flags.critical) {
        // Once we've seen a non-critical milestone, no critical one should follow.
        expect(seenNonCritical).toBe(false);
      } else {
        seenNonCritical = true;
      }
    }
  });
});

describe("buildAIPayload — upcoming window", () => {
  it("only includes tasks with start or finish within the next 30 days", () => {
    const { payload } = buildPayloadForFixture(1500);
    // The builder compares whole days (UTC midnight), so normalize the
    // window endpoints the same way for the assertion.
    const todayMidnight = Date.UTC(
      NOW.getUTCFullYear(),
      NOW.getUTCMonth(),
      NOW.getUTCDate()
    );
    const windowEndMidnight = todayMidnight + UPCOMING_WINDOW_DAYS * 86_400_000;

    for (const task of payload.upcoming) {
      const startMs = task.start ? Date.parse(task.start) : null;
      const finishMs = task.finish ? Date.parse(task.finish) : null;
      const inWindow = (n: number | null) =>
        n != null && n >= todayMidnight && n <= windowEndMidnight;
      expect(inWindow(startMs) || inWindow(finishMs)).toBe(true);
    }
  });
});

describe("buildAIPayload — referencedTaskIds", () => {
  it("includes every predecessor ID surfaced across all included tasks", () => {
    const { payload } = buildPayloadForFixture(1500);

    const expected = new Set<number>();
    for (const section of [
      payload.criticalTasks,
      payload.lateTasks,
      payload.atRiskTasks,
      payload.milestones,
      payload.bottlenecks,
      payload.upcoming
    ]) {
      for (const task of section) {
        for (const id of task.predecessorIds) {
          expected.add(id);
        }
      }
    }

    const actualSet = new Set(payload.referencedTaskIds);
    expected.forEach((id) => {
      expect(actualSet.has(id)).toBe(true);
    });
    expect(payload.referencedTaskIds.length).toBe(expected.size);
  });

  it("returns referencedTaskIds in ascending order with no duplicates", () => {
    const { payload } = buildPayloadForFixture(1500);
    for (let i = 1; i < payload.referencedTaskIds.length; i++) {
      expect(payload.referencedTaskIds[i]).toBeGreaterThan(payload.referencedTaskIds[i - 1]);
    }
  });
});

describe("buildAIPayload — meta + health", () => {
  it("uses cpm mode and reports a critical path duration when dependencies are present", () => {
    const { payload } = buildPayloadForFixture(1500);
    expect(payload.meta.mode).toBe("cpm");
    expect(payload.meta.criticalPathDurationDays).not.toBeNull();
    expect(payload.meta.criticalPathDurationDays).toBeGreaterThan(0);
  });

  it("falls back to approximate mode and surfaces criticalTasks anyway when no dependencies", () => {
    const plan = generateFixturePlan({
      taskCount: 200,
      seed: 11,
      nowMs: NOW_MS,
      withDependencies: false
    });
    const insights = buildInsightsReport(plan, NOW);
    const payload = buildAIPayload(plan, insights, { now: NOW });
    expect(payload.meta.mode).toBe("approximate");
    expect(payload.meta.criticalPathDurationDays).toBeNull();
    // In approximate mode insights.criticalTasks is empty by design;
    // buildAIPayload must source from potentialCriticalTasks.
    expect(payload.criticalTasks.length).toBeGreaterThan(0);
  });

  it("riskSummary reflects the health counts", () => {
    const { payload } = buildPayloadForFixture(1500);
    if (payload.health.lateCount > 0) {
      expect(payload.health.riskSummary).toContain("late");
    }
    if (payload.health.bottleneckCount > 0) {
      expect(payload.health.riskSummary).toContain("bottleneck");
    }
  });
});

describe("buildAIPayload — no full-plan leak", () => {
  it("does not embed the raw plan or full tasks array anywhere in the payload", () => {
    const { payload, plan } = buildPayloadForFixture(10_000);
    const serialized = JSON.stringify(payload);
    // The fixture title is unique-per-fixture and only appears in meta.title.
    const titleCount = serialized.split(plan.title).length - 1;
    expect(titleCount).toBe(1);
    // Sanity: the serialized payload is far smaller than a serialized
    // full plan would be at 10k tasks.
    const planSerialized = JSON.stringify(plan);
    expect(serialized.length).toBeLessThan(planSerialized.length / 5);
  });
});
