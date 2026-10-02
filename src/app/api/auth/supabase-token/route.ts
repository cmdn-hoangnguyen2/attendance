import { auth0 } from "@/lib/auth0";
import { ActorError, requireActor } from "@/lib/server/requireActor";
import { createSupabaseTokenResponse } from "@/lib/server/supabaseTokenResponse.mjs";

export async function GET(request: Request) {
  return createSupabaseTokenResponse(request, {
    appBaseUrl: process.env.APP_BASE_URL,
    getSession: () => auth0.getSession(),
    requireActor,
    ActorError,
  });
}
