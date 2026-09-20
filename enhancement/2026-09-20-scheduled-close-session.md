# Thiết Lập Scheduled Close Session (Tự Động Đóng Phiên Họp Quá Hạn)

## Thời gian

2026-09-20 09:12:00 +07

## Feature

Sprint 8 / Core Lifecycle: Scheduled Close Session via Next.js Route Handler, Read-Level Expiration Guard in `MeetingSessionRepository`, and Admin Console Scheduled Close Trigger.

## Lý do change

1. **Tuân thủ đặc tả nghiệp vụ (`docs/03-domain-and-states.md` & `docs/08-delivery-sequence.md`):**
   - Phiên họp có trường `closesAt` biểu thị thời điểm nửa đêm ngày họp. Khi qua mốc này, phiên họp phải được coi là kết thúc để lịch sử điểm danh và snapshot quỹ được giữ nguyên (immutable).
   - Nếu không có cơ chế đóng tự động, phiên họp cũ vẫn tiếp tục hiển thị như đang diễn ra trên giao diện, gây nhầm lẫn cho thành viên và làm sai lệch luồng điểm danh của ngày kế tiếp.
2. **Khẳng định vai trò Backend của Next.js:**
   - Việc triển khai Route Handler nội bộ chứng minh thế mạnh của Next.js Fullstack (hỗ trợ Cron scheduling, bảo mật API token bí mật `CRON_SECRET`, xử lý logic backend tập trung) thay vì pure React SPA.
3. **Khả năng chịu lỗi cao (Fault-Tolerant Dual-Layer Resilience):**
   - Đảm bảo hệ thống vẫn chạy chuẩn ngay cả khi Cron job bị trễ: Truy vấn đọc (`findCurrentByRoomId`) lập tức loại bỏ session quá hạn `closesAt`, trong khi cron job background dọn dẹp trạng thái `closed` trong cơ sở dữ liệu và ghi log kiểm toán.

## Cách thức change

1. **Read-level Expiration Guard (`src/modules/meetings/infrastructure/supabase-meeting-repository.ts`):**
   - Cập nhật hàm `findCurrentByRoomId`: Bổ sung điều kiện `closes_at > nowIso` (`.gt("closes_at", nowIso)`). Khi một phiên họp đã qua mốc `closesAt`, giao diện phòng họp sẽ tự động nhận biết phiên họp đã đóng và không còn chọn làm phiên họp hiện tại nữa.
2. **Batch Close & Audit Logging (`closeExpiredSessions`):**
   - Thêm phương thức `closeExpiredSessions(asOfDate)` vào `MeetingSessionRepository` và `SupabaseMeetingSessionRepository`.
   - Tìm kiếm tất cả phiên họp có `status IN ('scheduled', 'active')` và `closes_at <= asOfIso`.
   - Cập nhật đồng loạt trạng thái thành `closed`.
   - Ghi bản ghi kiểm toán `audit_logs` với action `session.closed_scheduled`.
3. **Next.js Cron Route Handler (`src/app/api/cron/close-sessions/route.ts`):**
   - Xây dựng endpoint chuẩn Next.js App Router xử lý cả `GET` (dành cho Vercel Cron/Webhook) và `POST` (dành cho Admin manual trigger).
   - Kiểm tra mã xác thực `CRON_SECRET` nếu được cấu hình trên môi trường production.
   - Trả về JSON chuẩn `{ success: true, closedCount, sessionIds, timestamp, message }`.
4. **Cấu hình Vercel Cron (`vercel.json`):**
   - Lên lịch tự động gọi `/api/cron/close-sessions` mỗi ngày lúc 17:00 UTC (tương ứng 00:00 nửa đêm giờ Việt Nam UTC+7).
5. **Công cụ Quản trị UI (`src/modules/admin/presentation/RoomsManagementTab.tsx`):**
   - Thêm thẻ điều khiển "Tự động đóng phiên họp (Scheduled Close Session)" trong Admin Console (`/settings`).
   - Cung cấp nút "Quét & Đóng phiên quá hạn" với hiệu ứng xoay loading và thông báo phản hồi kết quả trực quan.
6. **Kiểm thử tự động (`tests/unit/scheduled-close.test.mjs`):**
   - 7 test cases độc lập kiểm thử trọn vẹn: Read-level guard, Batch closing logic, Không đóng session tương lai, Ghi audit log, và Bảo mật Route Handler authorization.

## Scope ảnh hưởng

- `src/modules/meetings/domain/repository.ts` (MODIFIED)
- `src/modules/meetings/infrastructure/supabase-meeting-repository.ts` (MODIFIED)
- `src/app/api/cron/close-sessions/route.ts` (NEW)
- `vercel.json` (NEW)
- `src/modules/admin/presentation/RoomsManagementTab.tsx` (MODIFIED)
- `tests/unit/scheduled-close.test.mjs` (NEW)

## Lợi ích

- **Tự động hóa 100%:** Phiên họp tự động đóng khi qua ngày, không phụ thuộc vào thao tác thủ công của chủ phòng.
- **Tính nhất quán dữ liệu cao:** Dữ liệu điểm danh và quỹ được chốt lịch sử bất biến theo đúng domain model.
- **Minh bạch & Kiểm toán:** Mỗi phiên họp đóng tự động đều có bản ghi trong `audit_logs`.
- **Thao tác thuận tiện:** Admin dễ dàng quét kiểm thử hoặc chạy bảo trì bất cứ lúc nào từ trang Settings.
