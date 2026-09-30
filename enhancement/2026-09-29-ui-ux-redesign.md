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

## 6. Lợi ích

- Tạo một visual language thống nhất và dễ maintain trước MVP.
- Cải thiện khả năng scan, focus và thao tác trên desktop, tablet và mobile.
- Giảm presentation drift và các pattern AI-generated không phục vụ task chính.
- Giữ ranh giới rõ ràng giữa presentation changes và protected business behavior.
