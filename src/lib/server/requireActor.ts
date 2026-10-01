import "server-only";
import { auth0 } from "@/lib/auth0";
import { isActiveProfile, resolveGlobalRole, resolveProvisioningIdentity } from "@/lib/authClaims.mjs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SupabaseUserRepository } from "@/modules/admin/infrastructure/supabase-admin-repository";

export class ActorError extends Error {
  constructor(public readonly status: 401 | 403, public readonly code: string) { super(code); }
}
export async function resolveActorProfile() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) throw new ActorError(401, "UNAUTHENTICATED");
  const identity = resolveProvisioningIdentity(session.user);
  const repository = new SupabaseUserRepository(createServerSupabaseClient());
  // Authentication never writes lifecycle fields or the deprecated DB role.
  const profile = await repository.createOrSync(identity);
  if (!isActiveProfile(profile)) throw new ActorError(403, "ACCOUNT_ARCHIVED");
  const globalRole = resolveGlobalRole(session.user);
  return { profile: { ...profile, role: globalRole }, globalRole };
}
export async function requireActor(): Promise<{ userId: string; auth0Subject: string; globalRole: "admin" | "user" }> {
  const { profile, globalRole } = await resolveActorProfile();
  return { userId: profile.id, auth0Subject: profile.auth0Subject, globalRole };
}
