# Chuẩn Hóa Layout, Design System Dropdown, Quỹ Phòng Realtime & Header Settings Modal

## Thời gian

2026-09-19 23:50:00 +07

## Feature

Sprint 7 Extension: Chuẩn hóa bố cục trang dùng chung (`PageContainer`), Design System Select (`SelectDropdown`), Gom cụm hành động quản trị phòng (`RoomSettingsModal`), Hoàn thiện nghiệp vụ Quỹ phòng họp (Xem QR phòng, Xác nhận nộp & Hoàn tác, Realtime sync `fund_contributions` & `payments`), Khắc phục tương tác điểm danh (`AttendanceTab`).

## Lý do change

1. **Không đồng nhất bố cục (Inconsistent Layout Max-Width):** Trang Quỹ cá nhân, Trang chủ, Danh sách phòng và Chi tiết phòng họp có padding và max-width không đồng nhất, gây lệch thị giác khi người dùng chuyển đổi giữa các trang.
2. **Thiếu Realtime cho Quỹ phòng (Realtime Sync Gap):** Hook `useRoomRealtime` chỉ đăng ký lắng nghe 7 bảng dữ liệu mà bỏ sót 2 bảng `fund_contributions` và `payments`. Khi Chủ phòng xác nhận đóng quỹ, các thành viên khác trong phòng không thấy trạng thái thay đổi tức thì nếu không F5.
3. **Nghiệp vụ và Giao diện Bảng Quỹ Phòng chưa chuẩn xác:**
   - Mỗi hàng trong bảng hiển thị nút "Xem QR" là sai nghiệp vụ (QR là tài khoản chung của phòng, không phải mỗi khoản nợ có 1 mã riêng).
   - Thành viên thông thường lại thấy cột "Thao tác" dù không có thẩm quyền duyệt quỹ.
   - Thiếu thao tác "Hoàn tác" (Revert Payment) khi Admin bấm nhầm xác nhận nộp tiền.
   - Thiếu nút bấm nổi bật trên trang để bất kỳ thành viên nào cũng có thể bấm "Xem mã QR thanh toán phòng".
4. **Header phòng họp bị phân mảnh thao tác (Fragmented Header UX):** `MeetingHeader` có 3 nút bấm riêng rẽ (Mã QR thanh toán, Chuyển giao quyền, Lưu trữ phòng) gây chật chội, kém thẩm mỹ và vỡ layout trên màn hình vừa và nhỏ.
5. **Thẻ `<select>` mặc định của trình duyệt (Native Select):** Các modal chọn thành viên, chọn admin kế nhiệm và chọn lý do đóng quỹ đang dùng thẻ HTML `<select>` thô sơ, phá vỡ tính nhất quán của Design System.
6. **Lỗi click nút trên trang Điểm danh:** Nút tự điểm danh hoặc can thiệp điểm danh bị vô hiệu hóa khi phòng họp mới tạo chưa có phiên họp (`meetingSession`) tương ứng.

## Cách thức change

1. **Chuẩn hóa Layout Container chung (`src/components/layout/PageContainer.tsx`):**
   - Xây dựng component `PageContainer` áp dụng triệt để `8pt-grid-spacing`: `max-w-7xl px-6 py-8 space-y-8 mx-auto`.
   - Áp dụng thống nhất cho toàn bộ các trang: `src/app/page.tsx`, `src/app/my-rooms/page.tsx`, `src/app/funds/page.tsx`, `src/app/settings/page.tsx`, và `src/app/meeting/[roomId]/page.tsx`.

2. **Bổ sung Realtime cho Quỹ Phòng (`src/lib/realtime/useRoomRealtime.ts`):**
   - Bổ sung channel filter cho 2 bảng `fund_contributions` và `payments` với điều kiện `room_id=eq.${roomId}`.
   - Tự động kích hoạt re-fetch dữ liệu tức thì cho tất cả client đang mở phòng khi có bất kỳ thay đổi nào về quỹ.

3. **Cải tiến Nghiệp vụ & Giao diện Tab Quỹ Phòng (`RoomFundsTab.tsx`, `repository.ts`, `supabase-fund-repository.ts`):**
   - Thêm nút chính "Xem mã QR thanh toán phòng" ở đầu card thông tin quỹ, hiển thị cho mọi thành viên.
   - Ẩn hoàn toàn cột "Thao tác" đối với thành viên thông thường.
   - Đối với Chủ phòng / Admin: Hiển thị nút "Xác nhận đã nộp" cho khoản nợ `outstanding`, và nút "Hoàn tác" cho khoản đã `paid`.
   - Bổ sung method `revertPayment(contributionId, actorId)` vào domain/infrastructure repository để xóa bản ghi thanh toán, hoàn trả trạng thái về `outstanding` và ghi log kiểm toán `audit_logs`.
   - Cập nhật `PaymentInfoModal.tsx` cho phép `amount` và `reason` là tùy chọn (`optional`), hỗ trợ mở modal xem QR phòng tổng quát mà không cần gắn với một khoản đóng góp cụ thể.

4. **Tái cấu trúc Quản trị Phòng họp (`RoomSettingsModal.tsx`, `MeetingHeader.tsx`):**
   - Gom 3 nút bấm quản trị thành một nút icon bánh răng duy nhất (`Settings01Icon`).
   - Mở modal `RoomSettingsModal` hiển thị danh sách dạng column flex gồm 3 thẻ chức năng rõ ràng:
     - Cập nhật mã QR thanh toán (Owner/Admin).
     - Chuyển quyền chủ phòng (Owner).
     - Lưu trữ phòng họp (Owner/Admin).

5. **Xây dựng Design System Select Component (`src/components/ui/SelectDropdown.tsx`):**
   - Tạo dropdown component chuẩn Design System với giao diện bo góc (`rounded-xl`), màu sắc thương hiệu `#05966B`/`#10D9A3`, hiệu ứng mở menu mượt mà (`animate-in fade-in zoom-in-95`).
   - Tích hợp tính năng click ra ngoài đóng menu (click-outside), phím tắt ESC, và hỗ trợ trạng thái disabled.
   - Thay thế toàn bộ thẻ `<select>` gốc trong:
     - `AttendanceTab.tsx` (lọc trạng thái điểm danh).
     - `TransferOwnershipModal.tsx` (chọn thành viên kế nhiệm).
     - `CreateFundContributionModal.tsx` (chọn người nộp và lý do).
     - `ArchiveUserModal.tsx` (chọn admin tiếp nhận quyền sở hữu phòng).

6. **Khắc phục tương tác trên trang Điểm danh (`page.tsx`):**
   - Thêm cơ chế tự động tìm hoặc tạo phiên họp hợp lệ (`auto-provision session`) khi người dùng bấm điểm danh trong phòng chưa khởi tạo session, loại bỏ hoàn toàn lỗi crash / unclickable button.

## Scope ảnh hưởng

- `src/components/layout/PageContainer.tsx` (NEW)
- `src/components/ui/SelectDropdown.tsx` (NEW)
- `src/modules/rooms/presentation/RoomSettingsModal.tsx` (NEW)
- `src/lib/realtime/useRoomRealtime.ts` (MODIFIED)
- `src/modules/funds/domain/repository.ts` (MODIFIED)
- `src/modules/funds/infrastructure/supabase-fund-repository.ts` (MODIFIED)
- `src/modules/funds/presentation/PaymentInfoModal.tsx` (MODIFIED)
- `src/modules/funds/presentation/CreateFundContributionModal.tsx` (MODIFIED)
- `src/modules/meetings/presentation/MeetingHeader.tsx` (MODIFIED)
- `src/modules/meetings/presentation/RoomFundsTab.tsx` (MODIFIED)
- `src/modules/meetings/presentation/AttendanceTab.tsx` (MODIFIED)
- `src/modules/rooms/presentation/TransferOwnershipModal.tsx` (MODIFIED)
- `src/modules/admin/presentation/ArchiveUserModal.tsx` (MODIFIED)
- `src/app/page.tsx` (MODIFIED)
- `src/app/my-rooms/page.tsx` (MODIFIED)
- `src/app/funds/page.tsx` (MODIFIED)
- `src/app/settings/page.tsx` (MODIFIED)
- `src/app/meeting/[roomId]/page.tsx` (MODIFIED)

## Lợi ích

- **Giao diện đồng nhất & cao cấp:** Bố cục các trang chuẩn xác theo hệ thống lưới 8-point grid spacing (`max-w-7xl`, `p-8`, `gap-6`).
- **Trải nghiệm quản trị tinh gọn:** Header phòng gọn gàng, trực quan với Settings Modal theo dạng vertical column flex card list.
- **Realtime 100% thời gian thực:** Cập nhật quỹ phòng, trạng thái đóng tiền, và hoàn tác thanh toán lập tức lan truyền đến toàn bộ các thành viên đang mở phòng.
- **Nghiệp vụ tài chính chính xác:** Phân quyền rõ ràng (thành viên không thấy nút duyệt nộp tiền; admin có thể hủy/hoàn tác xác nhận nhầm).
- **Trải nghiệm mượt mà, không gián đoạn:** Dropdown tương thích đồng bộ với UI theme, loại bỏ dropdown mặc định thô sơ; các nút điểm danh hoạt động ổn định và tin cậy.
