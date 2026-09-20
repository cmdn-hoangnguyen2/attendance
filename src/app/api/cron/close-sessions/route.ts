import { NextRequest, NextResponse } from "next/server";
import { meetingSessionRepository } from "@/lib/repository";

export const dynamic = "force-dynamic";

/**
 * Scheduled Cron Job & Admin Webhook to close expired meeting sessions.
 * 
 * Conforms to docs/03-domain-and-states.md & docs/08-delivery-sequence.md:
 * - Sessions past closes_at (local midnight after starts_at) are transitioned from 'scheduled'|'active' to 'closed'.
 * - Securely protected via CRON_SECRET if configured.
 * - Supports GET (for Vercel Cron / external scheduler) and POST (for Admin UI manual trigger).
 */
async function handleCloseSessions(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const urlSecret = req.nextUrl.searchParams.get("secret");
      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` || urlSecret === cronSecret;

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Invalid or missing CRON_SECRET" },
          { status: 401 }
        );
      }
    }

    const result = await meetingSessionRepository.closeExpiredSessions(new Date());

    return NextResponse.json(
      {
        success: true,
        closedCount: result.closedCount,
        sessionIds: result.sessionIds,
        timestamp: new Date().toISOString(),
        message:
          result.closedCount > 0
            ? `Successfully closed ${result.closedCount} expired meeting session(s).`
            : "No expired meeting sessions needed closing.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    console.error("Scheduled Close Sessions Cron Error:", err);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleCloseSessions(req);
}

export async function POST(req: NextRequest) {
  return handleCloseSessions(req);
}
