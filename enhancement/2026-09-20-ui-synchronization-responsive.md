# Enhancement: Đồng Bộ Hóa Max-Width, Chuẩn Hóa Conventions & Tối Ưu Hóa Responsive UI

## 1. Thời gian
- **Thời điểm thực hiện:** 2026-09-20 11:00 (UTC+7)

## 2. Feature
- **UI Architecture & Responsive Layout:** Đồng bộ hóa container `max-w-7xl px-6`, bổ sung Mobile Navigation Menu cho Header, chống tràn ngang các thanh bộ lọc trên mobile và chuẩn hóa Semantic HTML theo `zhon-conventions` & `8pt-grid-spacing`.

## 3. Lý do change
- **Đồng bộ giao diện:** Banner chuyển vai trò (`RoleSwitcherBanner`) trước đây dùng `px-4`, làm thụt lề 8px so với Header (`px-6`) và PageContainer (`px-6`).
- **Khắc phục lỗi điều hướng mobile:** Header trên màn hình nhỏ (< 768px) bị ẩn thanh liên kết (`hidden md:flex`) mà chưa có menu di động, khiến người dùng mobile không thể chuyển giữa các trang chính.
- **Chống vỡ giao diện trên thiết bị hẹp (< 390px):** Thanh filter tab tại `/funds` và `/my-rooms` chưa có cơ chế cuộn ngang chống tràn khi màn hình quá nhỏ.
- **Semantic HTML:** Trang chủ (`/`) bị lỗi lồng 2 thẻ `<main>` (`<main>` ngoài bọc lấy `<PageContainer as="main">`), vi phạm quy chuẩn HTML5.

## 4. Cách thức change
1. **Đồng bộ hóa Max-Width & Padding:**
   - Cập nhật `RoleSwitcherBanner.tsx` sang `px-6 py-2` để thẳng hàng dọc 100% với Header và PageContainer trên mọi kích thước màn hình.
   - Giữ vững `PageContainer` chuẩn `max-w-7xl px-6 py-8 space-y-8` trên tất cả các trang chính.
2. **Mobile Navigation Header ([AppHeader.tsx](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/components/layout/AppHeader.tsx)):**
   - Bổ sung nút bấm Menu Mobile (Hamburger / Close icon) với kích thước bấm chạm chuẩn 40x40px (`h-10 w-10`).
   - Thêm dropdown menu di động hiển thị đầy đủ các liên kết điều hướng và tự động đóng menu khi chuyển route (React 19 render-phase state adjustment).
3. **Chống tràn ngang giao diện ([funds/page.tsx](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/app/funds/page.tsx), [my-rooms/page.tsx](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/app/my-rooms/page.tsx)):**
   - Bổ sung `overflow-x-auto max-w-full` cho các cụm tab bộ lọc trạng thái quỹ và danh mục phòng để cuộn ngang mượt mà trên iPhone SE và màn hình hẹp.
4. **Chuẩn hóa Semantic HTML ([src/app/page.tsx](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/app/page.tsx)):**
   - Thay thẻ `<main>` ngoài cùng thành `<div>`, đảm bảo `<PageContainer as="main">` là thẻ `<main>` duy nhất.
5. **Thống nhất phương thức xác thực:**
   - Thay thế các lời gọi trực tiếp `setRole("user")` tại các trang `/`, `/funds`, `/my-rooms`, `/settings` bằng hàm `login()` đa năng từ `useAuthMock()`, tự động tương thích với cả Mock mode và Auth0 mode.

## 5. Scope ảnh hưởng
- **Files cập nhật:**
  - `src/components/layout/RoleSwitcherBanner.tsx`
  - `src/components/layout/AppHeader.tsx`
  - `src/app/page.tsx`
  - `src/app/funds/page.tsx`
  - `src/app/my-rooms/page.tsx`
  - `src/app/settings/page.tsx`
- **Files tạo mới:**
  - `enhancement/2026-09-20-ui-synchronization-responsive.md`

## 6. Lợi ích
- **Độ tin cậy & Thẩm mỹ cao:** Giao diện hoàn toàn thẳng hàng, đồng bộ `max-w-7xl px-6` từ đầu trang đến cuối trang.
- **Trải nghiệm Mobile (UX/DX):** Người dùng điện thoại có menu điều hướng trực quan, các tab lọc không bị tràn khung hay làm giãn trang web.
- **Tiêu chuẩn lập trình:** 100% tuân thủ `zhon-conventions` (Semantic HTML, không nested `<main>`) và `8pt-grid-spacing` (bội số của 8).
- **Chất lượng mã nguồn:** 46/46 unit tests pass, TypeScript 0 errors, ESLint 0 errors, Turbopack build thành công.
