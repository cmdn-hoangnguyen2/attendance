"use client";

import { useState } from "react";
import { JoinRequestStatus, type JoinRequest, type Room, type User } from "@/types/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Delete02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InviteMemberModal } from "@/modules/rooms/presentation/InviteMemberModal";
import { RemoveMemberModal } from "./RemoveMemberModal";

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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const pendingRequests = joinRequests.filter((req) => req.status === JoinRequestStatus.PENDING);

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      member.displayName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="MembersTab ui-page-stack">
      {isOwnerOrAdmin && pendingRequests.length > 0 ? (
        <section className="MembersTab__requests ui-section-stack rounded-lg bg-warning-soft p-4 md:p-6" aria-labelledby="join-requests-title">
          <div className="MembersTab__section-heading flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="MembersTab__section-copy">
              <p className="MembersTab__eyebrow text-xs font-semibold uppercase tracking-wider text-warning">Cần xử lý</p>
              <h2 id="join-requests-title" className="MembersTab__section-title mt-2 text-xl font-bold text-text-primary">
                Yêu cầu tham gia
              </h2>
              <p className="MembersTab__section-description mt-2 text-sm leading-6 text-text-secondary">
                Duyệt hoặc từ chối người dùng đang chờ vào phòng riêng tư.
              </p>
            </div>
            <StatusBadge tone="warning">{pendingRequests.length} đang chờ</StatusBadge>
          </div>

          <div className="MembersTab__request-list border-y border-border">
            {pendingRequests.map((request) => {
              const requester = usersMap.get(request.requesterId);

              return (
                <article className="MembersTab__request ui-data-row flex flex-col gap-4 md:flex-row md:items-center md:justify-between" key={request.id}>
                  <div className="MembersTab__person flex min-w-0 items-center gap-4">
                    <span className="MembersTab__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-warning">
                      {requester?.displayName?.charAt(0) ?? "?"}
                    </span>
                    <div className="MembersTab__person-copy min-w-0">
                      <h3 className="MembersTab__person-name truncate text-sm font-semibold text-text-primary">
                        {requester?.displayName ?? "Người dùng ẩn"}
                      </h3>
                      <p className="MembersTab__person-email truncate text-sm text-text-secondary">{requester?.email}</p>
                    </div>
                  </div>

                  <div className="MembersTab__request-actions grid grid-cols-2 gap-2 md:flex">
                    <Button size="compact" onClick={() => onApproveRequest(request.id)}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} aria-hidden />
                      Duyệt
                    </Button>
                    <Button size="compact" variant="secondary" onClick={() => onRejectRequest(request.id)}>
                      <HugeiconsIcon icon={Cancel01Icon} size={16} aria-hidden />
                      Từ chối
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="MembersTab__directory ui-section-stack" aria-labelledby="members-list-title">
        <div className="MembersTab__directory-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="MembersTab__section-copy">
            <h2 id="members-list-title" className="MembersTab__section-title text-xl font-bold text-text-primary">
              Thành viên phòng
            </h2>
            <p className="MembersTab__section-description mt-2 text-sm text-text-secondary">
              {members.length} thành viên đang hoạt động.
            </p>
          </div>

          <div className="MembersTab__directory-actions flex flex-col gap-2 sm:flex-row">
            <label className="MembersTab__search relative block min-w-0 sm:w-72">
              <span className="MembersTab__search-label sr-only">Tìm thành viên theo tên hoặc email</span>
              <HugeiconsIcon className="MembersTab__search-icon pointer-events-none absolute left-4 top-4 text-text-tertiary" icon={Search01Icon} size={16} aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm tên hoặc email"
                className="MembersTab__search-input ui-field pl-10"
              />
            </label>
            {isOwnerOrAdmin ? (
              <Button className="MembersTab__invite-button shrink-0" size="touch" onClick={() => setIsInviteModalOpen(true)}>
                <HugeiconsIcon icon={UserAdd01Icon} size={18} aria-hidden />
                Mời thành viên
              </Button>
            ) : null}
          </div>
        </div>

        <div className="MembersTab__member-list border-y border-border">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const isOwner = member.id === room.ownerId;
              const hasDebt = hasOutstandingDebtMap[member.id] ?? false;

              return (
                <article className="MembersTab__member ui-data-row flex flex-col gap-4 md:flex-row md:items-center md:justify-between" key={member.id}>
                  <div className="MembersTab__person flex min-w-0 items-center gap-4">
                    <span className="MembersTab__avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                      {member.displayName.charAt(0).toUpperCase()}
                    </span>
                    <div className="MembersTab__person-copy min-w-0">
                      <div className="MembersTab__person-title-row flex flex-wrap items-center gap-2">
                        <h3 className="MembersTab__person-name truncate text-sm font-semibold text-text-primary">{member.displayName}</h3>
                        <StatusBadge tone={isOwner ? "info" : "neutral"}>{isOwner ? "Chủ phòng" : "Thành viên"}</StatusBadge>
                      </div>
                      <p className="MembersTab__person-email mt-2 truncate text-sm text-text-secondary">{member.email}</p>
                    </div>
                  </div>

                  <div className="MembersTab__member-meta flex flex-wrap items-center justify-between gap-4 md:justify-end">
                    {isOwnerOrAdmin && !isOwner ? (
                      <>
                        <StatusBadge tone={hasDebt ? "warning" : "success"}>
                          {hasDebt ? "Còn nghĩa vụ quỹ" : "Không nợ quỹ"}
                        </StatusBadge>
                        <Button size="compact" variant="ghost" onClick={() => setSelectedMemberToRemove(member)} title="Xóa thành viên khỏi phòng">
                          <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden />
                          Xóa
                        </Button>
                      </>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="MembersTab__empty py-12 text-center">
              <p className="MembersTab__empty-title text-sm font-semibold text-text-primary">Không tìm thấy thành viên</p>
              <p className="MembersTab__empty-description mt-2 text-sm text-text-secondary">Thử tìm bằng tên hoặc email khác.</p>
            </div>
          )}
        </div>
      </section>

      <RemoveMemberModal
        isOpen={!!selectedMemberToRemove}
        onClose={() => setSelectedMemberToRemove(null)}
        member={selectedMemberToRemove}
        hasOutstandingDebt={selectedMemberToRemove ? (hasOutstandingDebtMap[selectedMemberToRemove.id] ?? false) : false}
        onConfirmRemove={onRemoveMember}
      />

      <InviteMemberModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
}
