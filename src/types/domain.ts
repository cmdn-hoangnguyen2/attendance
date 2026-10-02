export enum GlobalRoleEnum {
  ADMIN = "admin",
  USER = "user",
}
export type GlobalRole = "admin" | "user";
export const GlobalRole = GlobalRoleEnum;

export enum UserStatusEnum {
  ACTIVE = "active",
  SOFT_DELETED = "soft_deleted",
}
export type UserStatus = "active" | "soft_deleted";
export const UserStatus = UserStatusEnum;

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

export enum RoomVisibilityEnum {
  PUBLIC = "public",
  PRIVATE = "private",
}
export type RoomVisibility = "public" | "private";
export const RoomVisibility = RoomVisibilityEnum;

export enum RoomStatusEnum {
  ACTIVE = "active",
  ARCHIVED = "archived",
}
export type RoomStatus = "active" | "archived";
export const RoomStatus = RoomStatusEnum;

export enum RoomTypeEnum {
  MEETING = "meeting",
  CHANNEL = "channel",
}
export type RoomType = "meeting" | "channel";
export const RoomType = RoomTypeEnum;

export interface Room {
  id: string;
  name: string;
  type?: RoomType;
  visibility: RoomVisibility;
  ownerId: string;
  status: RoomStatus;
  memberCount?: number;
  paymentImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum MembershipStatusEnum {
  ACTIVE = "active",
  LEFT = "left",
  REMOVED = "removed",
}
export type MembershipStatus = "active" | "left" | "removed";
export const MembershipStatus = MembershipStatusEnum;

export interface RoomMembership {
  roomId: string;
  userId: string;
  status: MembershipStatus;
  joinedAt: string;
  leftAt?: string;
}

export enum JoinRequestStatusEnum {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}
export type JoinRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export const JoinRequestStatus = JoinRequestStatusEnum;

export interface JoinRequest {
  id: string;
  roomId: string;
  requesterId: string;
  status: JoinRequestStatus;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export enum InvitationStatusEnum {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
  CANCELLED = "cancelled",
}
export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled";
export const InvitationStatus = InvitationStatusEnum;

export interface RoomInvitation {
  id: string;
  roomId: string;
  inviterId: string;
  inviteeId: string;
  status: InvitationStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export enum MeetingStatusEnum {
  SCHEDULED = "scheduled",
  ACTIVE = "active",
  CLOSED = "closed",
}
export type MeetingStatus = "scheduled" | "active" | "closed";
export const MeetingStatus = MeetingStatusEnum;

export interface MeetingSession {
  id: string;
  roomId: string;
  startsAt: string;
  attendanceDeadline: string;
  closesAt: string;
  status: MeetingStatus;
  createdAt: string;
}

export enum AttendanceStatusEnum {
  PRESENT = "present",
  ABSENT = "absent",
  LEAVE = "leave",
}
export type AttendanceStatus = "present" | "absent" | "leave";
export const AttendanceStatus = AttendanceStatusEnum;

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

export enum FundContributionReasonEnum {
  LATE = "Đi trễ",
  BUSY_WITHOUT_PERMISSION = "Bận nhưng chưa xin phép",
  OTHER = "Khác",
}
export type FundContributionReason = "Đi trễ" | "Bận nhưng chưa xin phép" | "Khác";
export const FundContributionReason = FundContributionReasonEnum;

export enum FundContributionStatusEnum {
  OUTSTANDING = "outstanding",
  PAID = "paid",
}
export type FundContributionStatus = "outstanding" | "paid";
export const FundContributionStatus = FundContributionStatusEnum;

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

export enum ConfirmationPhrase {
  ARCHIVE_ROOM = "Archive this room",
  ARCHIVE_USER = "Archive this user",
  REMOVE_MEMBER_WITH_DEBT = "I agree to remove this user",
}

export enum Auth0Claim {
  ROLE = "https://diemdanh.cmdn/role",
  ROLES = "https://diemdanh.cmdn/roles",
  PERMISSIONS = "https://diemdanh.cmdn/permissions",
  SCOPE = "scope",
}

export enum DatabaseTable {
  USERS = "users",
  ROOMS = "rooms",
  ROOM_MEMBERSHIPS = "room_memberships",
  JOIN_REQUESTS = "join_requests",
  MEETING_SESSIONS = "meeting_sessions",
  ATTENDANCE_RECORDS = "attendance_records",
  FUND_CONTRIBUTIONS = "fund_contributions",
  PAYMENTS = "payments",
  ROOM_PAYMENT_IMAGES = "room_payment_images",
  AUDIT_LOGS = "audit_logs",
  FUND_CANDIDATES = "fund_candidates",
}

export enum DatabaseView {
  FUND_CANDIDATES = "fund_candidates",
}

export enum StorageBucket {
  PAYMENT_IMAGES = "payment-images",
}

export enum SettingsTabEnum {
  USERS = "users",
  ROOMS = "rooms",
  LOGS = "logs",
}
export type SettingsTab = "users" | "rooms" | "logs";
export const SettingsTab = SettingsTabEnum;

export enum RoomFilterTabEnum {
  ALL = "all",
  PUBLIC = "public",
  PRIVATE = "private",
}
export type RoomFilterTab = "all" | "public" | "private";
export const RoomFilterTab = RoomFilterTabEnum;

export enum FundFilterTabEnum {
  ALL = "all",
  OUTSTANDING = "outstanding",
  PAID = "paid",
}
export type FundFilterTab = "all" | "outstanding" | "paid";
export const FundFilterTab = FundFilterTabEnum;

export enum RoomDetailTabEnum {
  ATTENDANCE = "attendance",
  FUNDS = "funds",
  MEMBERS = "members",
  SETTINGS = "settings",
}
export type RoomDetailTab = "attendance" | "funds" | "members" | "settings";
export const RoomDetailTab = RoomDetailTabEnum;

export interface PeerDebt {
  id: string;
  roomId: string;
  creditorId: string;
  debtorId: string;
  amount: number;
  reason?: string;
  status: "outstanding" | "paid";
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}


export interface PaymentCorrection {
  id: string;
  paymentId: string;
  correctedBy: string;
  correctedAt: string;
  reason: string;
}

export interface PersonalFundItem {
  contribution: FundContribution;
  roomSummary: {
    id: string;
    name: string;
    archived: boolean;
    ownerName: string;
  };
  payment: Payment | null;
  correction: PaymentCorrection | null;
}
