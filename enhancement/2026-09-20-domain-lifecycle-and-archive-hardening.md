# Cải Tiến: Vòng Đời Thành Viên, Bảo Mật Archive, Điểm Danh & Kiểm Thử Toàn Diện

1. **Thời gian:** 2026-09-20 23:20:00 (ICT)
2. **Feature:** Vòng đời thành viên (Membership Lifecycle), Bảo mật phòng lưu trữ (Room Archive Security), Tự động hóa điểm danh (Attendance Deadline), và Kiểm thử chất lượng (Unit Testing).
3. **Lý do change:**
   - Sau khi tổng duyệt toàn bộ 10 tài liệu trong `docs/`, phát hiện:
     + Thiếu guard kiểm tra cấm chủ phòng tự rời phòng (`docs/01-product-scope.md#L26`).
     + Thiếu giao diện & luồng để thành viên bình thường tự rời phòng (`docs/01-product-scope.md#L7`).
     + Phòng đã archive chưa được lọc khỏi `findByOwnerId` và `findJoinedByUserId` trong trang `/my-rooms` (`docs/03-domain-and-states.md#L50`).
     + Phòng đã archive chưa bị chặn truy cập đối với thành viên thông thường tại `/meeting/[roomId]` (`docs/03-domain-and-states.md#L47`, `docs/04-auth-security.md#L39`).
     + `AttendanceTab.tsx` còn dùng toggle mock thủ công thay vì tự động tính toán hạn chót từ `meetingSession.startsAt`.
     + Còn sót ký tự emoji `🔒` vi phạm tiêu chuẩn Hugeicons thuần túy (`docs/06-ui-mock-phase.md#L15`).
     + Thiếu bộ unit test cho vòng đời thành viên (`leave`, nợ quỹ khi `removeMember`, lọc phòng active).
4. **Cách thức change:**
   - **Repository:**
     + Bổ sung logic kiểm tra quyền chủ phòng trong `leave(roomId, userId)` tại `SupabaseMembershipRepository`, ném lỗi nếu Owner cố gắng tự rời phòng.
     + Bổ sung điều kiện `.eq("status", "active")` trong `findByOwnerId` và `findJoinedByUserId` tại `SupabaseRoomRepository`.
   - **Giao diện & Thành phần:**
     + Tạo component mới `LeaveRoomModal.tsx` chuẩn 8pt grid và zhon-conventions.
     + Cập nhật `MeetingHeader.tsx`: Hiển thị nút "Rời phòng" cho thành viên thường; khóa thanh tab về chế độ chỉ xem Quỹ ("Archive-only fund view") khi phòng đã archive.
     + Cập nhật `src/app/meeting/[roomId]/page.tsx`: Chặn thành viên thường truy cập chi tiết phòng đã archive (hiển thị giao diện 404/FORBIDDEN thân thiện); xử lý action `handleLeaveRoom`.
     + Cập nhật `AttendanceTab.tsx`: Tự động so sánh `new Date() >= new Date(meetingSession.startsAt)` để khóa tự điểm danh; thay emoji `🔒` bằng `HugeiconsIcon` với `LockIcon`.
   - **Kiểm thử:**
     + Viết mới `tests/unit/membership-lifecycle.test.mjs` kiểm tra mọi luồng nghiệp vụ trên với Node.js test runner.
5. **Scope ảnh hưởng:**
   - `src/modules/rooms/infrastructure/supabase-room-repository.ts`
   - `src/modules/meetings/presentation/LeaveRoomModal.tsx`
   - `src/modules/meetings/presentation/MeetingHeader.tsx`
   - `src/modules/meetings/presentation/AttendanceTab.tsx`
   - `src/app/meeting/[roomId]/page.tsx`
   - `tests/unit/membership-lifecycle.test.mjs`
6. **Lợi ích:**
   - Bảo đảm 100% tuân thủ toàn bộ các quy tắc trong tài liệu nghiệp vụ `docs/`.
   - Đảm bảo tính toàn vẹn dữ liệu: phòng luôn có chủ sở hữu, không bị mồ côi do chủ phòng tự rời.
   - Nâng cao tính bảo mật: người dùng thường không thể xem thông tin phòng đã lưu trữ; chủ phòng có giao diện xem quỹ cũ chuyên biệt.
   - Nâng cao trải nghiệm người dùng với việc tự động hóa hạn chót điểm danh và thiết kế chuẩn 8-point grid.
   - Gia tăng độ tin cậy của mã nguồn qua bộ unit test mở rộng.
