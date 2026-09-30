# DiemDanhCMDN UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the DiemDanhCMDN presentation with the approved Cobalt Commons responsive design system without changing business behavior, data contracts, permissions, realtime behavior, or existing business tests.

**Architecture:** Introduce semantic Tailwind v4 tokens and a small set of shared presentation primitives, then replace the current header/subnavigation composition with a responsive application shell. Roll the visual system through one screen group at a time while preserving existing page handlers and component callback contracts. Each task ends with targeted static checks, the unchanged business suite, and a role/viewport review gate.

**Tech Stack:** Next.js 16.3.5 App Router, React 19.2.8, TypeScript strict mode, Tailwind CSS v4, `next/font`, Hugeicons, native HTML dialog behavior, Node.js test runner.

**Spec:** `docs/superpowers/specs/2026-09-29-ui-ux-redesign-design.md`

## Global Constraints

- Presentation-only scope. Do not modify domain policies, repositories, API handlers, Supabase, Auth0, realtime hooks, migrations, RLS, payloads, permissions, or business state transitions.
- Preserve the exact phrases `Archive this user`, `Archive this room`, and `I agree to remove this user`.
- Use Vietnamese-first UI copy except protected business confirmation phrases.
- Use Cobalt Commons: canvas `#FFFFFF`, surface `#FFFFFF`, primary `#2F5BD3`, hover `#2446A8`, active `#1D3987`, primary soft `#E9EEFF`, community `#F59E42`, text `#172033`/`#596275`/`#667085`.
- Use Plus Jakarta Sans through `next/font/google` with Vietnamese subset support and `display: "swap"`.
- Use the existing 8-point grid. Standard control radii are `8px`, panels `16px`, large overlays `24px`.
- Hugeicons remains the only application icon family.
- Light theme only. Do not add glassmorphism, decorative gradients, glow, marquee, infinite animation, or an animation library.
- Do not add a UI component library or browser-test dependency.
- Do not edit, skip, delete, or weaken existing business tests.
- Before implementation, the current dirty worktree must have a user-owned checkpoint because approved tasks overlap currently modified UI files.
- Stage and commit only the exact files listed for each task. Never include unrelated user changes.
- Follow `AGENTS.md`: report completion and ask BOSS before running the final build/test verification batch.

## Review Focus

1. Long Vietnamese room names, member names, and action labels must wrap or truncate without hiding the primary action. Exercise this in Tasks 4-8 at `360x800` and `768x1024`.
2. Guest, member, owner, and admin navigation and action visibility must remain permission-correct. Pin navigation visibility in Task 3 and verify screen actions in Tasks 4-8.
3. Realtime updates must not reset focus, close an open overlay, or move the active action unexpectedly. Verify in Tasks 4, 6, and 7.
4. Mobile destructive dialogs must keep the impact list, exact phrase input, and submit action reachable at 200% text zoom. Verify in Tasks 7 and 8, with the existing member-removal phrase test unchanged.
5. Private, pending, archived, empty, loading, permission, and request-error states must remain recognizable at every breakpoint. Exercise the owning state in Tasks 4-8.

---

## File Structure Map

### New shared presentation files

- `src/components/ui/Button.tsx`: button variants, sizes, loading and disabled presentation.
- `src/components/ui/PageHeader.tsx`: consistent page title, description, and primary action layout.
- `src/components/ui/StatusBadge.tsx`: semantic status treatment that never relies on color alone.
- `src/components/ui/ResponsiveDialog.tsx`: native dialog shell, mobile sheet presentation, focus return, and close guards.
- `src/components/layout/AppShell.tsx`: authenticated application shell composition.
- `src/components/layout/AppNavigation.tsx`: sidebar and bottom-navigation renderers.
- `src/components/layout/appNavigationItems.mjs`: pure role-aware navigation item selection shared by both renderers.
- `tests/unit/ui-design-contract.test.mjs`: approved token, font, and protected-copy source contract.
- `tests/unit/app-navigation.test.mjs`: guest/member/admin navigation visibility contract.
- `enhancement/2026-09-29-ui-ux-redesign.md`: required enhancement log and verification evidence.

### Files retired after their consumers migrate

- `src/components/layout/GlobalSubNavigation.tsx`
- `src/components/ui/NeoMarquee.tsx`

### Existing files modified by phase

- Foundation: `src/app/globals.css`, `src/app/layout.tsx`, shared files under `src/components/ui/`.
- Shell: `src/components/layout/AppHeader.tsx`, `NotificationPopover.tsx`, `OnlineUsersSidebar.tsx`, `PageLayout.tsx`.
- Home: `src/app/page.tsx`, room catalog presentation files, `CreateRoomModal.tsx`.
- Member surfaces: `src/app/my-rooms/page.tsx`, `src/app/funds/page.tsx`, `PaymentInfoModal.tsx`.
- Room workspace: `src/app/meeting/[roomId]/page.tsx`, meeting and room presentation components.
- Admin: `src/app/settings/page.tsx`, admin presentation components.
- Documentation: `docs/06-ui-mock-phase.md`, `docs/design-system.html`, `public/design-system.html`.

### Protected files

- `src/modules/**/domain/**`
- `src/modules/**/infrastructure/**`
- `src/lib/repository/**`
- `src/lib/realtime/**`
- `src/app/api/**`
- `src/types/domain.ts`
- `src/types/database.ts`
- `supabase/**`
- Existing `tests/unit/*.test.mjs`, except the two new UI contract test files named above.

---

### Task 0: Establish a safe implementation baseline

**Files:**
- Create: `enhancement/2026-09-29-ui-ux-redesign.md`
- Read only: all currently modified and untracked paths from `git status --short`

**Interfaces:**
- Consumes: the approved spec and this plan.
- Produces: a user-owned checkpoint, baseline command results, and an enhancement log that later tasks append evidence to.

- [ ] **Step 1: Stop if overlapping work has no checkpoint**

Run: `git status --short`

Expected: BOSS identifies and commits, stashes, or otherwise checkpoints current work that overlaps the files in this plan. Do not create that checkpoint on BOSS's behalf and do not proceed while overlapping edits are ambiguous.

- [ ] **Step 2: Record the baseline diff inventory**

Write the exact pre-redesign `git status --short`, current commit, approved spec path, and protected file globs into `enhancement/2026-09-29-ui-ux-redesign.md` using the six mandatory sections from `AGENTS.md`.

- [ ] **Step 3: Ask BOSS before baseline verification**

Request permission to run the baseline test commands required by the repository workflow.

- [ ] **Step 4: Run the unchanged business baseline**

Run:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm lint
```

Expected: all existing tests pass, TypeScript exits 0, and ESLint exits 0. Record exact results in the enhancement log. Stop and report any pre-existing failure without fixing it in this redesign.

- [ ] **Step 5: Commit only the enhancement log**

```bash
git add enhancement/2026-09-29-ui-ux-redesign.md
git commit -m "docs: record UI redesign baseline"
```

---

### Task 1: Install the Cobalt Commons token and typography foundation

**Files:**
- Create: `tests/unit/ui-design-contract.test.mjs`
- Modify: `src/app/globals.css:1-51`
- Modify: `src/app/layout.tsx:1-35`

**Interfaces:**
- Consumes: exact token values and typography decisions from the approved spec.
- Produces: Tailwind theme tokens named `canvas`, `surface`, `surface-subtle`, `primary`, `primary-hover`, `primary-active`, `primary-soft`, `community`, `text-primary`, `text-secondary`, `text-tertiary`, `border`, semantic strong/soft pairs, and the CSS variable `--font-plus-jakarta`.

- [ ] **Step 1: Write the failing design-contract test**

In `tests/unit/ui-design-contract.test.mjs`, read `src/app/globals.css`, `src/app/layout.tsx`, and `src/types/domain.ts`. Assert:

- Every approved hex value and semantic token name is present in `globals.css`.
- `#10D9A3`, `#05966B`, and `--font-inter` are absent from `globals.css` and `layout.tsx`.
- `Plus_Jakarta_Sans`, `subsets: ["latin", "vietnamese"]`, and `--font-plus-jakarta` are present in `layout.tsx`.
- The three protected confirmation phrases remain present in `src/types/domain.ts`.

- [ ] **Step 2: Run the contract test and confirm the expected failure**

Run: `node --test tests/unit/ui-design-contract.test.mjs`

Expected: FAIL because the approved tokens and font are not implemented yet.

- [ ] **Step 3: Replace the theme tokens and font**

In `src/app/globals.css`, replace the mint/Inter foundation with the exact Cobalt Commons tokens, semantic colors, 8-point spacing, approved radii, body canvas, tabular-number utility, and focus-visible treatment.

In `src/app/layout.tsx`, replace `Inter` with `Plus_Jakarta_Sans`, configure `subsets: ["latin", "vietnamese"]`, `variable: "--font-plus-jakarta"`, and keep the existing provider order unchanged.

- [ ] **Step 4: Run targeted verification**

Run:

```bash
node --test tests/unit/ui-design-contract.test.mjs
pnpm exec tsc --noEmit
pnpm exec eslint src/app/layout.tsx tests/unit/ui-design-contract.test.mjs
```

Expected: contract test PASS, TypeScript exits 0, ESLint exits 0.

- [ ] **Step 5: Commit the foundation**

```bash
git add src/app/globals.css src/app/layout.tsx tests/unit/ui-design-contract.test.mjs
git commit -m "feat: establish Cobalt Commons UI foundation"
```

---

### Task 2: Build the shared UI primitives

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/PageHeader.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/ResponsiveDialog.tsx`
- Modify: `src/components/ui/EmptyState.tsx:1-44`
- Modify: `src/components/ui/PillTabs.tsx:1-59`
- Modify: `src/components/ui/SelectDropdown.tsx:1-166`
- Modify: `src/components/ui/DropdownFilter.tsx:1-87`
- Modify: `src/components/ui/Pagination.tsx:1-45`

**Interfaces:**
- Produces: `ButtonProps { variant?: "primary" | "secondary" | "ghost" | "destructive"; size?: "compact" | "default" | "touch"; isLoading?: boolean }` plus native button props.
- Produces: `PageHeaderProps { id: string; title: string; description?: string; action?: React.ReactNode }`.
- Produces: `StatusBadgeProps { tone: "info" | "success" | "warning" | "danger" | "neutral"; children: React.ReactNode }`.
- Produces: `ResponsiveDialogProps { isOpen: boolean; onClose: () => void; labelledBy: string; children: React.ReactNode; footer?: React.ReactNode; preventClose?: boolean; size?: "sm" | "md" | "lg" }`.
- Preserves: `EmptyStateProps`, `PillTabsProps`, `SelectDropdownProps`, `DropdownFilterProps`, and `PaginationProps` callback/value contracts.

- [ ] **Step 1: Create the primitive APIs with semantic variants**

Implement the four exported interfaces exactly as defined above. Use `cn()` for class composition. `Button` sets `aria-busy` and disables itself while `isLoading` is true.

- [ ] **Step 2: Implement native responsive dialog behavior**

Use a native `<dialog>` inside `ResponsiveDialog`. Call `showModal()` when `isOpen` becomes true, close it when false, prevent `cancel` when `preventClose` is true, and return focus to the element that opened it. Style it as a centered dialog from `md` upward and a bottom/full-width sheet below `md`.

- [ ] **Step 3: Restyle existing shared controls without changing their APIs**

Apply approved type, radius, color, touch-size, focus, loading, and empty-state rules. Keep all current value and callback semantics. `DropdownFilter` and `SelectDropdown` may share class constants but remain separate behavior components.

- [ ] **Step 4: Run targeted static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/components/ui/Button.tsx src/components/ui/PageHeader.tsx src/components/ui/StatusBadge.tsx src/components/ui/ResponsiveDialog.tsx src/components/ui/EmptyState.tsx src/components/ui/PillTabs.tsx src/components/ui/SelectDropdown.tsx src/components/ui/DropdownFilter.tsx src/components/ui/Pagination.tsx
pnpm test
```

Expected: TypeScript exits 0, ESLint exits 0, unchanged business suite passes.

- [ ] **Step 5: Manually verify shared control states**

Render the controls through an existing route during development and verify default, hover, focus-visible, disabled, loading, open, selected, and long-label states. Verify `ResponsiveDialog` focus return, Escape behavior, close guard, `360x800`, and `768x1024` presentation.

- [ ] **Step 6: Commit the primitives**

```bash
git add src/components/ui/Button.tsx src/components/ui/PageHeader.tsx src/components/ui/StatusBadge.tsx src/components/ui/ResponsiveDialog.tsx src/components/ui/EmptyState.tsx src/components/ui/PillTabs.tsx src/components/ui/SelectDropdown.tsx src/components/ui/DropdownFilter.tsx src/components/ui/Pagination.tsx
git commit -m "feat: add shared responsive UI primitives"
```

---

### Task 3: Replace the header/subnavigation with the responsive application shell

**Files:**
- Create: `src/components/layout/appNavigationItems.mjs`
- Create: `tests/unit/app-navigation.test.mjs`
- Create: `src/components/layout/AppNavigation.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Modify: `src/app/layout.tsx:19-35`
- Modify: `src/components/layout/AppHeader.tsx:1-114`
- Modify: `src/components/layout/NotificationPopover.tsx:1-136`
- Modify: `src/components/layout/PageLayout.tsx:1-41`
- Delete: `src/components/layout/GlobalSubNavigation.tsx`

**Interfaces:**
- Produces: `getAppNavigationItems({ isAuthenticated, isAdmin }) -> Array<{ key: "home" | "rooms" | "funds" | "admin"; href: string; label: string }>`.
- Produces: `AppNavigationProps { items: AppNavigationItem[]; pathname: string; variant: "sidebar" | "bottom" }`.
- Produces: `AppShellProps { children: React.ReactNode }`.
- Changes: `PageLayoutProps` becomes `{ children: React.ReactNode; contextRail?: React.ReactNode; className?: string }`.

- [ ] **Step 1: Write the failing role-aware navigation test**

In `tests/unit/app-navigation.test.mjs`, assert:

- Guest receives only `Trang chủ`.
- Authenticated non-admin receives `Trang chủ`, `Phòng của tôi`, and `Quỹ của tôi`.
- Admin receives all four items including `Quản trị`.
- Every item preserves the approved route.

- [ ] **Step 2: Run the navigation test and confirm failure**

Run: `node --test tests/unit/app-navigation.test.mjs`

Expected: FAIL because `appNavigationItems.mjs` does not exist.

- [ ] **Step 3: Implement the pure navigation selector**

Create `appNavigationItems.mjs` with the exact labels/routes and no UI dependencies. Keep role conditions equivalent to the current `GlobalSubNavigation` behavior.

- [ ] **Step 4: Implement the application shell**

`AppShell` reads pathname and the existing auth context, hides application navigation on `/login`, renders the `AppHeader`, desktop sidebar navigation, mobile top bar, mobile bottom navigation, and main content slot. Do not change login/logout functions or auth provider order.

- [ ] **Step 5: Convert PageLayout to content/context composition**

Remove the subnavigation responsibility. Use approved gutters and grid. Render `contextRail` as a wide-desktop rail while allowing the supplied context component to expose its own drawer/sheet trigger below that breakpoint.

- [ ] **Step 6: Run automated verification**

Run:

```bash
node --test tests/unit/app-navigation.test.mjs
pnpm exec tsc --noEmit
pnpm exec eslint src/app/layout.tsx src/components/layout/AppHeader.tsx src/components/layout/AppNavigation.tsx src/components/layout/AppShell.tsx src/components/layout/NotificationPopover.tsx src/components/layout/PageLayout.tsx src/components/layout/appNavigationItems.mjs tests/unit/app-navigation.test.mjs
pnpm test
```

Expected: navigation test PASS, static checks exit 0, unchanged business suite passes.

- [ ] **Step 7: Verify navigation by role and viewport**

Check guest, member, and admin at `1440x900`, `1024x768`, `768x1024`, `390x844`, and `360x800`. Confirm active state, notification access, profile/logout access, no covered content, and no duplicate navigation landmarks.

- [ ] **Step 8: Commit the shell**

```bash
git add src/app/layout.tsx src/components/layout/AppHeader.tsx src/components/layout/AppNavigation.tsx src/components/layout/AppShell.tsx src/components/layout/NotificationPopover.tsx src/components/layout/PageLayout.tsx src/components/layout/appNavigationItems.mjs tests/unit/app-navigation.test.mjs
git rm src/components/layout/GlobalSubNavigation.tsx
git commit -m "feat: add responsive application shell"
```

---

### Task 4: Deliver the Home pilot vertical slice

**Files:**
- Modify: `src/app/page.tsx:232-354`
- Modify: `src/components/layout/OnlineUsersSidebar.tsx:1-97`
- Modify: `src/modules/rooms/presentation/RoomCard.tsx:17-306`
- Modify: `src/modules/rooms/presentation/RoomListFilter.tsx:1-80`
- Modify: `src/modules/rooms/presentation/RoomSkeletonGrid.tsx:1-38`
- Modify: `src/modules/rooms/presentation/CreateRoomModal.tsx:1-274`

**Interfaces:**
- Consumes: `PageHeader`, `Button`, `StatusBadge`, `ResponsiveDialog`, new `PageLayout`, and existing `RoomCardProps`/`RoomListFilterProps`.
- Preserves: `handleCreateRoom`, `handleRequestJoin`, `handleCancelRequest`, current repository calls, realtime refresh, `RoomCardProps`, and modal callback signatures.

- [ ] **Step 1: Freeze the Home behavior wiring before JSX changes**

Record in the enhancement log the current prop wiring for `RoomCard`, `RoomListFilter`, `CreateRoomModal`, `OnlineUsersSidebar`, and the three handlers named above. This is the review checklist for the final diff.

- [ ] **Step 2: Recompose the Home page**

Add the approved PageHeader, one Tạo phòng action, search/filter region, room catalog, result count, loading/empty/error presentation, pagination region, and responsive online-member context. Do not change domain state transitions, effect dependencies, repository calls, or handler bodies. A local presentation-only error value may mirror an existing catch outcome without changing the request or retry contract.

- [ ] **Step 3: Redesign room presentation states**

Keep `layout="catalog"` and every existing prop. Present room name, visibility, owner, member count, relationship state, and one primary action in that order. Ensure public, private, member, owner, pending, rejected, cancel, and retry states remain distinguishable without relying on color alone.

- [ ] **Step 4: Migrate CreateRoomModal to ResponsiveDialog**

Keep `CreateRoomModalProps` and form submission behavior unchanged. Apply Vietnamese copy, approved field anatomy, responsive action layout, focus behavior, and visible validation.

- [ ] **Step 5: Run regression and static checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/app/page.tsx src/components/layout/OnlineUsersSidebar.tsx src/modules/rooms/presentation/RoomCard.tsx src/modules/rooms/presentation/RoomListFilter.tsx src/modules/rooms/presentation/RoomSkeletonGrid.tsx src/modules/rooms/presentation/CreateRoomModal.tsx
pnpm test
```

Expected: all commands exit 0; no protected files changed.

- [ ] **Step 6: Verify the Home role/state/viewport matrix**

Verify authenticated member and owner states at all approved viewports, including long room names, public join, private request, pending, cancel, rejected/re-submit, empty filter, loading skeleton, create-modal keyboard behavior, and a simulated realtime refresh that does not reset focus.

- [ ] **Step 7: Review the pilot before continuing**

Present desktop, tablet portrait/landscape, and mobile evidence to BOSS. Stop for approval before applying the system to remaining screens.

- [ ] **Step 8: Commit the pilot**

```bash
git add src/app/page.tsx src/components/layout/OnlineUsersSidebar.tsx src/modules/rooms/presentation/RoomCard.tsx src/modules/rooms/presentation/RoomListFilter.tsx src/modules/rooms/presentation/RoomSkeletonGrid.tsx src/modules/rooms/presentation/CreateRoomModal.tsx enhancement/2026-09-29-ui-ux-redesign.md
git commit -m "feat: redesign Home room discovery experience"
```

---

### Task 5: Apply the system to My Rooms and My Funds

**Files:**
- Modify: `src/app/my-rooms/page.tsx:124-279`
- Modify: `src/app/funds/page.tsx:190-426`
- Modify: `src/modules/funds/presentation/PaymentInfoModal.tsx:1-154`
- Reuse and, only if required, modify: `src/modules/rooms/presentation/RoomCard.tsx`

**Interfaces:**
- Consumes: approved shared primitives and Home pilot patterns.
- Preserves: `MyRoomsTab`, search filtering, create-room handler, fund filtering, statistics derived from existing contributions, signed QR resolution, selected-contribution state, and `PaymentInfoModalProps`.

- [ ] **Step 1: Recompose My Rooms without changing its data path**

Use PageHeader, Tôi quản lý/Tôi tham gia segmented navigation, search, structured room items, loading, empty, and pagination. Preserve owned/joined queries, realtime refresh, create-room callback, and `RoomCard` callbacks.

- [ ] **Step 2: Recompose My Funds around outstanding obligations**

Keep existing computed values because they come from real data, but replace three equal KPI cards with a compact summary and prioritize outstanding contributions before paid history. Preserve filter values, money formatting, archived-room badge, selected-contribution behavior, and signed QR loading.

- [ ] **Step 3: Migrate PaymentInfoModal to ResponsiveDialog**

Keep all props and QR `object-contain` behavior. Ensure archived-room context, owner contact, amount, reason, and close behavior remain available at mobile text zoom.

- [ ] **Step 4: Run regression and static checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/app/my-rooms/page.tsx src/app/funds/page.tsx src/modules/funds/presentation/PaymentInfoModal.tsx src/modules/rooms/presentation/RoomCard.tsx
pnpm test
```

Expected: all commands exit 0; no repository, realtime, type, or test file diff.

- [ ] **Step 5: Verify states and viewports**

Verify owned/joined/empty/search states and outstanding/paid/archived/QR states at all approved viewports. At `360x800`, confirm long Vietnamese labels do not hide the primary action.

- [ ] **Step 6: Commit the member surfaces**

```bash
git add src/app/my-rooms/page.tsx src/app/funds/page.tsx src/modules/funds/presentation/PaymentInfoModal.tsx src/modules/rooms/presentation/RoomCard.tsx enhancement/2026-09-29-ui-ux-redesign.md
git commit -m "feat: redesign member room and fund surfaces"
```

---

### Task 6: Redesign the room header, Attendance, and Members surfaces

**Files:**
- Modify: `src/app/meeting/[roomId]/page.tsx:581-878`
- Modify: `src/modules/meetings/presentation/MeetingHeader.tsx:1-173`
- Modify: `src/modules/meetings/presentation/AttendanceTab.tsx:1-329`
- Modify: `src/modules/meetings/presentation/MembersTab.tsx:1-235`
- Modify: `src/modules/meetings/presentation/AccessRevokedModal.tsx:1-82`
- Modify: `src/modules/meetings/presentation/LeaveRoomModal.tsx:1-111`
- Modify: `src/modules/meetings/presentation/RemoveMemberModal.tsx:1-164`
- Modify: `src/modules/rooms/presentation/InviteMemberModal.tsx:1-71`

**Interfaces:**
- Preserves: every prop interface exported by the listed presentation components.
- Preserves: all handlers in `meeting/[roomId]/page.tsx`, tab enum values, repository calls, deadline calculation, permission checks, member removal validation, and realtime hooks.
- Consumes: PageHeader patterns, StatusBadge, Button, ResponsiveDialog, and existing SelectDropdown contract.

- [ ] **Step 1: Record the room handler/prop contract**

Add to the enhancement log the exact current callback wiring for approve, reject, remove, self check-in, owner override, leave, and access-revoked actions. Do not edit handler bodies.

- [ ] **Step 2: Recompose MeetingHeader and room tabs**

Present back action, room identity, owner, visibility, member count, archived state, permission-aware actions, and visible tabs for Điểm danh, Thành viên, and Quỹ. Preserve archived-room forcing of the Funds tab and all modal-open callbacks.

- [ ] **Step 3: Recompose AttendanceTab**

Apply the approved order: session/deadline, current-user state, permitted action, attendance list, owner override, and candidates. Keep `isPastDeadline`, `activeCandidates`, all callbacks, and SelectDropdown values unchanged. Use text/icon/structure for attendance state.

- [ ] **Step 4: Recompose MembersTab**

Use structured rows, a priority pending-request region, visible role/status, responsive secondary metadata, and permission-aware action menus. Preserve search, approve, reject, remove, invite, and membership data.

- [ ] **Step 5: Migrate member/access dialogs**

Move AccessRevoked, LeaveRoom, RemoveMember, and InviteMember presentation onto ResponsiveDialog without changing prop types, exact confirmation phrase, submit conditions, or callbacks.

- [ ] **Step 6: Run targeted business and static checks**

Run:

```bash
node --test tests/unit/membership-lifecycle.test.mjs
pnpm exec tsc --noEmit
pnpm exec eslint 'src/app/meeting/[roomId]/page.tsx' src/modules/meetings/presentation/MeetingHeader.tsx src/modules/meetings/presentation/AttendanceTab.tsx src/modules/meetings/presentation/MembersTab.tsx src/modules/meetings/presentation/AccessRevokedModal.tsx src/modules/meetings/presentation/LeaveRoomModal.tsx src/modules/meetings/presentation/RemoveMemberModal.tsx src/modules/rooms/presentation/InviteMemberModal.tsx
pnpm test
```

Expected: membership tests and full suite pass; static checks exit 0.

- [ ] **Step 7: Verify room roles, realtime, and mobile dialogs**

Verify member, owner, and admin at all approved viewports; before/after deadline; present/leave/absent; pending requests; permission denial; member removal with/without debt; 200% text zoom; and a realtime update while focus remains inside the active control/dialog.

- [ ] **Step 8: Commit Attendance and Members**

```bash
git add 'src/app/meeting/[roomId]/page.tsx' src/modules/meetings/presentation/MeetingHeader.tsx src/modules/meetings/presentation/AttendanceTab.tsx src/modules/meetings/presentation/MembersTab.tsx src/modules/meetings/presentation/AccessRevokedModal.tsx src/modules/meetings/presentation/LeaveRoomModal.tsx src/modules/meetings/presentation/RemoveMemberModal.tsx src/modules/rooms/presentation/InviteMemberModal.tsx enhancement/2026-09-29-ui-ux-redesign.md
git commit -m "feat: redesign attendance and member workspace"
```

---

### Task 7: Redesign Room Funds and room-management overlays

**Files:**
- Modify: `src/app/meeting/[roomId]/page.tsx:397-542,722-878`
- Modify: `src/modules/meetings/presentation/RoomFundsTab.tsx:1-291`
- Modify: `src/modules/funds/presentation/CreateFundContributionModal.tsx:1-254`
- Modify: `src/modules/funds/presentation/UploadPaymentQrModal.tsx:1-275`
- Modify: `src/modules/rooms/presentation/RoomSettingsModal.tsx:1-184`
- Modify: `src/modules/rooms/presentation/ArchiveRoomModal.tsx:1-184`
- Modify: `src/modules/rooms/presentation/TransferOwnershipModal.tsx:1-198`
- Modify: `src/modules/rooms/presentation/PeerDebtDashboard.tsx:1-94`
- Delete: `src/components/ui/NeoMarquee.tsx`

**Interfaces:**
- Preserves: all listed component props, create-contribution payload, confirm/revert callbacks, QR upload/delete callbacks, archive/transfer callbacks, protected phrases, archived-room access, and signed URL behavior.
- Removes: decorative marquee presentation and its derived `marqueeMessages`; no data or notification behavior is removed.

- [ ] **Step 1: Remove only the decorative marquee path**

Delete the `NeoMarquee` import, `marqueeMessages` derived presentation value, render call, and component file. Confirm no handler, notification record, realtime subscription, or repository call is removed.

- [ ] **Step 2: Recompose RoomFundsTab**

Order payment/QR information, outstanding contributions, paid contributions, creation tools, and archived context. Keep all callback arguments and contribution/payment status behavior unchanged.

- [ ] **Step 3: Migrate fund and room-management dialogs**

Use ResponsiveDialog for CreateFundContribution, UploadPaymentQr, RoomSettings, ArchiveRoom, and TransferOwnership. Preserve exact form values, validation, protected phrases, async states, and callback ordering. Prevent close during destructive or upload submission.

- [ ] **Step 4: Restyle PeerDebtDashboard only if it is an active consumer**

Use `rg -n "PeerDebtDashboard" src` during execution. If there is no active consumer, leave the file unchanged and record it as deferred presentation debt rather than wiring a new feature.

- [ ] **Step 5: Run targeted fund/storage/business checks**

Run:

```bash
node --test tests/unit/membership-lifecycle.test.mjs tests/unit/payment-qr-upload.test.mjs
pnpm exec tsc --noEmit
pnpm exec eslint 'src/app/meeting/[roomId]/page.tsx' src/modules/meetings/presentation/RoomFundsTab.tsx src/modules/funds/presentation/CreateFundContributionModal.tsx src/modules/funds/presentation/UploadPaymentQrModal.tsx src/modules/rooms/presentation/RoomSettingsModal.tsx src/modules/rooms/presentation/ArchiveRoomModal.tsx src/modules/rooms/presentation/TransferOwnershipModal.tsx
pnpm test
```

Expected: targeted tests and full suite pass; static checks exit 0.

- [ ] **Step 6: Verify funds and destructive states**

Verify outstanding/paid, confirm/revert, candidate/manual creation, QR upload/readback, archived room, archive phrase, transfer ownership, long impact lists, 200% zoom, and all approved viewports. Confirm realtime refresh does not close an active dialog.

- [ ] **Step 7: Commit Room Funds and overlays**

```bash
git add 'src/app/meeting/[roomId]/page.tsx' src/modules/meetings/presentation/RoomFundsTab.tsx src/modules/funds/presentation/CreateFundContributionModal.tsx src/modules/funds/presentation/UploadPaymentQrModal.tsx src/modules/rooms/presentation/RoomSettingsModal.tsx src/modules/rooms/presentation/ArchiveRoomModal.tsx src/modules/rooms/presentation/TransferOwnershipModal.tsx src/modules/rooms/presentation/PeerDebtDashboard.tsx enhancement/2026-09-29-ui-ux-redesign.md
git rm src/components/ui/NeoMarquee.tsx
git commit -m "feat: redesign room funds and management overlays"
```

---

### Task 8: Redesign the admin workspace

**Files:**
- Modify: `src/app/settings/page.tsx:134-252`
- Modify: `src/modules/admin/presentation/UsersManagementTab.tsx:1-290`
- Modify: `src/modules/admin/presentation/RoomsManagementTab.tsx:1-332`
- Modify: `src/modules/admin/presentation/ArchiveUserModal.tsx:1-228`

**Interfaces:**
- Preserves: auth redirect, `isAdmin` permission check, mock-role switch, archive/restore handlers, replacement-admin selection, exact archive phrase, and all component prop interfaces.
- Consumes: AppShell, PageHeader, shared controls, DataRow pattern, and ResponsiveDialog.

- [ ] **Step 1: Preserve permission and handler wiring**

Record the settings permission branches and archive/restore callback wiring in the enhancement log. Do not edit handler bodies or `ConfirmationPhrase` arguments.

- [ ] **Step 2: Recompose the Settings page**

Use PageHeader and visible Người dùng/Phòng tabs. Present permission denial as an inline blocking state. Keep the mock-role switch and login action behavior unchanged.

- [ ] **Step 3: Convert admin datasets to responsive data rows**

Use table/structured rows on desktop and stacked rows on mobile. Keep identifiers, state, search/filter values, restore action, archive action, and active/archived segments visible according to permission.

- [ ] **Step 4: Migrate ArchiveUserModal**

Use ResponsiveDialog. Preserve impacted-room list, replacement-admin selection, exact phrase validation, transfer-before-archive behavior, and prevent-close state during submission.

- [ ] **Step 5: Run targeted and full verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/app/settings/page.tsx src/modules/admin/presentation/UsersManagementTab.tsx src/modules/admin/presentation/RoomsManagementTab.tsx src/modules/admin/presentation/ArchiveUserModal.tsx
pnpm test
```

Expected: static checks exit 0; unchanged business suite passes.

- [ ] **Step 6: Verify admin states**

Verify non-admin denial, mock-role switch, active/archived users, active/archived rooms, restore, archive, replacement admin, long impacted-room list, exact phrase, mobile reachability, 200% zoom, and all approved viewports.

- [ ] **Step 7: Commit the admin workspace**

```bash
git add src/app/settings/page.tsx src/modules/admin/presentation/UsersManagementTab.tsx src/modules/admin/presentation/RoomsManagementTab.tsx src/modules/admin/presentation/ArchiveUserModal.tsx enhancement/2026-09-29-ui-ux-redesign.md
git commit -m "feat: redesign responsive admin workspace"
```

---

### Task 9: Remove legacy presentation drift and complete final verification

**Files:**
- Modify: `docs/06-ui-mock-phase.md:7-33`
- Modify: `docs/design-system.html`
- Modify: `public/design-system.html`
- Modify: `enhancement/2026-09-29-ui-ux-redesign.md`
- Inspect: all changed presentation files from Tasks 1-8
- Test: `tests/unit/ui-design-contract.test.mjs`

**Interfaces:**
- Consumes: the complete approved implementation.
- Produces: one documented design system, no legacy mint/Inter/marquee references in active application UI, and recorded verification evidence.

- [ ] **Step 1: Extend the design-contract test for final cleanup**

Scan active `src/app`, `src/components`, and `src/modules/*/presentation` source files and assert they do not contain `#10D9A3`, `#05966B`, `--font-inter`, `NeoMarquee`, or `animate-marquee`. Exclude business strings and non-presentation files from this scan.

- [ ] **Step 2: Run the extended test and identify remaining legacy presentation**

Run: `node --test tests/unit/ui-design-contract.test.mjs`

Expected: FAIL only on legacy presentation references that remain after Tasks 1-8.

- [ ] **Step 3: Remove remaining visual drift**

Replace only the reported legacy presentation references with approved semantic tokens or shared primitives. Do not expand scope into unrelated cleanup.

- [ ] **Step 4: Update canonical design documentation**

Update `docs/06-ui-mock-phase.md` with Vietnamese-first, Plus Jakarta Sans, Cobalt Commons, responsive shell, and protected English phrase exceptions. Update `docs/design-system.html`, then make `public/design-system.html` identical so the public preview matches the canonical document.

- [ ] **Step 5: Self-review the protected diff**

Run:

```bash
git diff --name-only
git diff -- src/modules src/lib src/app/api src/types supabase tests/unit
```

Expected: only approved presentation paths and the two new UI tests appear. No protected production or existing test file has a diff.

- [ ] **Step 6: Report implementation completion and ask BOSS before final verification**

Summarize completed phases, known limitations, and exact commands to run. Wait for approval, as required by `AGENTS.md`.

- [ ] **Step 7: Run final automated verification after approval**

Run:

```bash
node --test tests/unit/ui-design-contract.test.mjs tests/unit/app-navigation.test.mjs
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 8: Run the final role/viewport/accessibility matrix**

Verify guest, member, owner, and admin flows at `1440x900`, `1280x800`, `1024x768`, `768x1024`, `390x844`, and `360x800`. Check overflow, navigation, long Vietnamese content, primary-action reachability, dialogs/sheets, keyboard order, focus return, 200% zoom, loading, empty, error, permission, private, pending, archived, and realtime-update behavior.

- [ ] **Step 9: Record evidence and commit final documentation**

Append commands, results, viewport evidence, and any explicitly deferred presentation debt to the enhancement log.

```bash
git add docs/06-ui-mock-phase.md docs/design-system.html public/design-system.html tests/unit/ui-design-contract.test.mjs enhancement/2026-09-29-ui-ux-redesign.md
git commit -m "docs: finalize UI redesign system and verification"
```

- [ ] **Step 10: Perform final scope audit**

Compare the finished branch against the spec and confirm every acceptance criterion has evidence. Report any unrelated existing worktree changes separately rather than fixing them.
