import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SupabaseUserRepository } from "@/modules/admin/infrastructure/supabase-admin-repository";

/**
 * Server-side Auth0 Client configured for Next.js App Router (v4).
 * Single Source of Truth: docs/04-auth-security.md
 * - Automatically verifies identity & manages server sessions.
 * - Synchronizes active user into Supabase users table via beforeSessionSaved hook.
 * - Admin role is determined by the custom claim https://diemdanh.cmdn/role emitted by Auth0 RBAC.
 */
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || "dummy.auth0.com",
  clientId: process.env.AUTH0_CLIENT_ID || "dummy-client-id",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "dummy-client-secret",
  secret:
    process.env.AUTH0_SECRET ||
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  async beforeSessionSaved(session) {
    const auth0User = session.user;
    if (auth0User && auth0User.sub && auth0User.email) {
      // Determine global role from Auth0 custom claim: https://diemdanh.cmdn/role
      const roleClaim = auth0User["https://diemdanh.cmdn/role"] as string | undefined;
      const role: "admin" | "user" = roleClaim === "admin" ? "admin" : "user";

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
