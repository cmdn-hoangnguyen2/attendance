export type GlobalRole = "admin" | "user";

export type UserStatus = "active" | "soft_deleted";

export interface User {
  id: string;
  auth0Subject: string;
  email: string;
  displayName: string;
  role: GlobalRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type RoomVisibility = "public" | "private";

export type RoomStatus = "active" | "archived";

export interface Room {
  id: string;
  name: string;
  visibility: RoomVisibility;
  ownerId: string;
  status: RoomStatus;
  memberCount?: number;
  paymentImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MembershipStatus = "active" | "left" | "removed";

export interface RoomMembership {
  roomId: string;
  userId: string;
  status: MembershipStatus;
  joinedAt: string;
  leftAt?: string;
}

export type JoinRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface JoinRequest {
  id: string;
  roomId: string;
  requesterId: string;
  status: JoinRequestStatus;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export type MeetingStatus = "scheduled" | "active" | "closed";

export interface MeetingSession {
  id: string;
  roomId: string;
  startsAt: string;
  attendanceDeadline: string;
  closesAt: string;
  status: MeetingStatus;
  createdAt: string;
}

export type AttendanceStatus = "present" | "absent" | "leave";

export interface AttendanceRecord {
  id: string;
  meetingSessionId: string;
  userId: string;
  status: AttendanceStatus;
  changedBy: string;
  updatedAt: string;
}

export interface FundCandidate {
  userId: string;
  meetingSessionId: string;
  userDisplayName: string;
  userEmail: string;
  attendanceStatus: AttendanceStatus;
  suggestedAmount: number;
}

export type FundContributionReason = "Đi trễ" | "Bận nhưng chưa xin phép" | "Khác";

export type FundContributionStatus = "outstanding" | "paid";

export interface FundContribution {
  id: string;
  roomId: string;
  meetingSessionId?: string;
  contributorId: string;
  amount: number; // integer VND
  reason: FundContributionReason;
  reasonDetails?: string;
  status: FundContributionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  contributionId: string;
  amount: number;
  paidAt: string;
  confirmedBy: string;
  confirmedAt: string;
}

export interface RoomPaymentImage {
  roomId: string;
  storagePath: string;
  sortOrder: number;
  uploadedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}
