"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Room, User } from "@/types/domain";
import { ArchiveRoomModal } from "@/modules/rooms/presentation/ArchiveRoomModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
  Archive01Icon,
  ArrowReloadHorizontalIcon,
  Globe02Icon,
  LockIcon,
  UserIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";

export interface RoomsManagementTabProps {
  rooms: Room[];
  usersMap: Map<string, User>;
  onArchiveRoom: (roomId: string) => void;
  onRestoreRoom: (roomId: string) => void;
}

type RoomStatusFilter = "all" | "active" | "archived";

export function RoomsManagementTab({
  rooms,
  usersMap,
  onArchiveRoom,
  onRestoreRoom,
}: RoomsManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatusFilter>("all");
  const [selectedRoomToArchive, setSelectedRoomToArchive] = useState<Room | null>(null);
  const [isClosingSessions, setIsClosingSessions] = useState(false);
  const [closeFeedback, setCloseFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleManualCloseSessions = async () => {
    setIsClosingSessions(true);
    setCloseFeedback(null);
    try {
      const res = await fetch("/api/cron/close-sessions", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCloseFeedback({
          success: true,
          message: data.message || `Đã đóng ${data.closedCount} phiên họp quá hạn.`,
        });
      } else {
        setCloseFeedback({
          success: false,
          message: data.error || "Có lỗi xảy ra khi đóng phiên họp.",
        });
      }
    } catch (err: unknown) {
      setCloseFeedback({
        success: false,
        message: err instanceof Error ? err.message : "Lỗi kết nối máy chủ.",
      });
    } finally {
      setIsClosingSessions(false);
    }
  };

  // Thống kê
  const activeRoomsCount = rooms.filter((r) => r.status === "active").length;
  const archivedRoomsCount = rooms.filter((r) => r.status === "archived").length;

  // Lọc danh sách phòng
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return r.name.toLowerCase().includes(query) || r.id.toLowerCase().includes(query);
      }
      return true;
    });
  }, [rooms, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 3 Thẻ thống kê phòng họp (Summary Cards) */}
      <section aria-label="Thống kê phòng họp" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-neutral-border bg-white p-6 shadow-xs">
          <p className="text-xs font-semibold text-neutral-muted">Tổng số phòng họp</p>
          <p className="text-2xl font-black text-neutral-dark mt-1">{rooms.length}</p>
        </div>

        <div className="rounded-2xl border border-neutral-border bg-neutral-surface/50 p-6 shadow-xs">
          <p className="text-xs font-semibold text-primary-dark">Đang hoạt động</p>
          <p className="text-2xl font-black text-neutral-dark mt-1">{activeRoomsCount}</p>
        </div>

        <div className="rounded-2xl border border-neutral-300 bg-neutral-100/60 p-6 shadow-xs">
          <p className="text-xs font-semibold text-neutral-600">Đã lưu trữ (Archived)</p>
          <p className="text-2xl font-black text-neutral-800 mt-1">{archivedRoomsCount}</p>
        </div>
      </section>

      {/* Tiện ích Quét & Đóng phiên họp quá hạn (Scheduled Close Cron) */}
      <section aria-label="Scheduled Close Sessions Cron" className="rounded-2xl border border-neutral-border bg-linear-to-r from-white via-neutral-surface/30 to-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-primary-dark">
            <HugeiconsIcon icon={Clock01Icon} size={16} />
            <span>Tự động đóng phiên họp (Scheduled Close Session)</span>
          </div>
          <p className="text-xs text-neutral-muted">
            Các phiên họp quá hạn <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[11px]">closesAt</code> (nửa đêm sau giờ họp) sẽ tự động đóng. Bạn có thể kích hoạt quét dọn dẹp thủ công ngay lập tức.
          </p>
          {closeFeedback && (
            <p className={`text-xs font-semibold pt-1 ${closeFeedback.success ? "text-primary-dark" : "text-rose-600"}`}>
              {closeFeedback.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleManualCloseSessions}
          disabled={isClosingSessions}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white border border-neutral-border px-4 py-2.5 text-xs font-semibold text-neutral-dark shadow-xs hover:bg-neutral-surface hover:text-primary-dark hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HugeiconsIcon
            icon={ArrowReloadHorizontalIcon}
            size={16}
            className={isClosingSessions ? "animate-spin text-primary-dark" : ""}
          />
          <span>{isClosingSessions ? "Đang quét..." : "Quét & Đóng phiên quá hạn"}</span>
        </button>
      </section>

      {/* Thanh bộ lọc & Tìm kiếm */}
      <section aria-label="Bộ lọc phòng họp" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-border pb-4">
        {/* Sub-tabs trạng thái */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-primary-dark text-white shadow-xs"
                : "bg-white text-neutral-muted border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <span>Tất cả</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
              {rooms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              statusFilter === "active"
                ? "bg-primary-dark text-white shadow-xs"
                : "bg-white text-primary-dark border border-neutral-border hover:bg-neutral-surface/50"
            }`}
          >
            <span>Đang hoạt động</span>
            <span className="rounded-full bg-neutral-border/60 px-1.5 py-0.2 text-[10px] text-primary-dark">
              {activeRoomsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("archived")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              statusFilter === "archived"
                ? "bg-neutral-800 text-white shadow-xs"
                : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
            }`}
          >
            <span>Đã lưu trữ</span>
            <span className="rounded-full bg-neutral-200 px-1.5 py-0.2 text-[10px] text-neutral-800">
              {archivedRoomsCount}
            </span>
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-muted">
            <HugeiconsIcon icon={Search01Icon} size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc mã phòng..."
            className="w-full rounded-xl border border-neutral-border bg-white py-2 pl-9 pr-4 text-xs font-medium text-neutral-dark placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </section>

      {/* Bảng danh sách Phòng họp */}
      <section aria-label="Bảng danh sách phòng họp" className="overflow-hidden rounded-2xl border border-neutral-border bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-dark">
            <thead className="bg-neutral-surface/60 border-b border-neutral-border text-[11px] font-bold text-primary-dark uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Tên phòng họp
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Quyền xem
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Chủ phòng
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Ngày tạo
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRooms.map((room) => {
                const isActive = room.status === "active";
                const owner = usersMap.get(room.ownerId);

                return (
                  <tr key={room.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-dark">
                          <HugeiconsIcon icon={Folder01Icon} size={18} />
                        </span>
                        <div>
                          <Link
                            href={`/meeting/${room.id}`}
                            className="font-bold text-neutral-dark hover:text-primary-dark transition-colors"
                          >
                            {room.name}
                          </Link>
                          <p className="text-[11px] text-neutral-muted">
                            ID: {room.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {room.visibility === "public" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-surface px-2.5 py-1 text-[11px] font-bold text-primary-dark">
                          <HugeiconsIcon icon={Globe02Icon} size={12} />
                          <span>Công khai</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                          <HugeiconsIcon icon={LockIcon} size={12} />
                          <span>Kín</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-dark">
                        <HugeiconsIcon icon={UserIcon} size={13} className="text-neutral-muted" />
                        <span>{owner?.displayName ?? "Chưa xác định"}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-surface px-2.5 py-1 text-[11px] font-bold text-primary-dark">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                          <span>Hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-300 px-2.5 py-1 text-[11px] font-bold text-neutral-600">
                          <HugeiconsIcon icon={Archive01Icon} size={12} />
                          <span>Đã lưu trữ</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-[11px] text-neutral-muted">
                      {new Date(room.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => setSelectedRoomToArchive(room)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                          <HugeiconsIcon icon={Archive01Icon} size={14} />
                          <span>Lưu trữ</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRestoreRoom(room.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-dark px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-dark/90 transition-colors"
                        >
                          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />
                          <span>Khôi phục</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Lưu Trữ Phòng Họp */}
      {selectedRoomToArchive && (
        <ArchiveRoomModal
          isOpen={Boolean(selectedRoomToArchive)}
          onClose={() => setSelectedRoomToArchive(null)}
          room={selectedRoomToArchive}
          onConfirmArchive={onArchiveRoom}
        />
      )}
    </div>
  );
}
