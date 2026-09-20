# Enhancement: Tích Hợp Xác Thực Auth0 (Dual-Mode: Mock & Production)

## 1. Thời gian
- **Thời điểm thực hiện:** 2026-09-20 10:35 (UTC+7)

## 2. Feature
- **Authentication & Authorization Module:** Tích hợp Auth0 OIDC SDK (`@auth0/nextjs-auth0` v4) hỗ trợ chế độ kép (Dual-Mode) kiểm thử và vận hành thực tế.

## 3. Lý do change
- Theo tài liệu đặc tả [04-auth-security.md](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/docs/04-auth-security.md), Auth0 là nguồn chân lý (Source of Truth) cho xác thực định danh và vai trò toàn cục (`admin` vs `user`).
- Cần giải pháp tích hợp chuẩn xác theo kiến trúc OAuth 2.0 / Auth0 RBAC:
  - Phân quyền động trên Auth0 Dashboard (User Management > Roles).
  - Không hardcode danh sách email trong script.
  - Phân định rạch ròi giữa **Global Role** (`admin`/`user` do Auth0 cấp) và **Room Ownership** (`owner` do ứng dụng xác thực qua `room.owner_id === user.id`).
  - Hỗ trợ biến môi trường `NEXT_PUBLIC_ALLOW_MOCK_AUTH` để đội ngũ lập trình có thể linh hoạt chuyển đổi giữa chế độ giả lập (offline dev/test) và luồng xác thực Auth0 thật.

## 4. Cách thức change
1. **Core Auth0 Client & Onboarding Hook ([src/lib/auth0.ts](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/lib/auth0.ts)):**
   - Khởi tạo instance `Auth0Client` từ `@auth0/nextjs-auth0/server`.
   - Triển khai hook `beforeSessionSaved(session)`: Trích xuất `sub`, `email`, `displayName`, và role từ custom claim `https://diemdanh.cmdn/role`.
   - Sử dụng `createServerSupabaseClient` (với `SUPABASE_SERVICE_ROLE_KEY`) để gọi `userRepository.createOrSync` lưu trữ an toàn vào bảng `users`.
2. **Next.js Middleware Routing ([src/middleware.ts](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/middleware.ts)):**
   - Bắt các route mặc định của Auth0 SDK: `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile`.
   - Nếu `process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === "true"`: tự động bypass (`NextResponse.next()`).
   - Nếu `false`: chuyển giao cho `auth0.middleware(request)`.
3. **Unified Auth Context & Dual-Mode ([src/context/AuthMockContext.tsx](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/context/AuthMockContext.tsx)):**
   - Hợp nhất context để không làm gãy các page/component đang sử dụng `useAuthMock()`.
   - `MockAuthProvider`: Duy trì state giả lập với các seed user xác thực nhanh.
   - `RealAuthProviderInner`: Bọc bởi `Auth0Provider`, sử dụng hook `useUser()`, tự động đồng bộ tài khoản từ database, kiểm soát chặn tài khoản bị `soft_deleted` (Rule 5).
   - Cung cấp hàm `login()` và `logout()` nhất quán ở cả 2 chế độ.
4. **Giao diện AppHeader & Banner ([src/components/layout/AppHeader.tsx](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/components/layout/AppHeader.tsx), [src/components/layout/RoleSwitcherBanner.tsx](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/src/components/layout/RoleSwitcherBanner.tsx)):**
   - `RoleSwitcherBanner` tự động ẩn khi không ở chế độ mock.
   - `AppHeader` điều hướng đăng nhập/đăng xuất chính xác theo chế độ đang chạy.
5. **Cấu hình môi trường ([.env.example](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/.env.example)):**
   - Thêm cờ `NEXT_PUBLIC_ALLOW_MOCK_AUTH=false`.

## 5. Scope ảnh hưởng
- **Files tạo mới:**
  - `src/lib/auth0.ts`
  - `src/middleware.ts`
  - `tests/unit/auth0-sync.test.mjs`
  - `enhancement/2026-09-20-auth0-integration.md`
- **Files cập nhật:**
  - `src/context/AuthMockContext.tsx`
  - `src/components/layout/AppHeader.tsx`
  - `src/components/layout/RoleSwitcherBanner.tsx`
  - `.env.example`
  - `.env.local`
- **Data flow & Logic:**
  - Luồng callback Auth0 $\rightarrow$ Server session $\rightarrow$ Onboarding sync to Supabase `users` $\rightarrow$ Client context hook.

## 6. Lợi ích
- **Bảo mật:** Không lưu bearer tokens ở client-side (`localStorage`/`sessionStorage`), tuân thủ 100% [04-auth-security.md](file:///Users/hoang.nguyen/Projects/DiemDanhCMDN/docs/04-auth-security.md).
- **Linh hoạt (DX):** Dev có thể bật `NEXT_PUBLIC_ALLOW_MOCK_AUTH=true` để phát triển giao diện nhanh offline, hoặc `false` để kiểm thử toàn diện luồng OIDC.
- **Độ tin cậy:** Đạt 46/46 unit tests pass, TypeScript 0 lỗi, Turbopack build thành công.
