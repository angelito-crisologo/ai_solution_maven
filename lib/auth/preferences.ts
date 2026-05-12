import {
  createSupabaseServiceClient,
  isSupabaseServiceConfigured
} from "@/lib/supabase/service";

export type WeekStartDay = "monday" | "sunday";

export type UserPreferences = {
  weekStartDay: WeekStartDay;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  weekStartDay: "monday"
};

function requireServiceClient() {
  if (!isSupabaseServiceConfigured()) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Failed to create Supabase service client.");
  }
  return client;
}

/**
 * Fetch the user's preferences row. Falls back to defaults when the row
 * is missing or unreachable (so a missing setting never breaks features
 * that depend on it).
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    const client = requireServiceClient();
    const { data, error } = await client
      .from("users")
      .select("week_start_day")
      .eq("id", userId)
      .maybeSingle<{ week_start_day: WeekStartDay | null }>();

    if (error || !data?.week_start_day) {
      return DEFAULT_PREFERENCES;
    }
    return {
      weekStartDay: data.week_start_day === "sunday" ? "sunday" : "monday"
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Persist the user's week-start preference. Service-role write — RLS on
 * public.users only permits self-read.
 */
export async function setWeekStartDay(
  userId: string,
  weekStartDay: WeekStartDay
): Promise<void> {
  const client = requireServiceClient();
  const { error } = await client
    .from("users")
    .update({
      week_start_day: weekStartDay,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
