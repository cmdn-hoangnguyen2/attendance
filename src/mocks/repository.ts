import type {
  AttendanceRecord,
  AuditLog,
  FundCandidate,
  FundContribution,
  JoinRequest,
  MeetingSession,
  Payment,
  Room,
  RoomMembership,
  RoomPaymentImage,
  User,
} from "@/types/domain";

import {
  attendanceRecords,
  auditLogs,
  fundCandidates,
  fundContributions,
  joinRequests,
  meetings,
  memberships,
  payments,
  roomPaymentImages,
  rooms,
  users,
} from "./fixtures";

type ReadonlyRecord<RecordType> = Readonly<RecordType>;

export interface MockRepository {
  listUsers: () => readonly ReadonlyRecord<User>[];
  findUserById: (userId: string) => ReadonlyRecord<User> | undefined;
  listRooms: () => readonly ReadonlyRecord<Room>[];
  findRoomById: (roomId: string) => ReadonlyRecord<Room> | undefined;
  listMembershipsByRoomId: (
    roomId: string,
  ) => readonly ReadonlyRecord<RoomMembership>[];
  listJoinRequestsByRoomId: (
    roomId: string,
  ) => readonly ReadonlyRecord<JoinRequest>[];
  listMeetingsByRoomId: (
    roomId: string,
  ) => readonly ReadonlyRecord<MeetingSession>[];
  listAttendanceByMeetingId: (
    meetingSessionId: string,
  ) => readonly ReadonlyRecord<AttendanceRecord>[];
  listFundCandidatesByMeetingId: (
    meetingSessionId: string,
  ) => readonly ReadonlyRecord<FundCandidate>[];
  listFundContributionsByRoomId: (
    roomId: string,
  ) => readonly ReadonlyRecord<FundContribution>[];
  listFundContributionsByUserId: (
    userId: string,
  ) => readonly ReadonlyRecord<FundContribution>[];
  listPaymentsByContributionId: (
    contributionId: string,
  ) => readonly ReadonlyRecord<Payment>[];
  listPaymentImagesByRoomId: (
    roomId: string,
  ) => readonly ReadonlyRecord<RoomPaymentImage>[];
  listAuditLogs: () => readonly ReadonlyRecord<AuditLog>[];
}

export const mockRepository: MockRepository = Object.freeze({
  listUsers: () => users,
  findUserById: (userId: string) => users.find((user) => user.id === userId),
  listRooms: () => rooms,
  findRoomById: (roomId: string) => rooms.find((room) => room.id === roomId),
  listMembershipsByRoomId: (roomId: string) =>
    memberships.filter((membership) => membership.roomId === roomId),
  listJoinRequestsByRoomId: (roomId: string) =>
    joinRequests.filter((request) => request.roomId === roomId),
  listMeetingsByRoomId: (roomId: string) =>
    meetings.filter((meeting) => meeting.roomId === roomId),
  listAttendanceByMeetingId: (meetingSessionId: string) =>
    attendanceRecords.filter(
      (attendance) => attendance.meetingSessionId === meetingSessionId,
    ),
  listFundCandidatesByMeetingId: (meetingSessionId: string) =>
    fundCandidates.filter(
      (candidate) => candidate.meetingSessionId === meetingSessionId,
    ),
  listFundContributionsByRoomId: (roomId: string) =>
    fundContributions.filter((contribution) => contribution.roomId === roomId),
  listFundContributionsByUserId: (userId: string) =>
    fundContributions.filter(
      (contribution) => contribution.contributorId === userId,
    ),
  listPaymentsByContributionId: (contributionId: string) =>
    payments.filter((payment) => payment.contributionId === contributionId),
  listPaymentImagesByRoomId: (roomId: string) =>
    roomPaymentImages
      .filter((image) => image.roomId === roomId)
      .sort((firstImage, secondImage) =>
        firstImage.sortOrder - secondImage.sortOrder,
      ),
  listAuditLogs: () => auditLogs,
});
