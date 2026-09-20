# Cải Tiến: Đăng Nhập Một Chạm Auth0 & Phân Quyền Theo Scope/Permission

## 1. Thời gian
- **Thời điểm thực hiện:** 2026-09-20 15:50:00 (GMT+7)

## 2. Feature
- **Authentication & Route Gating:** Auth0 OIDC Account Chooser (`prompt: select_account`), RBAC Scope/Permission Role Resolution, và Dedicated Login Page chuẩn Canonical Design System & 8-point grid.

## 3. Lý do change
- Người dùng yêu cầu trải nghiệm đăng nhập tối giản và an toàn: không cần form nhập liệu email thủ công, chỉ cần một nút bấm duy nhất để chuyển hướng đến trang chọn tài khoản (account selector) của Auth0.
- Thay vì sử dụng danh sách email cứng trong mã nguồn, hệ thống chuyển sang phân quyền tự động thông qua `scope`, `permission`, hoặc custom claim OIDC do Auth0 trả về (`role: admin` vs `role: user`).
- Đảm bảo tính bảo mật và sự nhất quán: chỉ sau khi đăng nhập thành công mới được hiển thị danh sách phòng họp và các trang nội bộ (`/`, `/my-rooms`, `/funds`, `/settings`, `/meeting/[roomId]`). Người dùng chưa đăng nhập tự động được chuyển hướng về trang `/login`.

## 4. Cách thức change
1. **Cấu hình Auth0 Account Selection, Scopes & Google Connection Bypass (`src/lib/auth0.ts`):**
   - Bổ sung `authorizationParameters: { prompt: "select_account", connection: process.env.AUTH0_CONNECTION || "google-oauth2", scope: "openid profile email" }` vào `Auth0Client`.
   - Tham số `connection: "google-oauth2"` thông báo cho Auth0 bỏ qua hoàn toàn màn hình nhập Email/Password mặc định và chuyển hướng thẳng sang Google Account Chooser.
   - Cập nhật hàm `beforeSessionSaved(session)` để trích xuất quyền từ:
     - Custom claim OIDC: `https://diemdanh.cmdn/role`
     - Mảng vai trò: `session.user.roles` hoặc `https://diemdanh.cmdn/roles`
     - Mảng quyền hạn: `session.user.permissions` hoặc `https://diemdanh.cmdn/permissions`
   - Đồng bộ vai trò người dùng vào bảng `users` trên Supabase Live Database với vai trò chuẩn `"admin" | "user"`.
2. **Cập nhật Auth Context (`src/context/AuthMockContext.tsx`):**
   - Hỗ trợ giải quyết quyền `isAdmin` tức thì trên client-side thông qua cả claims, roles và permissions do Auth0 cung cấp.
3. **Xây dựng Trang Đăng Nhập Chuyên Biệt (`src/app/login/page.tsx`):**
   - Thiết kế 1 Card căn giữa duy nhất, tuân thủ 100% hệ thống khoảng cách 8-point grid và bảng màu nhận diện thương hiệu (`#10D9A3`, `#05966B`, `#0B1F1A`, `#E8FBF4`, `#C9F2E3`).
   - Không chứa bất kỳ ô input nhập email nào.
   - Nút hành động chính: "Tiếp tục với Google" (`login()` kích hoạt luồng OIDC chuyển thẳng sang màn hình chọn tài khoản Google).
   - Tự động chuyển hướng về `/` nếu người dùng đã đăng nhập.
4. **Bảo vệ Toàn Bộ Tuyến Đường Nội Bộ (Route Gating):**
   - Tại `src/app/page.tsx`: Ẩn danh mục phòng họp đối với khách vãng lai, chuyển hướng về `/login` nếu chưa đăng nhập.
   - Tại `src/app/my-rooms/page.tsx`, `src/app/funds/page.tsx`, `src/app/settings/page.tsx`, `src/app/meeting/[roomId]/page.tsx`: Chặn truy cập và chuyển hướng về `/login` ngay khi phát hiện phiên chưa được xác thực.
5. **Tinh Gọn Header Khi Đang Ở Trang Đăng Nhập (`src/components/layout/AppHeader.tsx`):**
   - Khi `pathname === "/login"`, ẩn toàn bộ menu điều hướng và nút đăng nhập/đăng xuất để giữ giao diện đăng nhập tập trung, thanh lịch.

## 5. Scope ảnh hưởng
- **Tập tin tạo mới:**
  - `src/app/login/page.tsx`
  - `enhancement/2026-09-20-auth-gate-and-button-login.md`
- **Tập tin chỉnh sửa:**
  - `src/lib/auth0.ts`
  - `.env.example`
  - `src/context/AuthMockContext.tsx`
  - `src/app/page.tsx`
  - `src/app/my-rooms/page.tsx`
  - `src/app/funds/page.tsx`
  - `src/app/settings/page.tsx`
  - `src/app/meeting/[roomId]/page.tsx`
  - `src/components/layout/AppHeader.tsx`
- **Logic & Luồng dữ liệu:**
  - Luồng Auth0 OIDC: Login trigger -> Auth0 Account Chooser -> ID Token / Session with Permissions -> Supabase User Upsert -> Redirect `/`.
  - Luồng Client Route Guard: `useAuthMock()` kiểm tra trạng thái -> Giao diện Skeleton -> Redirect `/login` nếu `!isAuthenticated`.

## 6. Lợi ích
- **Trải nghiệm người dùng (UX):** Đơn giản hóa quá trình đăng nhập về mức 1 chạm; người dùng không cần gõ bàn phím email, chỉ cần chọn tài khoản Google/Auth0 sẵn có trên trình duyệt.
- **Bảo mật & Chuẩn OAuth 2.0 / OIDC:** Phân quyền dựa trên token claims và permissions thay vì hardcode email trong frontend, loại bỏ nguy cơ lộ lọt dữ liệu hoặc phân quyền sai lệch.
- **Bảo vệ tài nguyên hệ thống:** Dữ liệu phòng họp, thông tin thành viên và quỹ cá nhân được bảo vệ nghiêm ngặt đằng sau rào chắn đăng nhập.
