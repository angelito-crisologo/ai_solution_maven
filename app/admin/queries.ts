import { createSupabaseServiceClient } from "@/lib/plansight-ai/supabase";

// Time windows. Tweak in one place if we ever want a date-range picker.
export const WINDOW_DAYS_HEALTH = 7;
export const WINDOW_DAYS_TRENDS = 30;
// Cold-start proxy threshold per AI_PAYLOAD_SPEC.md fallback: parser
// duration > 8000ms is a likely cold start. Some large legitimate plans
// will trip this; refine when the parser exposes X-Parser-Queue-Ms.
const COLD_START_THRESHOLD_MS = 8000;

const MS_PER_DAY = 86_400_000;

function isoSince(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * MS_PER_DAY).toISOString();
}

function percentile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function emptyDailyBuckets(days: number): Map<string, { d: string }> {
  const out = new Map<string, { d: string }>();
  const todayMs = Date.now();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = isoDate(todayMs - i * MS_PER_DAY);
    out.set(d, { d });
  }
  return out;
}

// =============================================================================
// Section 1 — Pipeline health (upload_events)
// =============================================================================

export type PipelineHealth = {
  totalUploads: number;
  successCount: number;
  successPct: number | null;
  p50ParseMs: number | null;
  p95ParseMs: number | null;
  coldStartPct: number | null;
};

export type FailureBucket = {
  stage: string;
  count: number;
};

export type ScatterPoint = {
  fileSizeBytes: number;
  parserDurationMs: number;
};

export type DailyUploads = {
  date: string;
  successes: number;
  failures: number;
};

export async function getPipelineHealth(
  days = WINDOW_DAYS_HEALTH
): Promise<PipelineHealth> {
  const client = createSupabaseServiceClient();
  if (!client) {
    return {
      totalUploads: 0,
      successCount: 0,
      successPct: null,
      p50ParseMs: null,
      p95ParseMs: null,
      coldStartPct: null
    };
  }

  const { data } = await client
    .from("upload_events")
    .select("success, parser_duration_ms")
    .gte("created_at", isoSince(days));

  const rows = data ?? [];
  const totalUploads = rows.length;
  const successCount = rows.filter((r) => r.success === true).length;
  const parseTimes = rows
    .filter((r) => r.success === true && typeof r.parser_duration_ms === "number")
    .map((r) => r.parser_duration_ms as number)
    .sort((a, b) => a - b);
  const coldStartCount = parseTimes.filter((ms) => ms > COLD_START_THRESHOLD_MS).length;

  return {
    totalUploads,
    successCount,
    successPct: totalUploads > 0 ? (successCount / totalUploads) * 100 : null,
    p50ParseMs: percentile(parseTimes, 0.5),
    p95ParseMs: percentile(parseTimes, 0.95),
    coldStartPct: parseTimes.length > 0 ? (coldStartCount / parseTimes.length) * 100 : null
  };
}

export async function getFailureBreakdown(
  days = WINDOW_DAYS_HEALTH
): Promise<FailureBucket[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("upload_events")
    .select("failure_stage")
    .eq("success", false)
    .gte("created_at", isoSince(days));

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const stage = (row.failure_stage as string) ?? "unknown";
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getParseTimeScatter(
  days = WINDOW_DAYS_HEALTH
): Promise<ScatterPoint[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("upload_events")
    .select("file_size_bytes, parser_duration_ms")
    .eq("success", true)
    .gte("created_at", isoSince(days))
    .limit(500); // hard cap so a huge dataset doesn't melt the chart

  return (data ?? [])
    .filter(
      (row): row is { file_size_bytes: number; parser_duration_ms: number } =>
        typeof row.file_size_bytes === "number" &&
        typeof row.parser_duration_ms === "number"
    )
    .map((row) => ({
      fileSizeBytes: row.file_size_bytes,
      parserDurationMs: row.parser_duration_ms
    }));
}

export async function getDailyUploads(
  days = WINDOW_DAYS_TRENDS
): Promise<DailyUploads[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("upload_events")
    .select("created_at, success")
    .gte("created_at", isoSince(days));

  const buckets = new Map<string, { date: string; successes: number; failures: number }>();
  const todayMs = Date.now();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = isoDate(todayMs - i * MS_PER_DAY);
    buckets.set(d, { date: d, successes: 0, failures: 0 });
  }
  for (const row of data ?? []) {
    const d = (row.created_at as string).slice(0, 10);
    const bucket = buckets.get(d);
    if (!bucket) continue;
    if (row.success === true) bucket.successes += 1;
    else bucket.failures += 1;
  }
  return Array.from(buckets.values());
}

// =============================================================================
// Section 2 — Cost & economics (ai_usage_log)
// =============================================================================

export type AiCostStats = {
  totalCostUsd: number;
  totalCalls: number;
  cacheHits: number;
  cacheHitPct: number | null;
};

export type AiCostByFeature = {
  feature: string;
  totalCostUsd: number;
  calls: number;
  cacheHits: number;
  cacheHitPct: number | null;
};

export type DailyCost = {
  date: string;
  costUsd: number;
};

export type TopSpender = {
  userId: string;
  email: string | null;
  totalCostUsd: number;
  calls: number;
};

export async function getAiCostStats(
  days = WINDOW_DAYS_TRENDS
): Promise<AiCostStats> {
  const client = createSupabaseServiceClient();
  if (!client) {
    return { totalCostUsd: 0, totalCalls: 0, cacheHits: 0, cacheHitPct: null };
  }

  const { data } = await client
    .from("ai_usage_log")
    .select("cost_usd, cache_hit")
    .gte("created_at", isoSince(days));

  const rows = data ?? [];
  let totalCostUsd = 0;
  let cacheHits = 0;
  for (const row of rows) {
    const cost = typeof row.cost_usd === "number" ? row.cost_usd : Number(row.cost_usd ?? 0);
    if (Number.isFinite(cost)) totalCostUsd += cost;
    if (row.cache_hit === true) cacheHits += 1;
  }
  return {
    totalCostUsd,
    totalCalls: rows.length,
    cacheHits,
    cacheHitPct: rows.length > 0 ? (cacheHits / rows.length) * 100 : null
  };
}

export async function getAiCostByFeature(
  days = WINDOW_DAYS_TRENDS
): Promise<AiCostByFeature[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("ai_usage_log")
    .select("feature, cost_usd, cache_hit")
    .gte("created_at", isoSince(days));

  const byFeature = new Map<
    string,
    { totalCostUsd: number; calls: number; cacheHits: number }
  >();
  for (const row of data ?? []) {
    const feature = (row.feature as string) ?? "unknown";
    const entry = byFeature.get(feature) ?? { totalCostUsd: 0, calls: 0, cacheHits: 0 };
    const cost = typeof row.cost_usd === "number" ? row.cost_usd : Number(row.cost_usd ?? 0);
    if (Number.isFinite(cost)) entry.totalCostUsd += cost;
    entry.calls += 1;
    if (row.cache_hit === true) entry.cacheHits += 1;
    byFeature.set(feature, entry);
  }
  return Array.from(byFeature.entries())
    .map(([feature, e]) => ({
      feature,
      totalCostUsd: e.totalCostUsd,
      calls: e.calls,
      cacheHits: e.cacheHits,
      cacheHitPct: e.calls > 0 ? (e.cacheHits / e.calls) * 100 : null
    }))
    .sort((a, b) => b.totalCostUsd - a.totalCostUsd);
}

export async function getDailyCost(
  days = WINDOW_DAYS_TRENDS
): Promise<DailyCost[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("ai_usage_log")
    .select("created_at, cost_usd")
    .gte("created_at", isoSince(days));

  const buckets = new Map<string, { date: string; costUsd: number }>();
  const todayMs = Date.now();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = isoDate(todayMs - i * MS_PER_DAY);
    buckets.set(d, { date: d, costUsd: 0 });
  }
  for (const row of data ?? []) {
    const d = (row.created_at as string).slice(0, 10);
    const bucket = buckets.get(d);
    if (!bucket) continue;
    const cost = typeof row.cost_usd === "number" ? row.cost_usd : Number(row.cost_usd ?? 0);
    if (Number.isFinite(cost)) bucket.costUsd += cost;
  }
  return Array.from(buckets.values());
}

export async function getTopSpenders(
  days = WINDOW_DAYS_TRENDS,
  limit = 10
): Promise<TopSpender[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("ai_usage_log")
    .select("user_id, cost_usd")
    .gte("created_at", isoSince(days));

  const byUser = new Map<string, { totalCostUsd: number; calls: number }>();
  for (const row of data ?? []) {
    const userId = row.user_id as string | null;
    if (!userId) continue;
    const entry = byUser.get(userId) ?? { totalCostUsd: 0, calls: 0 };
    const cost = typeof row.cost_usd === "number" ? row.cost_usd : Number(row.cost_usd ?? 0);
    if (Number.isFinite(cost)) entry.totalCostUsd += cost;
    entry.calls += 1;
    byUser.set(userId, entry);
  }

  const top = Array.from(byUser.entries())
    .map(([userId, e]) => ({ userId, ...e }))
    .sort((a, b) => b.totalCostUsd - a.totalCostUsd)
    .slice(0, limit);

  if (top.length === 0) return [];

  // Resolve emails via the public.users mirror. Orphan auth rows
  // (no public.users entry) just show their UUID.
  const emailMap = new Map<string, string>();
  const { data: users } = await client
    .from("users")
    .select("id, email")
    .in(
      "id",
      top.map((t) => t.userId)
    );
  for (const u of users ?? []) {
    if (u.id && typeof u.email === "string") {
      emailMap.set(u.id as string, u.email);
    }
  }

  return top.map((t) => ({
    userId: t.userId,
    email: emailMap.get(t.userId) ?? null,
    totalCostUsd: t.totalCostUsd,
    calls: t.calls
  }));
}

// =============================================================================
// Section 3 — Funnel (auth.users + product_activations + user_billing)
// =============================================================================

export type FunnelCounts = {
  totalUsers: number;
  totalActivations: number;
  freeActivations: number;
  proActivations: number;
  activeProSubs: number;
  newUsers7d: number;
  newUsers30d: number;
  newActivations30d: number;
  /** % of users activated 30+ days ago that are now Pro. */
  freeToProConversionPct: number | null;
};

export async function getFunnelCounts(): Promise<FunnelCounts> {
  const client = createSupabaseServiceClient();
  if (!client) {
    return {
      totalUsers: 0,
      totalActivations: 0,
      freeActivations: 0,
      proActivations: 0,
      activeProSubs: 0,
      newUsers7d: 0,
      newUsers30d: 0,
      newActivations30d: 0,
      freeToProConversionPct: null
    };
  }

  const [usersResult, activationsResult, billingResult] = await Promise.all([
    client.from("users").select("id, created_at"),
    client.from("product_activations").select("user_id, tier, activated_at"),
    client.from("user_billing").select("user_id, subscription_status")
  ]);

  const users = usersResult.data ?? [];
  const activations = activationsResult.data ?? [];
  const billing = billingResult.data ?? [];

  const since7 = Date.now() - 7 * MS_PER_DAY;
  const since30 = Date.now() - 30 * MS_PER_DAY;
  const proConversionWindowMs = 30 * MS_PER_DAY;

  const totalUsers = users.length;
  const newUsers7d = users.filter(
    (u) => typeof u.created_at === "string" && Date.parse(u.created_at) >= since7
  ).length;
  const newUsers30d = users.filter(
    (u) => typeof u.created_at === "string" && Date.parse(u.created_at) >= since30
  ).length;

  const totalActivations = activations.length;
  const freeActivations = activations.filter((a) => a.tier === "free").length;
  const proActivations = activations.filter((a) => a.tier === "pro").length;
  const newActivations30d = activations.filter(
    (a) => typeof a.activated_at === "string" && Date.parse(a.activated_at) >= since30
  ).length;

  const activeProSubs = billing.filter(
    (b) =>
      b.subscription_status === "active" || b.subscription_status === "trialing"
  ).length;

  // Conversion rate: of users who activated 30+ days ago, what fraction
  // is now on Pro? Limits to a stable cohort so day-old users don't drag
  // the rate down.
  const matureActivations = activations.filter(
    (a) =>
      typeof a.activated_at === "string" &&
      Date.parse(a.activated_at) < Date.now() - proConversionWindowMs
  );
  const matureProSubs = new Set(
    billing
      .filter(
        (b) =>
          b.subscription_status === "active" || b.subscription_status === "trialing"
      )
      .map((b) => b.user_id as string)
  );
  const matureProCount = matureActivations.filter((a) =>
    matureProSubs.has(a.user_id as string)
  ).length;

  return {
    totalUsers,
    totalActivations,
    freeActivations,
    proActivations,
    activeProSubs,
    newUsers7d,
    newUsers30d,
    newActivations30d,
    freeToProConversionPct:
      matureActivations.length > 0
        ? (matureProCount / matureActivations.length) * 100
        : null
  };
}

// =============================================================================
// Section 4 — Engagement (upload_events + share_views + ai_usage_log)
// =============================================================================

export type EngagementStats = {
  uploadingUsers30d: number;
  repeatUploadingUsers30d: number;
  repeatUploadPct: number | null;
  totalSharedPlans30d: number;
  sharedPlansWithExternalView30d: number;
  shareViewRatePct: number | null;
  totalProUsers: number;
  proUsersUsingAi7d: number;
  proUsageActivationPct: number | null;
};

export type DailyShareViews = {
  date: string;
  externalViews: number;
  ownerViews: number;
};

export type TopViewedShare = {
  shareId: string;
  externalViews: number;
  lastViewed: string;
};

export async function getEngagementStats(): Promise<EngagementStats> {
  const client = createSupabaseServiceClient();
  if (!client) {
    return {
      uploadingUsers30d: 0,
      repeatUploadingUsers30d: 0,
      repeatUploadPct: null,
      totalSharedPlans30d: 0,
      sharedPlansWithExternalView30d: 0,
      shareViewRatePct: null,
      totalProUsers: 0,
      proUsersUsingAi7d: 0,
      proUsageActivationPct: null
    };
  }

  const since7 = isoSince(7);
  const since30 = isoSince(30);

  const [
    uploadsResult,
    plansResult,
    viewsResult,
    activationsResult,
    aiResult
  ] = await Promise.all([
    client
      .from("upload_events")
      .select("user_id")
      .eq("success", true)
      .gte("created_at", since30)
      .not("user_id", "is", null),
    client
      .from("plans")
      .select("share_id, created_at, owner_type")
      .eq("owner_type", "user")
      .gte("created_at", since30),
    client
      .from("share_views")
      .select("share_id")
      .eq("is_owner_view", false)
      .gte("viewed_at", since30),
    client.from("product_activations").select("user_id, tier"),
    client
      .from("ai_usage_log")
      .select("user_id")
      .gte("created_at", since7)
      .not("user_id", "is", null)
  ]);

  // Repeat uploads
  const uploadCounts = new Map<string, number>();
  for (const row of uploadsResult.data ?? []) {
    const id = row.user_id as string;
    uploadCounts.set(id, (uploadCounts.get(id) ?? 0) + 1);
  }
  const uploadingUsers30d = uploadCounts.size;
  const repeatUploadingUsers30d = Array.from(uploadCounts.values()).filter(
    (n) => n >= 2
  ).length;

  // Share-view rate: of plans owned by users (last 30d), what fraction has
  // at least one non-owner view?
  const userPlans = plansResult.data ?? [];
  const externalViewShareIds = new Set(
    (viewsResult.data ?? []).map((v) => v.share_id as string)
  );
  const totalSharedPlans30d = userPlans.length;
  const sharedPlansWithExternalView30d = userPlans.filter((p) =>
    externalViewShareIds.has(p.share_id as string)
  ).length;

  // Pro activation usage: Pro users with any AI call in last 7d
  const proUserIds = new Set(
    (activationsResult.data ?? [])
      .filter((a) => a.tier === "pro")
      .map((a) => a.user_id as string)
  );
  const aiActiveUserIds = new Set(
    (aiResult.data ?? []).map((row) => row.user_id as string)
  );
  const proUsersUsingAi7d = Array.from(proUserIds).filter((id) =>
    aiActiveUserIds.has(id)
  ).length;

  return {
    uploadingUsers30d,
    repeatUploadingUsers30d,
    repeatUploadPct:
      uploadingUsers30d > 0
        ? (repeatUploadingUsers30d / uploadingUsers30d) * 100
        : null,
    totalSharedPlans30d,
    sharedPlansWithExternalView30d,
    shareViewRatePct:
      totalSharedPlans30d > 0
        ? (sharedPlansWithExternalView30d / totalSharedPlans30d) * 100
        : null,
    totalProUsers: proUserIds.size,
    proUsersUsingAi7d,
    proUsageActivationPct:
      proUserIds.size > 0 ? (proUsersUsingAi7d / proUserIds.size) * 100 : null
  };
}

export async function getDailyShareViews(
  days = WINDOW_DAYS_TRENDS
): Promise<DailyShareViews[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("share_views")
    .select("viewed_at, is_owner_view")
    .gte("viewed_at", isoSince(days));

  const buckets = new Map<
    string,
    { date: string; externalViews: number; ownerViews: number }
  >();
  const todayMs = Date.now();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = isoDate(todayMs - i * MS_PER_DAY);
    buckets.set(d, { date: d, externalViews: 0, ownerViews: 0 });
  }
  for (const row of data ?? []) {
    const d = (row.viewed_at as string).slice(0, 10);
    const bucket = buckets.get(d);
    if (!bucket) continue;
    if (row.is_owner_view === true) bucket.ownerViews += 1;
    else bucket.externalViews += 1;
  }
  return Array.from(buckets.values());
}

export async function getTopViewedShares(
  days = WINDOW_DAYS_TRENDS,
  limit = 10
): Promise<TopViewedShare[]> {
  const client = createSupabaseServiceClient();
  if (!client) return [];

  const { data } = await client
    .from("share_views")
    .select("share_id, viewed_at")
    .eq("is_owner_view", false)
    .gte("viewed_at", isoSince(days));

  const byShare = new Map<string, { externalViews: number; lastViewed: string }>();
  for (const row of data ?? []) {
    const shareId = row.share_id as string;
    const viewedAt = row.viewed_at as string;
    const existing = byShare.get(shareId);
    if (!existing) {
      byShare.set(shareId, { externalViews: 1, lastViewed: viewedAt });
    } else {
      existing.externalViews += 1;
      if (viewedAt > existing.lastViewed) existing.lastViewed = viewedAt;
    }
  }

  return Array.from(byShare.entries())
    .map(([shareId, e]) => ({ shareId, ...e }))
    .sort((a, b) => b.externalViews - a.externalViews)
    .slice(0, limit);
}

// Suppress unused-import warning on emptyDailyBuckets (kept for symmetry
// in case we factor the daily-bucketing pattern out later).
void emptyDailyBuckets;
