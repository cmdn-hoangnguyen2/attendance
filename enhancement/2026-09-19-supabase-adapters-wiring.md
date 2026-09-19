# Supabase Repository Adapters & Live Data Wiring

## Thời gian

2026-09-19 22:18:00 +07

## Feature

Sprint 6: Supabase Repository Adapters & Live Data Wiring (Clean Architecture Port & Adapters).

## Lý do change

Ứng dụng DiemDanhCMDN trước đây chỉ vận hành trên mock in-memory data (`src/mocks/repository.ts`). Để đưa hệ thống vào giai đoạn thực tế và kết nối cơ sở dữ liệu Supabase đã khởi tạo (11 tables theo tài liệu `docs/`), cần triển khai tầng Infrastructure Repository Adapters kết nối trực tiếp Supabase client, đồng thời chuyển đổi toàn bộ 5 trang chính sang nguồn dữ liệu thực.

## Cách thức change

1. **Khởi tạo Database Schema Types:**
   - Tạo file `src/types/database.ts` ánh xạ 1:1 với 11 bảng cơ sở dữ liệu trên Supabase, tích hợp `Relationships: []` chuẩn `@supabase/supabase-js` generic.

2. **Xây dựng Repository Ports & Supabase Adapters:**
   - Xây dựng các Interface Port trong thư mục `domain/repository.ts` của từng module (`rooms`, `meetings`, `funds`, `admin`).
   - Xây dựng 10 Infrastructure Adapter classes kế thừa Port trong `infrastructure/supabase-*-repository.ts`:
     - `SupabaseRoomRepository`, `SupabaseMembershipRepository`, `SupabaseJoinRequestRepository`
     - `SupabaseMeetingSessionRepository`, `SupabaseAttendanceRepository`
     - `SupabaseFundContributionRepository`, `SupabasePaymentRepository`, `SupabaseRoomPaymentImageRepository`
     - `SupabaseUserRepository`, `SupabaseAuditLogRepository`
   - Áp dụng Dependency Injection chuẩn mực: truyền `client: SupabaseClient<Database>` qua constructor, tập trung quản lý singleton tại `src/lib/repository/index.ts`.

3. **Thay thế Mock bằng Live Repositories trên toàn bộ 5 Pages:**
   - `src/app/page.tsx`: Catalog phòng họp, tìm kiếm & yêu cầu tham gia theo tài khoản đăng nhập.
   - `src/app/meeting/[roomId]/page.tsx`: Quản lý phiên họp, điểm danh trực tiếp, nợ quỹ tự động/thủ công, chuyển quyền chủ phòng, xóa thành viên.
   - `src/app/my-rooms/page.tsx`: Lọc danh sách phòng sở hữu / tham gia theo người dùng hiện tại từ Supabase.
   - `src/app/funds/page.tsx`: Xem thống kê nợ quỹ, danh sách đóng góp, modal thông tin chuyển khoản / QR ngân hàng.
   - `src/app/settings/page.tsx`: Quyền quản trị hệ thống (Admin), lưu trữ / khôi phục người dùng và phòng họp.

4. **Kiểm thử và xác minh độc lập:**
   - Kịch bản xác minh kiểm thử thực tế `scripts/verify-supabase-adapters.mjs` kiểm tra 14/14 test cases trực tiếp trên cơ sở dữ liệu Supabase production.

## Scope ảnh hưởng

- `package.json`, `pnpm-lock.yaml`: Thêm `@supabase/supabase-js`.
- `src/types/database.ts` (NEW)
- `src/lib/supabase/client.ts` (NEW)
- `src/lib/repository/index.ts` (NEW)
- `src/modules/rooms/domain/repository.ts`, `src/modules/rooms/infrastructure/supabase-room-repository.ts` (NEW)
- `src/modules/meetings/domain/repository.ts`, `src/modules/meetings/infrastructure/supabase-meeting-repository.ts` (NEW)
- `src/modules/funds/domain/repository.ts`, `src/modules/funds/infrastructure/supabase-fund-repository.ts` (NEW)
- `src/modules/admin/domain/repository.ts`, `src/modules/admin/infrastructure/supabase-admin-repository.ts` (NEW)
- `src/app/page.tsx`, `src/app/meeting/[roomId]/page.tsx`, `src/app/my-rooms/page.tsx`, `src/app/funds/page.tsx`, `src/app/settings/page.tsx` (MODIFIED)
- `scripts/verify-supabase-adapters.mjs` (NEW)

## Lợi ích

- **Clean Architecture:** Tách biệt hoàn toàn tầng Domain Logic, Presentation UI và Infrastructure Data Source.
- **Tính khả thi thực tế:** Dữ liệu người dùng, phòng họp, phiên điểm danh, đóng góp quỹ và nhật ký audit được lưu trữ và truy xuất bền vững trên Supabase.
- **Chất lượng mã nguồn:** 0 TypeScript errors, 0 ESLint errors, Next.js 16 build thành công với Turbopack trong ~1.2s.
