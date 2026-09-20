"use client";

import React from "react";
import type {
  AttendanceRecord,
  AttendanceStatus,
  FundCandidate,
  MeetingSession,
  User,
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
import { SelectDropdown } from "@/components/ui/SelectDropdown";

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
  const myStatus: AttendanceStatus = myRecord?.status ?? "absent";

  // Lấy snapshot ứng viên đóng quỹ (danh sách absent)
  // Quy tắc: 'leave' không bao giờ vào danh sách này
  const activeCandidates = isPastDeadline
    ? members
        .filter((member) => {
          const rec = attendanceRecords.find((r) => r.userId === member.id);
          return (rec?.status ?? "absent") === "absent";
        })
        .map((member) => ({
          userId: member.id,
          meetingSessionId: meetingSession?.id ?? "session-current",
          userDisplayName: member.displayName,
          userEmail: member.email,
          attendanceStatus: "absent" as AttendanceStatus,
          suggestedAmount: 10000,
        }))
    : fundCandidates;

  return (
    <div className="space-y-8">
      {/* SECTION 1: Header Phiên họp & Bộ giả lập Deadline */}
      <section className="rounded-2xl border border-neutral-border bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-surface text-primary-dark">
              <HugeiconsIcon icon={Calendar01Icon} size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-dark">
                  Phiên họp: {meetingSession ? "Cuộc họp định kỳ" : "Chưa có phiên họp"}
                </h2>
                <span className="rounded bg-neutral-surface px-2 py-0.5 text-xs font-bold text-primary-dark border border-neutral-border">
                  {isPastDeadline ? "Đã qua giờ bắt đầu" : "Sắp diễn ra"}
                </span>
              </div>
              <p className="text-xs text-neutral-muted mt-0.5 flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={14} />
                <span>
                  {meetingSession
                    ? `Hạn chót tự điểm danh: ${new Date(meetingSession.startsAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${new Date(meetingSession.startsAt).toLocaleDateString("vi-VN")}. Sau mốc này hệ thống tự khóa.`
                    : "Hạn chót tự điểm danh: Đúng thời điểm bắt đầu cuộc họp. Sau mốc này hệ thống tự khóa."}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Cụm Tự điểm danh của Current User (Chỉ khả dụng trước giờ G) */}
        {!isPastDeadline ? (
          <div className="rounded-xl border border-primary bg-neutral-surface/50 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-dark">
                  Tự điểm danh cá nhân
                </span>
                <p className="text-sm font-semibold text-neutral-dark mt-0.5">
                  Bạn có tham gia phiên họp này không? (Trạng thái hiện tại:{" "}
                  <strong className="text-primary-dark">
                    {myStatus === "present"
                      ? "Có mặt"
                      : myStatus === "leave"
                      ? "Xin phép nghỉ"
                      : "Vắng mặt"}
                  </strong>
                  )
                </p>
              </div>

              {/* Nút bấm chuyển trạng thái: gap 8px (gap-2), padding px-4 py-2 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelfCheckIn("present")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    myStatus === "present"
                      ? "bg-primary-dark text-white shadow-xs"
                      : "bg-white text-neutral-dark border border-neutral-border hover:bg-neutral-surface"
                  }`}
                >
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                  <span>Có mặt</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelfCheckIn("leave")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    myStatus === "leave"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-neutral-dark border border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <HugeiconsIcon icon={HelpCircleIcon} size={16} />
                  <span>Xin phép</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelfCheckIn("absent")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    myStatus === "absent"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-white text-neutral-dark border border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  <span>Vắng</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-100/60 p-4 text-xs text-neutral-muted">
            <HugeiconsIcon icon={LockIcon} size={16} className="shrink-0 text-neutral-500" />
            <span>
              <strong>Đã khóa tự điểm danh:</strong> Đã quá thời hạn bắt đầu cuộc họp. Mọi thay đổi
              điểm danh hiện tại chỉ có thể được thực hiện bởi Chủ phòng hoặc Admin.
            </span>
          </div>
        )}
      </section>

      {/* SECTION 2: Fund Candidate List (Ứng viên đóng quỹ sau deadline) */}
      {isPastDeadline ? (
        <section aria-labelledby="fund-candidates-title" className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <HugeiconsIcon icon={Coins01Icon} size={18} />
              </span>
              <div>
                <h2 id="fund-candidates-title" className="text-base font-bold text-neutral-dark">
                  Danh sách ứng viên đóng quỹ (Fund Candidate List)
                </h2>
                <p className="text-xs text-neutral-muted">
                  Snapshot thành viên vắng mặt tại thời điểm deadline (Chưa tự động sinh nghĩa vụ tiền)
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
              {activeCandidates.length} thành viên vắng
            </span>
          </div>

          {activeCandidates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCandidates.map((cand) => (
                <div
                  key={cand.userId}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold text-xs">
                      {cand.userDisplayName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-neutral-dark block">
                        {cand.userDisplayName}
                      </span>
                      <span className="text-xs text-rose-600 font-medium">Vắng không phép</span>
                    </div>
                  </div>

                  {isOwnerOrAdmin ? (
                    <button
                      type="button"
                      onClick={() => onCreateFundFromCandidate(cand)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-neutral-dark hover:bg-primary-hover hover:text-white transition-colors"
                    >
                      <HugeiconsIcon icon={Coins01Icon} size={14} />
                      <span>Tạo quỹ</span>
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-muted py-2">
              Không có thành viên nào vắng mặt trong danh sách ứng viên đóng quỹ.
            </p>
          )}
        </section>
      ) : null}

      {/* SECTION 3: Bảng Danh Sách Điểm Danh Toàn Bộ Phòng */}
      <section aria-labelledby="all-attendance-title" className="rounded-2xl border border-neutral-border bg-white p-6 shadow-xs">
        <h2 id="all-attendance-title" className="text-lg font-bold text-neutral-dark mb-1">
          Bảng điểm danh chi tiết ({members.length} thành viên)
        </h2>
        <p className="text-xs text-neutral-muted mb-6">
          Ghi nhận thời gian và người cập nhật trạng thái điểm danh
        </p>

        {/* Table layout chuẩn 8pt grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs font-bold uppercase text-neutral-muted bg-neutral-50/50">
              <tr>
                <th className="py-3 px-4">Thành viên</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Cập nhật lúc</th>
                {isOwnerOrAdmin ? <th className="py-3 px-4 text-right">Điều chỉnh (Owner/Admin)</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {members.map((member) => {
                const record = attendanceRecords.find((r) => r.userId === member.id);
                const status: AttendanceStatus = record?.status ?? "absent";

                return (
                  <tr key={member.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-surface text-primary-dark font-bold text-xs">
                          {member.displayName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-neutral-dark block">{member.displayName}</span>
                          <span className="text-xs text-neutral-muted">{member.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {status === "present" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-surface px-2.5 py-1 text-xs font-bold text-primary-dark">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                          <span>Có mặt</span>
                        </span>
                      ) : status === "leave" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                          <HugeiconsIcon icon={HelpCircleIcon} size={14} />
                          <span>Xin phép</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
                          <HugeiconsIcon icon={Cancel01Icon} size={14} />
                          <span>Vắng</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-neutral-muted">
                      {record ? new Date(record.updatedAt).toLocaleTimeString("vi-VN") : "Mặc định"}
                    </td>

                    {/* Owner/Admin Override Dropdown */}
                    {isOwnerOrAdmin ? (
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end">
                          <SelectDropdown
                            value={status}
                            onChange={(val) =>
                              onOwnerOverride(member.id, val as AttendanceStatus)
                            }
                            options={[
                              { value: "present", label: "Có mặt" },
                              { value: "leave", label: "Xin phép" },
                              { value: "absent", label: "Vắng" },
                            ]}
                            className="w-32 text-left"
                            ariaLabel={`Điều chỉnh điểm danh cho ${member.displayName}`}
                          />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
