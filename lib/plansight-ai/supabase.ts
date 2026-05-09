import { createClient } from "@supabase/supabase-js";

function readSupabaseAnonEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

function readSupabaseServiceEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return { url, serviceKey };
}

export function isSupabaseConfigured() {
  return readSupabaseAnonEnv() !== null;
}

export function isSupabaseServiceConfigured() {
  return readSupabaseServiceEnv() !== null;
}

export function createSupabaseAnonClient() {
  const config = readSupabaseAnonEnv();
  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createSupabaseServiceClient() {
  const config = readSupabaseServiceEnv();
  if (!config) {
    return null;
  }

  return createClient(config.url, config.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
