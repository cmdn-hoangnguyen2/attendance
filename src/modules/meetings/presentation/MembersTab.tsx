"use client";

import React, { useState } from "react";
import type { JoinRequest, Room, User } from "@/types/domain";
import { RemoveMemberModal } from "./RemoveMemberModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Delete02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

export interface MembersTabProps {
  room: Room;
  members: User[];
  joinRequests: JoinRequest[];
  usersMap: Map<string, User>;
  isOwnerOrAdmin: boolean;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRemoveMember: (userId: string) => void;
  hasOutstandingDebtMap: Record<string, boolean>;
}

export function MembersTab({
  room,
  members,
  joinRequests,
  usersMap,
  isOwnerOrAdmin,
  onApproveRequest,
  onRejectRequest,
  onRemoveMember,
  hasOutstandingDebtMap,
}: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<User | null>(null);

  const pendingRequests = joinRequests.filter((req) => req.status === "pending");

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      member.displayName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      {/* SECTION 1: Hàng chờ duyệt yêu cầu tham gia (Chỉ hiển thị cho Owner/Admin) */}
      {isOwnerOrAdmin && pendingRequests.length > 0 ? (
        <section aria-labelledby="join-requests-title" className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <HugeiconsIcon icon={UserAdd01Icon} size={18} />
              </span>
              <div>
                <h2 id="join-requests-title" className="text-base font-bold text-neutral-dark">
                  Yêu cầu tham gia phòng ({pendingRequests.length})
                </h2>
                <p className="text-xs text-neutral-muted">
                  Duyệt hoặc từ chối thành viên xin vào phòng riêng tư
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => {
              const requester = usersMap.get(req.requesterId);
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-sm">
                      {requester?.displayName?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-dark">
                        {requester?.displayName ?? "Người dùng ẩn"}
                      </h3>
                      <p className="text-xs text-neutral-muted">{requester?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onApproveRequest(req.id)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-neutral-dark hover:bg-primary-hover hover:text-white transition-colors"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                      <span>Duyệt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectRequest(req.id)}
                      className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-muted hover:bg-neutral-100 transition-colors"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                      <span>Từ chối</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* SECTION 2: Danh sách thành viên chính thức */}
      <section aria-labelledby="members-list-title" className="rounded-2xl border border-neutral-border bg-white p-6 shadow-xs">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-6">
          <div>
            <h2 id="members-list-title" className="text-lg font-bold text-neutral-dark">
              Danh sách thành viên ({members.length})
            </h2>
            <p className="text-xs text-neutral-muted">Tất cả thành viên đang hoạt động trong phòng</p>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-muted">
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="w-full rounded-lg border border-neutral-border bg-neutral-50/50 py-1.5 pr-3 pl-9 text-xs text-neutral-dark focus:border-primary focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Member Grid: 4 columns bento desktop (lg:grid-cols-4), gap 24px (gap-6) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => {
            const isOwner = member.id === room.ownerId;
            const hasDebt = hasOutstandingDebtMap[member.id] ?? false;

            return (
              <div
                key={member.id}
                className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-neutral-50/40 p-5 shadow-xs transition-all hover:border-primary hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-surface font-extrabold text-sm text-primary-dark border border-neutral-border">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-neutral-dark truncate">
                        {member.displayName}
                      </span>
                      {isOwner ? (
                        <span className="rounded bg-primary-dark px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Chủ phòng
                        </span>
                      ) : (
                        <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                          Thành viên
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-muted truncate mt-0.5">{member.email}</span>
                  </div>
                </div>

                {/* Footer card: Action xóa thành viên (nếu là Owner/Admin và không phải tự xóa chủ phòng) */}
                {isOwnerOrAdmin && !isOwner ? (
                  <div className="mt-4 border-t border-neutral-100 pt-3 flex items-center justify-between">
                    {hasDebt ? (
                      <span className="text-[11px] font-semibold text-amber-600">
                        Còn nghĩa vụ quỹ
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-muted">Không nợ quỹ</span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedMemberToRemove(member)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      title="Xóa thành viên khỏi phòng"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                      <span>Xóa</span>
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Xóa Thành Viên Xác Thực Chuỗi Tiếng Anh */}
      <RemoveMemberModal
        isOpen={!!selectedMemberToRemove}
        onClose={() => setSelectedMemberToRemove(null)}
        member={selectedMemberToRemove}
        hasOutstandingDebt={
          selectedMemberToRemove ? (hasOutstandingDebtMap[selectedMemberToRemove.id] ?? false) : false
        }
        onConfirmRemove={onRemoveMember}
      />
    </div>
  );
}
