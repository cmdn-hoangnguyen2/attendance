import { ActorError, resolveActorProfile } from "@/lib/server/requireActor";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const { profile, globalRole } = await resolveActorProfile();
    return Response.json({ user: profile, globalRole }, { headers });
  } catch (error) {
    if (error instanceof ActorError) return Response.json({ error: error.code }, { status: error.status, headers });
    // Provider/database details and credentials never reach clients.
    return Response.json({ error: "PROFILE_PROVISIONING_FAILED" }, { status: 503, headers });
  }
}
