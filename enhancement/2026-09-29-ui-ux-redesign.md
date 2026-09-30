# UI/UX Redesign — Cobalt Commons

## 1. Thời gian

- Bắt đầu: 2026-09-29 (Asia/Ho_Chi_Minh)
- Trạng thái: Baseline đã được checkpoint và verification đã hoàn tất.

## 2. Feature

- Complete visual reset cho DiemDanhCMDN.
- Design direction: Cobalt Commons, light theme, Vietnamese-first.
- Responsive targets: desktop, tablet landscape/portrait, và mobile.
- Approved spec: `docs/superpowers/specs/2026-09-29-ui-ux-redesign-design.md`.
- Approved plan: `docs/superpowers/plans/2026-09-29-ui-ux-redesign.md`.

## 3. Lý do change

- UI hiện tại thiếu visual hierarchy, consistency và responsive behavior có chủ đích.
- Design system hiện tại còn presentation drift và chưa có semantic token governance thống nhất.
- Cần loại bỏ các AI UI slop patterns đã được xác định trong approved spec mà không thay đổi nghiệp vụ.

## 4. Cách thức change

- Triển khai theo từng phase: foundation, shared primitives, application shell, Home pilot, member surfaces, room workspace, admin, và final cleanup.
- Áp dụng semantic tokens, Plus Jakarta Sans, Hugeicons, 8-point grid và low-motion states.
- Giữ nguyên handlers, callback arguments, repository/API calls, permissions, realtime behavior, payloads và business state transitions.
- Dùng test-first cho các UI contract mới; giữ nguyên toàn bộ existing business tests.

## 5. Scope ảnh hưởng

### Baseline

- User-owned checkpoint: `f207ac369cb5bb6545fb0cd2fddeb5bc1b052840` (`chore: checkpoint before UI UX redesign`).
- Implementation branch: `codex/ui-ux-redesign`.
- Pre-redesign `git status --short`: clean (không có output).
- Checkpoint inventory: 40 files, 1,968 insertions, 467 deletions.

### Presentation files được phép thay đổi

- `src/app/globals.css`, `src/app/layout.tsx`, và JSX presentation trong các approved page files.
- `src/components/layout/**` và `src/components/ui/**` được liệt kê trong implementation plan.
- `src/modules/*/presentation/**` được liệt kê trong implementation plan.
- `docs/06-ui-mock-phase.md`, `docs/design-system.html`, `public/design-system.html`.
- Hai UI contract tests mới: `tests/unit/ui-design-contract.test.mjs` và `tests/unit/app-navigation.test.mjs`.

### Protected paths — read-only

- `src/modules/**/domain/**`
- `src/modules/**/infrastructure/**`
- `src/lib/repository/**`
- `src/lib/realtime/**`
- `src/app/api/**`
- `src/types/domain.ts`
- `src/types/database.ts`
- `supabase/**`
- Existing `tests/unit/*.test.mjs`, ngoại trừ hai UI contract test mới nêu trên.

### Verification evidence

- `pnpm test`: PASS — 61 tests, 28 suites, 0 failed, 0 skipped.
- `pnpm exec tsc --noEmit`: PASS — exit code 0, không có diagnostics.
- `pnpm lint`: PASS — exit code 0, 0 errors, 20 pre-existing warnings.
- Baseline lint warnings thuộc checkpoint trước redesign, chủ yếu gồm unused imports/variables, missing hook dependencies và một `no-img-element` warning. Task 0 không sửa các warnings này vì đây là baseline evidence, không phải regression do redesign.
- Worktree dependencies được dựng từ `pnpm install --offline --frozen-lockfile`; lockfile không thay đổi và không có package mới.
- Live Refero research: unavailable (`NO_SUBSCRIPTION`); approved spec remains the locked design authority.

### Task 3 — Responsive application shell

- Replaced the duplicate header/subnavigation composition with one role-aware application shell.
- Desktop uses a persistent sidebar; tablet uses a top-bar drawer; mobile uses bottom navigation plus a complete `Thêm` drawer.
- Preserved `AuthMockProvider > RoleSwitcherBanner > AppShell` provider order and the existing login/logout callbacks.
- Notification repository actions and realtime refresh remain unchanged; only presentation and accessible interaction states were restyled.
- `PageLayout` now owns content/context composition. Temporary deprecated aliases keep intermediate screens compiling until their approved migration tasks.
- Verification: navigation contract 3/3, full suite 69/69, TypeScript pass, scoped ESLint pass.
- Visual limitation: the real Auth0 login route was smoke-tested with no horizontal overflow. Member/admin visual states require explicit mock-auth authorization and were not bypassed.

### Task 4 — Home pilot wiring lock

| Surface | Current wiring that must remain unchanged |
| --- | --- |
| `RoomCard` | Receives `room`, resolved `owner`, `currentUser`, derived `isOwner`/`isMember`, request status, `handleRequestJoin`, `handleCancelRequest`, and `layout="catalog"`. |
| `RoomListFilter` | Controlled by `searchQuery`/`setSearchQuery` and `activeTab`/`setActiveTab`; receives the derived filtered room count. |
| `CreateRoomModal` | Controlled by `isCreateModalOpen`; close sets it to `false`; submit calls `handleCreateRoom` with `{ name, type, visibility }`. |
| `OnlineUsersSidebar` | Supplied as Home context content with no business props; it continues to own presence/user lookup and duplicate-session logout behavior. |
| `handleCreateRoom` | Keeps owner fallback, `roomRepository.create`, prepend-to-list, and joined-room update exactly as-is. |
| `handleRequestJoin` | Keeps unauthenticated login, public direct membership, private request creation, member-count increment, and request-status update exactly as-is. |
| `handleCancelRequest` | Keeps joined/approved guard, pending-request lookup, repository cancel call, and local status reset exactly as-is. |

Task 4 review gate: presentation may change, but the rows above must match the final diff before the pilot is committed.

### Theme adjustment

- BOSS requested a white canvas after reviewing the Home pilot.
- `color-canvas` and the root background now use `#FFFFFF`; surface-subtle and semantic tokens remain unchanged so cards, borders, controls, and states keep contrast.

### Task 4 verification

- Mock auth was enabled only as a process environment variable after BOSS approved it; `.env.local` was not modified.
- At 1440px, the Home pilot shows the persistent sidebar, 280px online-member rail, page header, filters, room catalog, and no horizontal overflow.
- At 390px, the Home pilot uses one column, bottom navigation, a member drawer trigger, a bottom-sheet create-room dialog, focus on `room-name`, and no horizontal overflow.
- Fixed a mobile notification popover overflow reproduced at 390px; its bounds now stay within the viewport.
- Native drawer focus was verified: opening `Thêm` places focus on `Đóng menu`, and the dialog reports modal state.
- Full regression: 69/69 tests pass; TypeScript passes with incremental output disabled; scoped ESLint has 0 errors and only the two pre-existing Home hook warnings.

## Common style guardrails — BOSS follow-up

- BOSS yêu cầu khóa common style để tránh quay lại layout cũ, border không nhất quán, quá nhiều border, spacing dư thừa và card-heavy composition.
- Header contract: chỉ giữ notification và user information trên header; logout phải nằm trong sidebar account section hoặc mobile `Thêm` drawer. Đây chỉ là thay đổi vị trí presentation; logout callback, auth behavior và role logic phải giữ nguyên.
- Border contract: default `1px solid #DDE2EA`; strong `1px solid #B8C0CE` chỉ cho focus/selected/high-value separation; không dùng nested hoặc double borders và không dùng semantic/community colors làm border trang trí.
- Density contract: `8/16px` cho nội bộ, `24px` cho block liên quan, `32px` cho major sections, `48px` chỉ cho page-level separation; peer sections phải dùng cùng gap token.
- Layout contract: ưu tiên `PageHeader -> context/filter -> primary content -> secondary context`; dùng structured rows/content panels thay vì lặp nhiều floating cards.
- Tasks 3-9 phải review desktop/tablet/mobile side by side và ghi lại old-layout regression, header order, logout location, border count, spacing consistency, card repetition và primary-action visibility.

### Common style implementation

- Header chỉ còn notification và user information; logout được chuyển vào account section của sidebar và mobile `Thêm` drawer, giữ nguyên callback `logout()`.
- Bỏ divider trang trí khỏi `PageHeader`; khai báo một nhóm recipe dùng chung cho page stack, section stack, data row và form field bằng semantic tokens hiện có.
- My Rooms bỏ fixed-height `600px`, sử dụng structured rows, PageHeader, segmented tabs, search có label, loading/empty/search states và pagination hiện hữu.
- My Funds thay ba KPI cards bằng một summary region, đặt nghĩa vụ chưa nộp trước lịch sử thanh toán và chuyển `PaymentInfoModal` sang native `ResponsiveDialog`.
- Runtime evidence: desktop, tablet portrait và mobile không có horizontal document overflow; payment dialog nhận focus, đóng bằng Escape và trả focus về nút mở.
- Automated evidence: TypeScript exit 0, scoped ESLint exit 0, full business suite 69/69 pass; protected repository, realtime, API, domain, migration và existing test files không thay đổi.

### Task 6 — Room workspace wiring lock

| Surface | Contract phải giữ nguyên trong redesign |
| --- | --- |
| `MeetingHeader` | Giữ nguyên toàn bộ props, `RoomStatus.ARCHIVED` chỉ hiển thị Funds, callbacks mở archive/transfer/payment QR/leave và local state của `RoomSettingsModal`. |
| `AttendanceTab` | Giữ nguyên cách tính `isPastDeadline`, `myRecord`/`myStatus`, snapshot `activeCandidates`, ba giá trị `PRESENT`/`LEAVE`/`ABSENT`, và arguments của ba callbacks. |
| `MembersTab` | Giữ nguyên pending-request filter, search theo name/email, approve/reject/remove callbacks, outstanding-debt lookup và local open/selected state của hai modal. |
| `AccessRevokedModal` | Non-dismissible; chỉ cho phép quay về Home và giữ callback `onBackToHome`. |
| `LeaveRoomModal` | Giữ `room`, `onClose`, `onConfirmLeave` và nội dung bảo lưu nghĩa vụ quỹ. |
| `RemoveMemberModal` | Giữ exact phrase `ConfirmationPhrase.REMOVE_MEMBER_WITH_DEBT`, điều kiện `isConfirmed`, reset input khi đóng và callback với `member.id`. |
| `InviteMemberModal` | Giữ props, local search state, mock-user dataset và action gửi lời mời hiện tại; chỉ thay dialog/presentation. |
| Meeting page | Không sửa handler bodies, repository/API/realtime hooks, permission checks, enum values hoặc conditional render theo archive/type/tab. |

Task 6 review gate: diff chỉ được thay composition, style và accessible dialog behavior; bảng contract trên phải khớp trước khi commit.

### Task 6 verification

- Room workspace desktop rendered with the new identity/context header, permission action, scannable tabs and structured member rows; the existing marquee remains intentionally deferred to Task 7.
- Tablet `768x1024` and mobile `390x844` rendered with the responsive shell and bottom navigation; mobile DOM measurement reported `scrollWidth = 390` and `bodyScrollWidth = 390` (no horizontal overflow).
- Member role runtime showed the leave action; Leave dialog opened as a native modal, focused `Hủy bỏ`, closed with Escape, and returned focus to `Rời phòng` without overflow.
- Admin runtime showed pending requests, debt status and remove actions; Remove dialog focused the exact debt confirmation input, kept `Xác nhận xóa` disabled until the required phrase, and Escape returned focus to the selected remove action.
- Invite dialog opened as a native modal, focused `Đóng cửa sổ`, had zero horizontal overflow, and Escape returned focus to `Mời thành viên`.
- Attendance tab rendered the session/deadline state, current-user actions, status list and owner override selector; tab switching remained presentation-only.
- Static/regression evidence: membership lifecycle 7/7 pass; full suite 69/69 pass; TypeScript exit 0; scoped ESLint exit 0 with only the two pre-existing meeting-page warnings; `git diff --check` pass; no protected path diff.

## 6. Lợi ích

- Tạo một visual language thống nhất và dễ maintain trước MVP.
- Cải thiện khả năng scan, focus và thao tác trên desktop, tablet và mobile.
- Giảm presentation drift và các pattern AI-generated không phục vụ task chính.
- Giữ ranh giới rõ ràng giữa presentation changes và protected business behavior.
