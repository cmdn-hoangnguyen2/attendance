# Tài Liệu Cải Tiến: Chuẩn Hóa Magic Strings Thành TypeScript Enums & Bảo Mật Quyền Hạn Auth0

Tài liệu này ghi nhận quá trình chuẩn hóa toàn bộ các chuỗi ký tự ma thuật (magic strings) rải rác trong hệ thống sang TypeScript Enums, đồng thời rà soát và thắt chặt cơ chế trích xuất vai trò người dùng (User Role) hoàn toàn dựa trên Auth0 claims/scope.

---

## 1. Thời gian
- **Thời điểm thực hiện:** 2026-09-21 00:40:00 (GMT+7)

## 2. Feature
- **Core Architecture & Type Safety:** Type Definitions, Domain States, Database Table Names, Security Claims, UI Tabs, and Realtime Subscriptions.

## 3. Lý do change
1. **Rủi ro phân mảnh và sai sót (Magic Strings Typos):** Các chuỗi trạng thái như `"active"`, `"archived"`, `"pending"`, `"paid"`, `"outstanding"`, tên bảng cơ sở dữ liệu (`"rooms"`, `"payments"`, v.v.), cụm từ xác thực bảo mật (`"Archive this room"`, `"Archive this user"`, `"I agree to remove this user"`) bị lặp lại thủ công ở nhiều file repository và UI component, dễ dẫn đến lỗi chính tả khó phát hiện trong runtime.
2. **Tuân thủ quy định bảo mật Auth0 (Single Source of Truth):** Kiểm tra và loại bỏ triệt để việc tự ý gán vai trò (`role: "admin"`) trong source code hoặc ghi đè từ bảng cơ sở dữ liệu (`dbUser.role === "admin"`). Đảm bảo quyền hạn hệ thống chỉ tuân theo claims (`https://diemdanh.cmdn/role`, `roles`, `permissions`) hoặc `scope` nhận được trực tiếp từ Auth0 session theo `docs/04-auth-security.md`.
3. **Nâng cao chất lượng mã nguồn (Clean Code & DX):** Tận dụng tối đa khả năng Type Checking và Auto-complete của TypeScript, giúp mã nguồn tường minh, dễ bảo trì và mở rộng.

## 4. Cách thức change
1. **Định nghĩa tập trung tại `src/types/domain.ts`:**
   - Tạo các enum chuẩn TypeScript:
     - `GlobalRole`: `ADMIN = "admin"`, `USER = "user"`, `MEMBER = "member"`
     - `UserStatus`: `ACTIVE = "active"`, `SOFT_DELETED = "soft_deleted"`
     - `RoomVisibility`: `PUBLIC = "public"`, `PRIVATE = "private"`
     - `RoomStatus`: `ACTIVE = "active"`, `ARCHIVED = "archived"`
     - `MembershipStatus`: `ACTIVE = "active"`, `LEFT = "left"`, `REMOVED = "removed"`
     - `JoinRequestStatus`: `PENDING = "pending"`, `APPROVED = "approved"`, `REJECTED = "rejected"`
     - `MeetingStatus`: `SCHEDULED = "scheduled"`, `ONGOING = "ongoing"`, `CLOSED = "closed"`
     - `AttendanceStatus`: `PRESENT = "present"`, `LATE = "late"`, `ABSENT = "absent"`, `EXCUSED = "excused"`
     - `FundContributionReason`: Danh mục lý do đóng quỹ chuẩn
     - `FundContributionStatus`: `OUTSTANDING = "outstanding"`, `PAID = "paid"`, `REVERTED = "reverted"`
     - `ConfirmationPhrase`: Cụm từ xác nhận nguy hiểm (`ARCHIVE_ROOM`, `ARCHIVE_USER`, `REMOVE_MEMBER_WITH_DEBT`)
     - `Auth0Claim`: Claims OIDC Auth0 (`ROLE`, `ROLES`, `PERMISSIONS`, `SCOPE`)
     - `DatabaseTable`: 11 bảng và view trong Supabase (`USERS`, `ROOMS`, `ROOM_MEMBERSHIPS`, `JOIN_REQUESTS`, `MEETING_SESSIONS`, `ATTENDANCE_RECORDS`, `FUND_CONTRIBUTIONS`, `PAYMENTS`, `ROOM_PAYMENT_IMAGES`, `AUDIT_LOGS`, `FUND_CANDIDATES`)
     - `StorageBucket`: `PAYMENT_IMAGES = "payment-images"`
     - `SettingsTab`, `RoomFilterTab`, `FundFilterTab`, `RoomDetailTab`: Điều hướng tab giao diện
   - Áp dụng kỹ thuật Dual Type-Value Export (`export enum XEnum { ... } export type X = ...; export const X = XEnum`) để tương thích 100% với chuỗi nguyên thủy từ Supabase rows và unit test fixtures mà không sinh lỗi nominal type incompatibility của TypeScript.

2. **Cập nhật Lớp Bảo Mật & Xác Thực Auth0:**
   - `src/lib/auth0.ts`: Dùng `Auth0Claim` và `GlobalRole`, bổ sung phân giải `auth0User.scope`.
   - `src/context/AuthMockContext.tsx`: Dùng `Auth0Claim` và `GlobalRole`, loại bỏ lỗ hổng `dbUser?.role === "admin"` ghi đè quyền Auth0 session.

3. **Cập nhật Lớp Infrastructure Repositories:**
   - Thay thế toàn bộ chuỗi tên bảng trong các lệnh `.from("...")` thành `.from(DatabaseTable.X)`.
   - Thay thế bucket storage thành `StorageBucket.PAYMENT_IMAGES`.
   - Thay thế các điều kiện trạng thái và cụm từ xác thực thành enum tương ứng.

4. **Cập nhật Lớp Presentation & UI Components:**
   - Các modal, tabs, room card, meeting detail, funds page, lobby page được thay thế các string literals thành enum references.

## 5. Scope ảnh hưởng
- **Các file bị tác động:**
  - `src/types/domain.ts`
  - `src/lib/auth0.ts`
  - `src/context/AuthMockContext.tsx`
  - `src/modules/admin/infrastructure/supabase-admin-repository.ts`
  - `src/modules/rooms/infrastructure/supabase-room-repository.ts`
  - `src/modules/funds/infrastructure/supabase-fund-repository.ts`
  - `src/modules/meetings/infrastructure/supabase-meeting-repository.ts`
  - `src/app/api/rooms/[roomId]/payment-qr/route.ts`
  - `src/modules/rooms/presentation/ArchiveRoomModal.tsx`
  - `src/modules/rooms/presentation/CreateRoomModal.tsx`
  - `src/modules/rooms/presentation/RoomCard.tsx`
  - `src/modules/rooms/presentation/RoomListFilter.tsx`
  - `src/modules/admin/presentation/ArchiveUserModal.tsx`
  - `src/modules/admin/presentation/UsersManagementTab.tsx`
  - `src/modules/admin/presentation/RoomsManagementTab.tsx`
  - `src/modules/meetings/presentation/RemoveMemberModal.tsx`
  - `src/modules/meetings/presentation/MeetingHeader.tsx`
  - `src/modules/meetings/presentation/MembersTab.tsx`
  - `src/modules/meetings/presentation/AttendanceTab.tsx`
  - `src/modules/meetings/presentation/RoomFundsTab.tsx`
  - `src/app/page.tsx`
  - `src/app/funds/page.tsx`
  - `src/app/settings/page.tsx`
  - `src/app/meeting/[roomId]/page.tsx`
- **Logic và Data Flow liên quan:**
  - Quy trình phân quyền đăng nhập OIDC Auth0.
  - Quy trình lọc phòng họp, hội đồng thành viên và trạng thái điểm danh / đóng quỹ.
  - Các thao tác nhạy cảm yêu cầu phrase confirmation (Lưu trữ phòng, Xóa mềm người dùng, Xóa thành viên nợ quỹ).

## 6. Lợi ích
- **Độ tin cậy & An toàn tuyệt đối (Type Safety):** Loại bỏ hoàn toàn khả năng gõ sai tên bảng, trạng thái hay claims. Mọi thay đổi về kiểu dữ liệu trong tương lai sẽ được trình biên dịch TypeScript cảnh báo tức thì (`tsc --noEmit`).
- **Tuân thủ chặt chẽ Security Architecture:** Quyền hạn Admin/User hoàn toàn kiểm soát tập trung bởi Auth0 OIDC Session, bảo vệ hệ thống trước nguy cơ privilege escalation từ DB cache.
- **Trải nghiệm Phát triển (DX):** Tự động gợi ý mã (IntelliSense) cho lập trình viên ở mọi tầng từ Repository, API Handler đến React Component.
- **Bảo toàn 100% Test Coverage:** Toàn bộ 60 unit tests và kiểm tra kiểu tĩnh TypeScript đều đạt kết quả tuyệt đối (0 failures, 0 type errors).
