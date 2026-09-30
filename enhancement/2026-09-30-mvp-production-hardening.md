# MVP Production Hardening

## 1. Thời gian

- Bắt đầu: 2026-09-30 (Asia/Ho_Chi_Minh)
- Trạng thái: Architectural spec được BOSS duyệt; implementation plans A-H đã self-review, chờ review implementation plan

## 2. Feature

- Audit toàn bộ redesign Tasks 1-7 để tìm missing feature, behavior, realtime, component state và mock data.
- Loại bỏ runtime mock data và mock authentication.
- Reset dữ liệu local/linked development, không migrate records cũ.
- Hoàn thiện Auth0, Supabase RLS, command boundary, transaction, realtime, notification, Storage và test coverage.
- Chỉ sửa UI khi cần cho contrast, accessibility hoặc behavior thật; không thực hiện redesign lần hai.

## 3. Lý do change

- UI regression suite hiện tại pass nhưng chưa chứng minh các flow chạy end to end với Backend thật.
- Runtime còn mock auth, mock invite users, mock peer debts, seed data và placeholder/no-op behavior.
- Auth0 identity chưa được nối rõ vào Supabase RLS; policy đọc/ghi hiện tại có nguy cơ vừa overexpose read vừa reject browser mutation.
- Một số multi-record mutation chưa atomic; payment revert xung đột với append-only database trigger.
- Realtime, notification, conflict, reconnect, error và permission states chưa có coverage đầy đủ.

## 4. Cách thức change

- Dùng `docs/superpowers/specs/2026-09-30-mvp-production-hardening-design.md` làm architectural source of truth.
- Khóa destructive reset bằng environment/project-reference guard; chỉ chạy trên target non-production đã được chứng minh.
- Giữ schema reproducible, reset không seed và tạo dữ liệu mới qua authenticated product flows.
- Dùng Auth0 third-party token cho Supabase RLS-protected read/realtime; dùng server command hoặc transactional function cho privileged/multi-record mutations.
- Realtime đóng vai trò invalidation signal và refetch authoritative state; Presence không dùng cho authorization.
- Master plan: `docs/superpowers/plans/2026-09-30-mvp-hardening.md`.
- Các implementation plans A-H có target files, interfaces, failing-test cases, implementation steps, verification và acceptance gates.
- Execution đã chọn trước đó: Native; tiếp tục trong worktree `codex/ui-ux-redesign`.
- Zero-mock closure theo dependency: A xóa dead fixtures/seeds, B xóa mock auth, C thay mock invite, F thay mock debt; F/H chạy gate cuối.
- Giữ rule cũ: Channel invite-only, full integer-VND payment, không due date/partial-payment flow.
- Self-review đã khóa shared SQL command signature, Idempotency-Key, transaction lock order, package dependencies, zero-mock gate và audit coverage Tasks 1-7.
- Bổ sung RLS risk: `current_user='postgres'` trong SECURITY DEFINER có thể vượt policy khi function owner là postgres; deployed owner/grants chưa được kiểm tra. A/B phải loại bỏ shortcut này và chứng minh anon writes bị deny.
- Research từ official Supabase/Auth0/WCAG docs được gắn trong owning plans; actual tenant config/CLI/test credentials là execution prerequisites, chưa được claim hoàn tất.
- Lượt này chỉ thay documentation; không chạy reset, không sửa source code và không chạy lại application build/tests vì chưa có code change.

## 5. Scope ảnh hưởng

- Auth, RLS, migrations, server commands, repositories, realtime hooks, notifications, Storage và feature modules.
- Unit/integration/RLS/realtime/E2E/accessibility/responsive tests.
- Shared UI primitives và route presentation chỉ khi cần sửa functional state, contrast hoặc accessibility.
- Không bao gồm production data reset và không thay đổi lại visual direction Cobalt Commons.

## 6. Lợi ích

- Loại bỏ khoảng cách giữa UI demo và sản phẩm dùng dữ liệu thật.
- Giảm rủi ro data leak, rejected mutation, duplicate financial effect và inconsistent concurrent state.
- Có feature inventory, realtime matrix, conflict rules và acceptance gates rõ ràng cho MVP.
- Cho phép triển khai theo package nhỏ, review được và có rollback boundary rõ ràng.
