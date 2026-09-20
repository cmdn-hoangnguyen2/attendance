# Cải Tiến: Tinh Giản Giao Diện, Chuẩn Hóa PillTabs & Đồng Bộ Layout Max-Width

## 1. Thời gian
- **Thời điểm thực hiện:** 2026-09-20 17:15:00 (GMT+7)

## 2. Feature
- **UI/UX Enhancement & Design System Standardization:** Tinh giản trang Login, chuẩn hóa component `PillTabs` và `EmptyState`, chuyển đổi button/input sang pill layout (`rounded-full`), tái cấu trúc `RoomCard` và đồng bộ max-width trên toàn ứng dụng.

## 3. Lý do change
- **Trang Login:** Trước đó chứa nhiều text dài dòng, badge rườm rà, và hộp highlights tính năng không cần thiết; cần làm tinh gọn, tập trung và hiện đại hơn.
- **Trang Homepage:** Cụm filter tabs và search bar chưa đồng bộ phong cách pill (`rounded-full`); thừa text counter `[Hiển thị: x / y phòng]`; viền card đang lạm dụng màu xanh `#C9F2E3` thay vì viền xám trung tính.
- **Thẻ RoomCard:** Cần tái cấu trúc vị trí số lượng thành viên xuống bên dưới thông tin chủ phòng, bổ sung hiển thị giờ họp (mặc định `-` nếu chưa thiết lập), và nút hành động chuyển sang pill layout.
- **Trang `my-rooms` và `funds`:** Bị lệch độ rộng tối đa (max-width) và thiếu lớp bọc layout thống nhất so với trang chủ.
- **Trùng lặp code (Convention):** Các tab phân trang và trạng thái empty state bị viết lặp nhiều lần tại từng trang mà chưa được trừu tượng hóa thành component dùng chung.

## 4. Cách thức change
1. **Tạo và chuẩn hóa Component dùng chung:**
   - [`src/components/ui/PillTabs.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/components/ui/PillTabs.tsx): Component tab/tag filter dạng pill layout bo tròn (`rounded-full`), vỏ ngoài xám `bg-neutral-100`, item active nền trắng có đổ bóng nhẹ `shadow-xs`, hỗ trợ icon và label. **Đặc biệt:** Loại bỏ hoàn toàn số lượng (count badge) trên toàn bộ tag/tab item (kể cả tab lọc dữ liệu hay tab mở sub-page/section) để giao diện tối giản, sạch sẽ và đồng bộ.
   - [`src/components/ui/EmptyState.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/components/ui/EmptyState.tsx): Chuẩn hóa giao diện khi không có dữ liệu với viền đứt nét trung tính `border-dashed border-neutral-300`, tiêu đề ngắn và nút CTA tùy chọn.
2. **Tinh Giản Trang Đăng Nhập ([`src/app/login/page.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/app/login/page.tsx)):**
   - Loại bỏ hoàn toàn: badge OIDC, khối feature highlights 2 hàng icon, và đoạn văn bản điều khoản dài dòng.
   - Giữ lại Card nhỏ gọn viền xám `border-neutral-200`, Logo CM gradient, tiêu đề "Đăng nhập DiemDanhCMDN", subtitle 1 câu ngắn, và nút pill "Tiếp tục với Google" (`rounded-full`).
3. **Cải Tiến Homepage & Thẻ Phòng ([`src/modules/rooms/presentation/RoomCard.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/modules/rooms/presentation/RoomCard.tsx), [`src/modules/rooms/presentation/RoomListFilter.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/modules/rooms/presentation/RoomListFilter.tsx)):**
   - `RoomListFilter`: Tích hợp `PillTabs`, ô tìm kiếm dạng pill `rounded-full`, xóa bỏ dòng chữ `[Hiển thị: ... phòng]`.
   - `RoomCard`: Sắp xếp lại thứ tự content: Type room (Badge Công khai / Riêng tư) $\to$ Tên phòng $\to$ Danh sách thông tin (Chủ phòng, Số lượng thành viên chuyển xuống dưới, Giờ họp với ký tự `-`) $\to$ Nút hành động pill `rounded-full`. Viền đổi sang xám `border-neutral-200 hover:border-neutral-400`.
   - Hero banner: Đổi sang viền xám `border-neutral-200 bg-white`, nút "Tạo phòng mới" dạng pill `rounded-full`.
4. **Đồng Bộ Layout & Max-Width Tuyệt Đối ([`src/app/my-rooms/page.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/app/my-rooms/page.tsx), [`src/app/funds/page.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/app/funds/page.tsx), [`src/app/settings/page.tsx`](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/app/settings/page.tsx)):**
   - Áp dụng cấu trúc bọc đồng nhất: `<div className="flex-1 bg-neutral-50/50"><PageContainer as="main">...</div>` chuẩn `max-w-7xl px-6 py-8`.
   - Thay thế toàn bộ tab filter nội bộ bằng `PillTabs`.
   - Thay thế các khối empty state bằng `EmptyState`.
   - Tinh giản tiêu đề và mô tả của từng trang.

## 5. Scope ảnh hưởng
- **Tập tin tạo mới:**
  - `src/components/ui/PillTabs.tsx`
  - `src/components/ui/EmptyState.tsx`
  - `enhancement/2026-09-20-ui-simplification-pill-layout.md`
- **Tập tin chỉnh sửa:**
  - `src/app/login/page.tsx`
  - `src/modules/rooms/presentation/RoomCard.tsx`
  - `src/modules/rooms/presentation/RoomListFilter.tsx`
  - `src/app/page.tsx`
  - `src/app/my-rooms/page.tsx`
  - `src/app/funds/page.tsx`
  - `src/app/settings/page.tsx`
  - `src/modules/meetings/presentation/MeetingHeader.tsx`

## 6. Lợi ích
- **Trải nghiệm người dùng (UX):** Giao diện sạch sẽ, thanh lịch, bớt ngột ngạt vì bỏ bớt các viền xanh sặc sỡ và các đoạn text dư thừa; nút bấm và input dạng pill bo tròn tạo cảm giác hiện đại, mềm mại.
- **Tính nhất quán (Design System):** Toàn bộ các trang con đều cùng một độ rộng container, cùng một chiều cao và phong cách tabs, giải quyết triệt để lỗi lệch layout.
- **Chất lượng mã nguồn (DX):** Tái sử dụng `PillTabs` và `EmptyState`, xóa bỏ hơn 150 dòng code trùng lặp, tuân thủ 100% `8pt-grid-spacing` và `zhon-conventions`.
