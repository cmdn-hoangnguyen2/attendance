# Supabase Realtime Subscriptions & Private QR Code Storage Upload

## Thời gian

2026-09-19 22:46:00 +07

## Feature

Sprint 7: Supabase Realtime Channels (`useRoomRealtime`, `useUserRealtime`) và Private QR Code Upload với Signed URLs (`UploadPaymentQrModal`).

## Lý do change

1. **Trải nghiệm tức thời (Realtime UX):** Trước đây, khi một thành viên điểm danh, chủ phòng duyệt yêu cầu, hoặc ghi nhận nợ quỹ, các client khác không tự động cập nhật mà phải tải lại trang thủ công (F5). Điều này không đáp ứng tiêu chuẩn trải nghiệm người dùng hiện đại và thiết kế tại `docs/05-realtime.md`.
2. **Quản lý QR thanh toán bảo mật (Private Storage):** Các phòng họp cần có mã QR/STK để thành viên quét nợ quỹ. Theo `docs/07-api-backend-phase.md`, bucket chứa ảnh phải tuyệt đối Private, giới hạn 5 MB, chỉ chấp nhận JPEG, PNG, WebP, và hiển thị thông qua Signed URL có thời hạn bảo mật để chống rò rỉ dữ liệu tài chính.

## Cách thức change

1. **Supabase Realtime Configuration & Hooks:**
   - Tạo migration `supabase/migrations/20260919000005_realtime_setup.sql` thêm 8 bảng vào `supabase_realtime` publication.
   - Xây dựng hook `src/lib/realtime/useRoomRealtime.ts` lắng nghe topic `room:{roomId}` cho các sự kiện: điểm danh, phiên họp, ứng viên nợ quỹ, thành viên, yêu cầu tham gia, ảnh QR. Tích hợp cơ chế debounce 300ms và tự động hủy subscription khi unmount.
   - Xây dựng hook `src/lib/realtime/useUserRealtime.ts` lắng nghe topic `user:{userId}` cho các biến động về nghĩa vụ đóng góp `fund_contributions` và thanh toán `payments`.

2. **Private QR Image Upload & Signed URL Flow:**
   - Nâng cấp `RoomPaymentImageRepository` và `SupabaseRoomPaymentImageRepository`:
     - Phương thức `uploadAndLinkImage`: Kiểm tra MIME type, giới hạn kích thước $\le 5$MB, tải file lên private bucket `payment-images/${roomId}/qr-${timestamp}.${ext}`, lưu metadata vào bảng `room_payment_images`, ghi log `audit_logs` (`room_payment_image.uploaded`), tạo Signed URL 1 giờ.
     - Phương thức `remove`: Xóa file trong Storage bucket, xóa metadata trong database và ghi log `audit_logs` (`room_payment_image.removed`).
   - Xây dựng `src/modules/funds/presentation/UploadPaymentQrModal.tsx` tuân thủ 100% `8pt-grid-spacing` và `zhon-conventions`:
     - Preview ảnh trước khi upload.
     - Nút xóa ảnh QR hiện tại.
     - Validation thông báo lỗi inline trực quan.
     - Hỗ trợ đầy đủ phím ESC và accessibility WCAG.

3. **Tích hợp giao diện người dùng:**
   - `MeetingHeader.tsx`: Bổ sung nút "Mã QR thanh toán" dành cho Chủ phòng (Owner) hoặc Admin.
   - `src/app/meeting/[roomId]/page.tsx`: Kết nối `useRoomRealtime`, tích hợp `UploadPaymentQrModal` và load Signed URL cho `room.paymentImageUrl`.
   - `src/app/funds/page.tsx`: Kết nối `useUserRealtime` và tự động cấp phát Signed URL khi mở modal chuyển khoản.

4. **Kiểm thử tự động:**
   - Tạo `scripts/verify-supabase-realtime-and-storage.mjs` kiểm tra live: cấu hình bucket, tính năng upload & signed URL, dọn dẹp file test, từ chối file SVG/sai MIME type, kiểm tra kênh Realtime (11/11 tests passed).

## Scope ảnh hưởng

- `supabase/migrations/20260919000005_realtime_setup.sql` (NEW)
- `src/lib/realtime/useRoomRealtime.ts` (NEW)
- `src/lib/realtime/useUserRealtime.ts` (NEW)
- `src/modules/funds/presentation/UploadPaymentQrModal.tsx` (NEW)
- `src/modules/funds/domain/repository.ts` (MODIFIED)
- `src/modules/funds/infrastructure/supabase-fund-repository.ts` (MODIFIED)
- `src/modules/meetings/presentation/MeetingHeader.tsx` (MODIFIED)
- `src/app/meeting/[roomId]/page.tsx` (MODIFIED)
- `src/app/funds/page.tsx` (MODIFIED)
- `scripts/verify-supabase-realtime-and-storage.mjs` (NEW)

## Lợi ích

- **Realtime mượt mà:** Trạng thái phòng họp, điểm danh và nợ quỹ nhảy tức thì trên mọi thiết bị kết nối.
- **Bảo mật tối đa:** Ảnh tài khoản ngân hàng / QR được bảo vệ nghiêm ngặt trong bucket Private, chỉ xem được qua Signed URL có hạn dùng.
- **Tiện ích thực tế:** Chủ phòng dễ dàng đổi mã QR tài khoản nhận tiền phạt trực tiếp trên ứng dụng.
- **Độ tin cậy cao:** 0 lỗi TypeScript, 0 lỗi ESLint, 11/11 tests tự động thành công trên database thật.
