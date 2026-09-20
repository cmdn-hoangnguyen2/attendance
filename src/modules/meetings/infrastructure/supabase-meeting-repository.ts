import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  AttendanceRecord,
  AttendanceStatus,
  FundCandidate,
  MeetingSession,
} from "@/types/domain";
import type {
  AttendanceRepository,
  MeetingSessionRepository,
} from "../domain/repository";

interface CandidateWithUserRow {
  id: string;
  user_id: string;
  meeting_session_id: string;
  suggested_amount: number;
  is_manual?: boolean;
  users:
    | { id: string; display_name: string; email: string }
    | Array<{ id: string; display_name: string; email: string }>
    | null;
}

export class SupabaseMeetingSessionRepository implements MeetingSessionRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapSession(row: Database["public"]["Tables"]["meeting_sessions"]["Row"]): MeetingSession {
    return {
      id: row.id,
      roomId: row.room_id,
      startsAt: row.starts_at,
      attendanceDeadline: row.attendance_deadline,
      closesAt: row.closes_at,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<MeetingSession | null> {
    const { data, error } = await this.client
      .from("meeting_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapSession(data);
  }

  async findByRoomId(roomId: string): Promise<MeetingSession[]> {
    const { data, error } = await this.client
      .from("meeting_sessions")
      .select("*")
      .eq("room_id", roomId)
      .order("starts_at", { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapSession);
  }

  async findCurrentByRoomId(roomId: string): Promise<MeetingSession | null> {
    // Current eligible session: scheduled or active, closest starts_at, and closes_at > now() (Read-level expiration guard)
    const nowIso = new Date().toISOString();
    const { data, error } = await this.client
      .from("meeting_sessions")
      .select("*")
      .eq("room_id", roomId)
      .in("status", ["scheduled", "active"])
      .gt("closes_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapSession(data);
  }

  async create(sessionData: {
    roomId: string;
    startsAt: string;
    attendanceDeadline: string;
    closesAt: string;
    title?: string;
  }): Promise<MeetingSession> {
    const { data, error } = await this.client
      .from("meeting_sessions")
      .insert({
        room_id: sessionData.roomId,
        title: sessionData.title ?? "Meeting Session",
        starts_at: sessionData.startsAt,
        attendance_deadline: sessionData.attendanceDeadline,
        closes_at: sessionData.closesAt,
        status: "scheduled",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create meeting session: ${error?.message}`);
    }
    return this.mapSession(data);
  }

  async close(id: string): Promise<MeetingSession> {
    const { data, error } = await this.client
      .from("meeting_sessions")
      .update({
        status: "closed",
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to close meeting session: ${error?.message}`);
    }
    return this.mapSession(data);
  }

  async closeExpiredSessions(asOfDate: Date = new Date()): Promise<{ closedCount: number; sessionIds: string[] }> {
    const asOfIso = asOfDate.toISOString();

    // 1. Query expired sessions that are still scheduled or active
    const { data: expiredSessions, error: queryError } = await this.client
      .from("meeting_sessions")
      .select("id, room_id, closes_at")
      .in("status", ["scheduled", "active"])
      .lte("closes_at", asOfIso);

    if (queryError) {
      throw new Error(`Failed to query expired meeting sessions: ${queryError.message}`);
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return { closedCount: 0, sessionIds: [] };
    }

    const sessionIds = expiredSessions.map((s) => s.id);

    // 2. Batch update status to 'closed'
    const { error: updateError } = await this.client
      .from("meeting_sessions")
      .update({ status: "closed" })
      .in("id", sessionIds);

    if (updateError) {
      throw new Error(`Failed to batch close meeting sessions: ${updateError.message}`);
    }

    // 3. Log audit entries for scheduled closes (non-blocking)
    const auditEntries = expiredSessions.map((s) => ({
      actor_id: "00000000-0000-0000-0000-000000000001", // System / Primary Admin actor
      action: "session.closed_scheduled",
      target_type: "meeting_session",
      target_id: s.id,
      metadata: { roomId: s.room_id, closesAt: s.closes_at, closedAt: asOfIso },
    }));

    try {
      await this.client.from("audit_logs").insert(auditEntries);
    } catch {
      // Non-critical audit insertion catch
    }

    return { closedCount: sessionIds.length, sessionIds };
  }
}

export class SupabaseAttendanceRepository implements AttendanceRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private mapAttendance(row: Database["public"]["Tables"]["attendance_records"]["Row"]): AttendanceRecord {
    return {
      id: row.id,
      meetingSessionId: row.meeting_session_id,
      userId: row.user_id,
      status: row.status,
      changedBy: row.changed_by,
      updatedAt: row.updated_at,
    };
  }

  async findBySessionId(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await this.client
      .from("attendance_records")
      .select("*")
      .eq("meeting_session_id", sessionId);

    if (error || !data) return [];
    return data.map(this.mapAttendance);
  }

  async findUserRecord(sessionId: string, userId: string): Promise<AttendanceRecord | null> {
    const { data, error } = await this.client
      .from("attendance_records")
      .select("*")
      .eq("meeting_session_id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapAttendance(data);
  }

  async submitSelfAttendance(
    sessionId: string,
    userId: string,
    status: AttendanceStatus
  ): Promise<AttendanceRecord> {
    // Check meeting session startsAt (deadline)
    const { data: session } = await this.client
      .from("meeting_sessions")
      .select("starts_at")
      .eq("id", sessionId)
      .single();

    if (session && new Date(session.starts_at) <= new Date()) {
      throw new Error("Attendance deadline passed. Self-checkin is closed.");
    }

    const { data, error } = await this.client
      .from("attendance_records")
      .upsert(
        {
          meeting_session_id: sessionId,
          user_id: userId,
          status,
          changed_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "meeting_session_id,user_id" }
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to submit attendance: ${error?.message}`);
    }
    return this.mapAttendance(data);
  }

  async overrideAttendance(
    sessionId: string,
    userId: string,
    status: AttendanceStatus,
    actorId: string
  ): Promise<AttendanceRecord> {
    const { data, error } = await this.client
      .from("attendance_records")
      .upsert(
        {
          meeting_session_id: sessionId,
          user_id: userId,
          status,
          changed_by: actorId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "meeting_session_id,user_id" }
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to override attendance: ${error?.message}`);
    }

    // Log audit
    await this.client.from("audit_logs").insert({
      actor_id: actorId,
      action: "attendance.override",
      target_type: "attendance_record",
      target_id: data.id,
      metadata: { userId, status, sessionId },
    });

    return this.mapAttendance(data);
  }

  async getCandidates(sessionId: string): Promise<FundCandidate[]> {
    const { data: candidates, error } = await this.client
      .from("fund_candidates")
      .select(`
        id,
        user_id,
        meeting_session_id,
        suggested_amount,
        is_manual,
        users:user_id (id, display_name, email)
      `)
      .eq("meeting_session_id", sessionId);

    if (error || !candidates) return [];

    // Get attendance statuses
    const { data: attendance } = await this.client
      .from("attendance_records")
      .select("user_id, status")
      .eq("meeting_session_id", sessionId);

    const statusMap = new Map<string, AttendanceStatus>();
    attendance?.forEach((a) => statusMap.set(a.user_id, a.status));

    const candidateRows = (candidates ?? []) as unknown as CandidateWithUserRow[];

    return candidateRows.map((c) => {
      // Supabase join typing
      const user = Array.isArray(c.users) ? c.users[0] : c.users;
      return {
        userId: c.user_id,
        meetingSessionId: c.meeting_session_id,
        userDisplayName: user?.display_name ?? "Unknown",
        userEmail: user?.email ?? "",
        attendanceStatus: statusMap.get(c.user_id) ?? "absent",
        suggestedAmount: c.suggested_amount,
      };
    });
  }

  async addManualCandidate(candidate: {
    sessionId: string;
    userId: string;
    suggestedAmount: number;
  }): Promise<FundCandidate> {
    const { data, error } = await this.client
      .from("fund_candidates")
      .upsert(
        {
          meeting_session_id: candidate.sessionId,
          user_id: candidate.userId,
          suggested_amount: candidate.suggestedAmount,
          is_manual: true,
        },
        { onConflict: "meeting_session_id,user_id" }
      )
      .select(`
        id,
        user_id,
        meeting_session_id,
        suggested_amount,
        users:user_id (id, display_name, email)
      `)
      .single();

    if (error || !data) {
      throw new Error(`Failed to add manual candidate: ${error?.message}`);
    }

    const row = data as unknown as CandidateWithUserRow;
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      userId: row.user_id,
      meetingSessionId: row.meeting_session_id,
      userDisplayName: user?.display_name ?? "Unknown",
      userEmail: user?.email ?? "",
      attendanceStatus: "absent",
      suggestedAmount: row.suggested_amount,
    };
  }
}
