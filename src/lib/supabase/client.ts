import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseToken } from "@/lib/supabase/tokenProvider";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const configurationError = "Supabase public configuration is missing or invalid.";
  if (!supabaseUrl || !supabaseAnonKey) throw new Error(configurationError);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error(configurationError);
  }
  if (!["https:", "http:"].includes(parsedUrl.protocol)) {
    throw new Error(configurationError);
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    accessToken: getSupabaseToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

let sharedClient: SupabaseClient<Database> | undefined;

// Importing a consumer during build/tests does not require public configuration.
// The first SDK operation creates the real client, and methods retain its receiver.
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property) {
    sharedClient ??= createBrowserSupabaseClient();
    const value = Reflect.get(sharedClient, property, sharedClient);
    return typeof value === "function" ? value.bind(sharedClient) : value;
  },
});
