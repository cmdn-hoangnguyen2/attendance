"use client";

import {
  AttendanceStatus,
  type AttendanceRecord,
  type FundCandidate,
  type MeetingSession,
  type User,
} from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  HelpCircleIcon,
  Coins01Icon,
  Clock01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/StatusBadge";

export interface AttendanceTabProps {
  meetingSession?: MeetingSession;
  members: User[];
  attendanceRecords: AttendanceRecord[];
  fundCandidates: FundCandidate[];
  currentUser: User | null;
  isOwnerOrAdmin: boolean;
  onSelfCheckIn: (status: AttendanceStatus) => void;
  onOwnerOverride: (userId: string, status: AttendanceStatus) => void;
  onCreateFundFromCandidate: (candidate: FundCandidate) => void;
}

function getAttendancePresentation(status: AttendanceStatus): {
  label: string;
  tone: StatusBadgeProps["tone"];
} {
  if (status === AttendanceStatus.PRESENT) return { label: "Có mặt", tone: "success" };
  if (status === AttendanceStatus.LEAVE) return { label: "Xin phép", tone: "info" };
  return { label: "Vắng", tone: "danger" };
}

export function AttendanceTab({
  meetingSession,
  members,
  attendanceRecords,
  fundCandidates,
  currentUser,
  isOwnerOrAdmin,
  onSelfCheckIn,
  onOwnerOverride,
  onCreateFundFromCandidate,
}: AttendanceTabProps) {
  // Tự động xác định hạn chót điểm danh dựa trên startsAt thực tế (docs/03-domain-and-states.md)
  const isPastDeadline = Boolean(
    meetingSession?.startsAt && new Date() >= new Date(meetingSession.startsAt)
  );

  // Tìm bản ghi điểm danh của current user
  const myRecord = attendanceRecords.find((r) => r.userId === currentUser?.id);
  const myStatus: AttendanceStatus = myRecord?.status ?? AttendanceStatus.ABSENT;

  // Lấy snapshot ứng viên đóng quỹ (danh sách absent)
  // Quy tắc: 'leave' không bao giờ vào danh sách này
  const activeCandidates = isPastDeadline
    ? members
        .filter((member) => {
          const rec = attendanceRecords.find((r) => r.userId === member.id);
          return (rec?.status ?? AttendanceStatus.ABSENT) === AttendanceStatus.ABSENT;
        })
        .map((member) => ({
          userId: member.id,
          meetingSessionId: meetingSession?.id ?? "session-current",
          userDisplayName: member.displayName,
          userEmail: member.email,
          attendanceStatus: AttendanceStatus.ABSENT,
          suggestedAmount: 10000,
        }))
    : fundCandidates;

  const deadlineText = meetingSession
    ? `${new Date(meetingSession.startsAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })} · ${new Date(meetingSession.startsAt).toLocaleDateString("vi-VN")}`
    : "Đúng thời điểm bắt đầu cuộc họp";
  const myStatusPresentation = getAttendancePresentation(myStatus);

  return (
    <div className="AttendanceTab ui-page-stack">
      <section className="AttendanceTab__session ui-section-stack" aria-labelledby="attendance-session-title">
        <div className="AttendanceTab__session-header flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="AttendanceTab__heading flex min-w-0 items-start gap-4">
            <span className="AttendanceTab__heading-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <HugeiconsIcon icon={Calendar01Icon} size={24} aria-hidden />
            </span>
            <div className="AttendanceTab__heading-copy min-w-0">
              <p className="AttendanceTab__eyebrow text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Phiên điểm danh
              </p>
              <h2 id="attendance-session-title" className="AttendanceTab__title mt-2 text-xl font-bold text-text-primary">
                {meetingSession ? "Cuộc họp định kỳ" : "Chưa có phiên họp"}
              </h2>
              <p className="AttendanceTab__deadline mt-2 flex items-start gap-2 text-sm leading-6 text-text-secondary">
                <HugeiconsIcon className="AttendanceTab__deadline-icon mt-1 shrink-0" icon={Clock01Icon} size={16} aria-hidden />
                <span>Hạn chót tự điểm danh: {deadlineText}. Sau mốc này hệ thống tự khóa.</span>
              </p>
            </div>
          </div>
          <StatusBadge tone={isPastDeadline ? "neutral" : "info"}>
            {isPastDeadline ? "Đã khóa" : "Đang mở"}
          </StatusBadge>
        </div>

        {!isPastDeadline ? (
          <div className="AttendanceTab__self-check rounded-lg bg-surface-subtle p-4 md:p-6">
            <div className="AttendanceTab__self-check-content flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="AttendanceTab__self-copy">
                <p className="AttendanceTab__self-label text-sm font-semibold text-text-primary">
                  Trạng thái của bạn
                </p>
                <p className="AttendanceTab__self-description mt-2 text-sm text-text-secondary">
                  Hiện tại: <strong className="text-text-primary">{myStatusPresentation.label}</strong>. Bạn có thể cập nhật trước hạn chót.
                </p>
              </div>
              <div className="AttendanceTab__self-actions grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  variant={myStatus === AttendanceStatus.PRESENT ? "primary" : "secondary"}
                  onClick={() => onSelfCheckIn(AttendanceStatus.PRESENT)}
                >
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} aria-hidden />
                  Có mặt
                </Button>
                <Button
                  variant={myStatus === AttendanceStatus.LEAVE ? "primary" : "secondary"}
                  onClick={() => onSelfCheckIn(AttendanceStatus.LEAVE)}
                >
                  <HugeiconsIcon icon={HelpCircleIcon} size={16} aria-hidden />
                  Xin phép
                </Button>
                <Button
                  variant={myStatus === AttendanceStatus.ABSENT ? "primary" : "secondary"}
                  onClick={() => onSelfCheckIn(AttendanceStatus.ABSENT)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} aria-hidden />
                  Vắng
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="AttendanceTab__locked flex items-start gap-2 rounded-lg bg-neutral-soft p-4 text-sm leading-6 text-text-secondary">
            <HugeiconsIcon className="AttendanceTab__locked-icon mt-1 shrink-0" icon={LockIcon} size={16} aria-hidden />
            <p className="AttendanceTab__locked-copy">
              <strong className="text-text-primary">Đã khóa tự điểm danh.</strong> Chỉ Chủ phòng hoặc Admin có thể điều chỉnh trạng thái sau hạn chót.
            </p>
          </div>
        )}
      </section>

      {isPastDeadline ? (
        <section className="AttendanceTab__candidates ui-section-stack rounded-lg bg-warning-soft p-4 md:p-6" aria-labelledby="fund-candidates-title">
          <div className="AttendanceTab__section-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="AttendanceTab__section-copy">
              <h2 id="fund-candidates-title" className="AttendanceTab__section-title flex items-center gap-2 text-lg font-bold text-text-primary">
                <HugeiconsIcon icon={Coins01Icon} size={20} aria-hidden />
                Ứng viên đóng quỹ
              </h2>
              <p className="AttendanceTab__section-description mt-2 text-sm leading-6 text-text-secondary">
                Snapshot thành viên vắng mặt tại deadline; chưa tự động sinh nghĩa vụ tiền.
              </p>
            </div>
            <StatusBadge tone="warning">{activeCandidates.length} thành viên vắng</StatusBadge>
          </div>

          <div className="AttendanceTab__candidate-list">
            {activeCandidates.length > 0 ? (
              activeCandidates.map((candidate) => (
                <div className="AttendanceTab__candidate ui-data-row flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" key={candidate.userId}>
                  <div className="AttendanceTab__candidate-person flex min-w-0 items-center gap-4">
                    <span className="AttendanceTab__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-sm font-bold text-danger">
                      {candidate.userDisplayName.charAt(0)}
                    </span>
                    <div className="AttendanceTab__candidate-copy min-w-0">
                      <p className="AttendanceTab__candidate-name truncate text-sm font-semibold text-text-primary">{candidate.userDisplayName}</p>
                      <p className="AttendanceTab__candidate-email truncate text-sm text-text-secondary">{candidate.userEmail}</p>
                    </div>
                  </div>
                  {isOwnerOrAdmin ? (
                    <Button className="AttendanceTab__candidate-action sm:shrink-0" size="compact" onClick={() => onCreateFundFromCandidate(candidate)}>
                      <HugeiconsIcon icon={Coins01Icon} size={16} aria-hidden />
                      Tạo quỹ
                    </Button>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="AttendanceTab__candidate-empty py-4 text-sm text-text-secondary">
                Không có thành viên nào vắng mặt trong danh sách ứng viên đóng quỹ.
              </p>
            )}
          </div>
        </section>
      ) : null}

      <section className="AttendanceTab__records ui-section-stack" aria-labelledby="all-attendance-title">
        <div className="AttendanceTab__section-copy">
          <h2 id="all-attendance-title" className="AttendanceTab__section-title text-xl font-bold text-text-primary">
            Danh sách điểm danh
          </h2>
          <p className="AttendanceTab__section-description mt-2 text-sm text-text-secondary">
            {members.length} thành viên · ghi nhận trạng thái và thời gian cập nhật.
          </p>
        </div>

        <div className="AttendanceTab__record-list border-y border-border">
          {members.map((member) => {
            const record = attendanceRecords.find((r) => r.userId === member.id);
            const status: AttendanceStatus = record?.status ?? AttendanceStatus.ABSENT;
            const statusPresentation = getAttendancePresentation(status);

            return (
              <article className="AttendanceTab__record ui-data-row grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={member.id}>
                <div className="AttendanceTab__person flex min-w-0 items-center gap-4">
                  <span className="AttendanceTab__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {member.displayName.charAt(0)}
                  </span>
                  <div className="AttendanceTab__person-copy min-w-0">
                    <h3 className="AttendanceTab__person-name truncate text-sm font-semibold text-text-primary">{member.displayName}</h3>
                    <p className="AttendanceTab__person-email truncate text-sm text-text-secondary">{member.email}</p>
                  </div>
                </div>

                <div className="AttendanceTab__record-controls flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:justify-end">
                  <div className="AttendanceTab__record-state flex items-center gap-2">
                    <StatusBadge tone={statusPresentation.tone}>{statusPresentation.label}</StatusBadge>
                    <span className="AttendanceTab__updated-at text-xs text-text-tertiary">
                      {record ? new Date(record.updatedAt).toLocaleTimeString("vi-VN") : "Mặc định"}
                    </span>
                  </div>
                  {isOwnerOrAdmin ? (
                    <SelectDropdown
                      value={status}
                      onChange={(value) => onOwnerOverride(member.id, value as AttendanceStatus)}
                      options={[
                        { value: AttendanceStatus.PRESENT, label: "Có mặt" },
                        { value: AttendanceStatus.LEAVE, label: "Xin phép" },
                        { value: AttendanceStatus.ABSENT, label: "Vắng" },
                      ]}
                      className="AttendanceTab__override w-full sm:w-32"
                      ariaLabel={`Điều chỉnh điểm danh cho ${member.displayName}`}
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
