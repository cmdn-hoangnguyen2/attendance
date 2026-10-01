import { type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Next.js Edge / Node Proxy handling Auth0 SDK routes.
 * Conforms to Next.js 16 proxy convention (replacing deprecated middleware).
 * Single Source of Truth: docs/04-auth-security.md
 * Dispatches Auth0 session and OIDC routes through the verified SDK.
 */
export async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
