import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SupabaseUserRepository } from "@/modules/admin/infrastructure/supabase-admin-repository";
import { Auth0Claim, GlobalRole } from "@/types/domain";

/**
 * Server-side Auth0 Client configured for Next.js App Router (v4).
 * Single Source of Truth: docs/04-auth-security.md
 * - Automatically verifies identity & manages server sessions.
 * - Synchronizes active user into Supabase users table via beforeSessionSaved hook.
 * - Admin role is determined by Auth0 RBAC custom claims, permissions, or scope.
 */
function resolveAppBaseUrl(): string {
  const customUrl = process.env.APP_BASE_URL;
  if (customUrl && !customUrl.includes("localhost")) {
    return customUrl;
  }
  // Automatically fallback to Vercel production domain if running on Vercel
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return customUrl || "http://localhost:3000";
}

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || "dummy.auth0.com",
  clientId: process.env.AUTH0_CLIENT_ID || "dummy-client-id",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "dummy-client-secret",
  secret:
    process.env.AUTH0_SECRET ||
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  appBaseUrl: resolveAppBaseUrl(),
  authorizationParameters: {
    prompt: "select_account",
    connection: process.env.AUTH0_CONNECTION || "google-oauth2",
    scope: "openid profile email",
  },
  async beforeSessionSaved(session) {
    const auth0User = session.user;
    if (auth0User && auth0User.sub && auth0User.email) {
      // Determine global role from Auth0 custom claim, roles array, permissions, or scope
      const roleClaim = auth0User[Auth0Claim.ROLE] as string | undefined;
      const rolesArray = (auth0User.roles || auth0User[Auth0Claim.ROLES]) as string[] | undefined;
      const permissionsArray = (auth0User.permissions || auth0User[Auth0Claim.PERMISSIONS]) as string[] | undefined;
      const scopeValue = auth0User[Auth0Claim.SCOPE] || auth0User.scope;
      const scopeArray =
        typeof scopeValue === "string"
          ? scopeValue.split(" ")
          : Array.isArray(scopeValue)
            ? (scopeValue as string[])
            : [];

      const isAdmin =
        roleClaim === GlobalRole.ADMIN ||
        rolesArray?.includes(GlobalRole.ADMIN) ||
        permissionsArray?.includes(GlobalRole.ADMIN) ||
        scopeArray.includes(GlobalRole.ADMIN);

      const role: GlobalRole = isAdmin ? GlobalRole.ADMIN : GlobalRole.USER;

      try {
        const supabase = createServerSupabaseClient();
        const userRepository = new SupabaseUserRepository(supabase);

        await userRepository.createOrSync({
          auth0Subject: auth0User.sub,
          email: auth0User.email,
          displayName:
            auth0User.name ||
            auth0User.nickname ||
            auth0User.email.split("@")[0] ||
            "User",
          role,
        });
      } catch (err) {
        // Log sync error without breaking the login redirect flow
        console.error("[Auth0 Hook] Error syncing user onboarding to Supabase:", err);
      }
    }
    return session;
  },
});
