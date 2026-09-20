# Tài liệu Cải tiến: Server-side Payment QR Upload & Management

## 1. Thời gian
22:40 20/09/2026

## 2. Feature
Quản lý tải lên và xóa mã QR thanh toán phòng họp (Room Payment QR Management - Funds & Rooms Module).

## 3. Lý do change
Khi người dùng tải ảnh QR thanh toán trong modal `UploadPaymentQrModal` tại trang chi tiết phòng họp (`/meeting/[roomId]`), hệ thống quăng lỗi:
`Tải tệp lên Supabase Storage thất bại: new row violates row-level security policy`

**Nguyên nhân gốc rễ:**
- Người dùng ứng dụng xác thực qua **Auth0** (Next.js server-side session) hoặc Mock Auth, không sử dụng Supabase Native Auth.
- Do đó, client Supabase chạy ở trình duyệt (`createBrowserSupabaseClient`) chỉ nắm giữ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (role: `anon`).
- Storage bucket `payment-images` theo đúng tài liệu kiến trúc bảo mật `docs/02-architecture.md` và `docs/04-auth-security.md` là **Private Bucket**. Migration `20260919000004_storage_setup.sql` chỉ cho phép quyền ghi (`INSERT`/`UPDATE`/`DELETE`) đối với `service_role` (hoặc `postgres`), tuyệt đối không mở quyền ghi cho `anon` để tránh bị tấn công tràn bộ nhớ lưu trữ.
- Việc client gọi trực tiếp `supabase.storage.from("payment-images").upload(...)` từ trình duyệt bằng `anon key` đã vi phạm chính sách RLS trên bảng `storage.objects`.

## 4. Cách thức change
1. **Xây dựng Next.js Route Handler server-side** tại `src/app/api/rooms/[roomId]/payment-qr/route.ts`:
   - Phương thức `POST`:
     - Nhận `FormData` chứa tệp ảnh (`file`) và mã người thao tác (`actorId`).
     - Kiểm tra kích thước (< 5MB) và định dạng tệp MIME (`image/jpeg`, `image/png`, `image/webp`).
     - Xác thực quyền hạn: Kiểm tra trên database xem `actorId` có phải là Chủ phòng (`owner_id`) hoặc Quản trị viên (`role === 'admin'`) hay không. Nếu không, từ chối truy cập (HTTP 403 Forbidden).
     - Sử dụng `createServerSupabaseClient()` mang `SUPABASE_SERVICE_ROLE_KEY` (chỉ chạy an toàn trên server) để tải tệp lên bucket `payment-images`.
     - Cập nhật bảng siêu dữ liệu `room_payment_images` và ghi nhận lịch sử vào `audit_logs`.
     - Tạo signed URL trả về cho client.
   - Phương thức `DELETE`:
     - Nhận `actorId` từ query parameter.
     - Xác thực quyền Chủ phòng / Admin.
     - Xóa tệp khỏi bucket `payment-images` qua service role, xóa bản ghi trong `room_payment_images` và ghi nhận `audit_logs`.
2. **Cập nhật Client Handler** tại `src/app/meeting/[roomId]/page.tsx`:
   - Chuyển `uploadHandler` và `deleteHandler` từ việc gọi trực tiếp client Supabase sang gọi API endpoint `/api/rooms/[roomId]/payment-qr`.
3. **Bổ sung Unit Tests** tại `tests/unit/payment-qr-upload.test.mjs` để kiểm thử logic validation, authorization và payload contract.

## 5. Scope ảnh hưởng
- **Files tạo mới:**
  - `src/app/api/rooms/[roomId]/payment-qr/route.ts`
  - `tests/unit/payment-qr-upload.test.mjs`
  - `enhancement/2026-09-20-server-side-payment-qr-upload.md`
- **Files cập nhật:**
  - `src/app/meeting/[roomId]/page.tsx`
- **Logic & Data flow:**
  - Luồng upload QR: Browser UI $\to$ `/api/rooms/[roomId]/payment-qr` (Server) $\to$ `service_role` $\to$ Supabase Storage (`payment-images`) & Postgres (`room_payment_images`, `audit_logs`).

## 6. Lợi ích
- **Khắc phục 100% lỗi RLS**: `SUPABASE_SERVICE_ROLE_KEY` trên server có toàn quyền quản lý `storage.objects` theo đúng migration `20260919000004_storage_setup.sql`.
- **Bảo mật tuyệt đối (Security by Design)**: Không bao giờ để lộ `service_role` ra client; không mở lỗ hổng cho `anon` ghi bừa bãi vào storage.
- **Tuân thủ Clean Architecture**: Thực hiện đúng mô hình tại `docs/02-architecture.md`: Next.js Route Handlers $\to$ Application/Repository Layer $\to$ Supabase Postgres/Storage.
