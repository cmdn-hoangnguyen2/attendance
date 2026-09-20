import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Next.js Edge / Node Middleware handling Auth0 SDK routes.
 * Single Source of Truth: docs/04-auth-security.md
 * Supports toggle NEXT_PUBLIC_ALLOW_MOCK_AUTH:
 * - When "true": Bypasses Auth0 middleware to enable local mock testing.
 * - When "false": Dispatches to auth0.middleware(request) for /auth/login, /auth/logout, /auth/callback, /auth/profile.
 */
export async function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === "true") {
    return NextResponse.next();
  }
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
