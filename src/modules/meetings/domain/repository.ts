import type {
  AttendanceRecord,
  AttendanceStatus,
  FundCandidate,
  MeetingSession,
} from "@/types/domain";

export interface MeetingSessionRepository {
  findById(id: string): Promise<MeetingSession | null>;
  findByRoomId(roomId: string): Promise<MeetingSession[]>;
  findCurrentByRoomId(roomId: string): Promise<MeetingSession | null>;
  create(session: {
    roomId: string;
    startsAt: string;
    attendanceDeadline: string;
    closesAt: string;
  }): Promise<MeetingSession>;
  close(id: string): Promise<MeetingSession>;
}

export interface AttendanceRepository {
  findBySessionId(sessionId: string): Promise<AttendanceRecord[]>;
  findUserRecord(sessionId: string, userId: string): Promise<AttendanceRecord | null>;
  submitSelfAttendance(
    sessionId: string,
    userId: string,
    status: AttendanceStatus
  ): Promise<AttendanceRecord>;
  overrideAttendance(
    sessionId: string,
    userId: string,
    status: AttendanceStatus,
    actorId: string
  ): Promise<AttendanceRecord>;
  getCandidates(sessionId: string): Promise<FundCandidate[]>;
  addManualCandidate(candidate: {
    sessionId: string;
    userId: string;
    suggestedAmount: number;
  }): Promise<FundCandidate>;
}
