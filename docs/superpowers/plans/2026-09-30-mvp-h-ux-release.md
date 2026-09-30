# H — UX Components and Release Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Close contrast/component defects and prove complete real-data journeys, responsive behavior and zero runtime mocks.

**Architecture:** Correct shared tokens/components at their source, then test real route consumers. Use native selects, existing button/filter patterns and dialog behavior; verification uses current Node/Supabase and native browser tools.

**Tech Stack:** React 19.2.8, Tailwind 4, native HTML controls/dialog, existing testing tooling; no new UI dependency.

**Spec:** Hardening sections 6, 12-16 plus approved redesign common-style contract. Depends on G; isolated H1/H2 correctness fixes may be implemented earlier after their plan approval.

## Global Constraints

- Do not start another visual redesign; white canvas and Cobalt Commons remain.
- Header exposes notification/user information; logout stays sidebar/drawer.
- Internal spacing 8-16px, related blocks 24px, major sections 32px, intentional page separation 48px.
- One boundary per component; preserve light structural dividers, use accessible boundary specifically for controls.
- New product states use shared primitives; no gradients, marquees, card repetition or arbitrary spacing.
- Test doubles remain test-only; all final acceptance flows use real Backend/auth.

## Review Focus

- A button's rendered foreground/background can differ from token pair because of legacy undefined classes (H1).
- Disabled/loading/error controls and 200% zoom must remain operable/readable (H1-H3).
- No enabled focusable child in dialog must still move focus into modal and return it (H2).
- Filters are not tabs; true panels need matching IDs and keyboard focus (H2).
- Realtime refresh/permission loss during a dirty form must preserve input or explain why action ended (H3).

### Task H1: Shared contrast and legacy color corrections

**Files:** Create `tests/unit/ui-contrast.test.mjs`; modify `src/app/globals.css`, `Button.tsx`, form-control classes in shared selects/modal/page consumers, `tests/unit/ui-design-contract.test.mjs`, `docs/design-system.html`, approved redesign spec token table; scoped legacy replacements in Login, Settings and Meeting access states.

**Interfaces:** Add semantic `--color-control-border: #7A8496` (validate actual ratio >=3:1 on white and subtle surface). Keep `--color-border: #DDE2EA` for decorative separators. Existing primary `#2F5BD3`/white pair must meet >=4.5:1. `contrastRatio(foreground,background)` is test-only implementation of WCAG relative luminance, reads actual stylesheet tokens; do not introduce a production contrast engine.

- [ ] Write assertions for every used Button text/background default/hover/active/semantic pair: >=4.5:1 normal text; >=3:1 control boundary/focus where needed. Pin legacy undefined `bg-primary-dark`, `text-neutral-dark`, `border-neutral-border` against actual theme utility definitions; tests should expose known failures, not whitelist undefined names.
- [ ] Run `node --test tests/unit/ui-contrast.test.mjs`; expected FAIL for current control borders/legacy pairs.
- [ ] Apply control-boundary token to input/select/required action outlines without darkening all page dividers. Replace legacy classes with actual semantic tokens/shared Button at identified consumers. Preserve layout/handler behavior. Include focus indicator and error text, never color-only error signal. Check disabled exemptions separately from readability goals.
- [ ] Run contrast/design contracts and native computed-style inspection for all actual button variants on white/subtle surfaces and state backgrounds. Verify text never resolves to white on white. Record approved token adjustment in design docs. Commit: `fix: enforce readable controls and button contrast`.

### Task H2: Native select, filter/tab semantics and focus behavior

**Files:** Modify `SelectDropdown.tsx`, `DropdownFilter.tsx`, `PillTabs.tsx`, `ResponsiveDialog.tsx`, `NotificationPopover.tsx`, AppShell/navigation, MeetingHeader and all tab consumers; create `tests/unit/ui-semantics.test.mjs`; record browser cases in QA document.

**Interfaces:** Preserve controlled select value/onChange/disabled/id/label props; use native `<select>/<option>`, render rich descriptions as associated helper text when needed rather than custom keyboard widget. `PillTabsProps` gains `mode:'filter'|'tabs'` (default filter), `idPrefix` and `label` for true tabs; filters use group/buttons `aria-pressed`, true tabs provide tab/tabpanel IDs, controls/label relation, one tabStop and arrow/Home/End behavior. Dialog fallback focuses dialog with `tabIndex=-1`; restore only connected opener or safe main heading. Notification popover is a labelled dialog/list with ordinary links/buttons, not a falsely labelled ARIA menu.

- [ ] Write assertions against actual component contracts for select label/disabled wiring, filter pressed semantics, true-tab relationship IDs and focus navigation. Source-level checks supplement but do not replace browser interaction. Browser steps explicitly exercise keyboard choices, escape/focus return and no-enabled-child dialog; no mock product route is needed.
- [ ] Run tests; expected FAIL on old listbox/tab/focus contracts.
- [ ] Simplify selects to native controls; avoid reimplementing typeahead. Update each consumer's intended mode (Home/My Rooms/debt filters vs Meeting actual panels), ensure no positive tabindex. Add tabpanel IDs/labels to genuine panels. Add dialog fallback/connected-opener return and native Escape prevention for non-dismissible/submitting states.
- [ ] Complete notification popover focus-on-open, Escape/click-outside, close-on-link, opener return, labelled unread list/loading/error and polite status feedback. Add skip-to-main and visible route heading focus after navigation where missing. Keep header control order/logout location.
- [ ] Run unit contracts/typecheck and browser keyboard flow on desktop/tablet/mobile. Expected native selections operable with platform keys, one true tab in tab order, screen reader relationship present, no focus stranded after archive/removal/unmount. Commit: `fix: complete shared control and dialog accessibility`.

### Task H3: Full UX state matrix and real MVP acceptance

**Files:** Update `docs/qa/2026-09-30-mvp-hardening.md`, `docs/qa/notification-event-matrix.md`, master plan checkboxes, enhancement log, `docs/01-product-scope.md`, `docs/03-domain-and-states.md`, `docs/05-realtime.md`, `docs/07-api-backend-phase.md`; create `docs/qa/mvp-feature-coverage.md`. Modify only demonstrated route/state defects found in approved A-G or H1/H2 scope.

**Interfaces:** Feature coverage row `{route,feature,actor,precondition,action,expected,actual,evidence,status}`; status one of `not-run|passed|failed|blocked`. Record real infrastructure config/version and route. Historical unit passes cannot mark runtime passed; unavailable auth/infrastructure remains blocked.

- [ ] Before fixes, pin demonstrated defects to their owning actual code/DB/HTTP test; do not introduce tests that only reproduce a fake business implementation. Cover initial/loading, empty, validation, submitting, success, error/retry, forbidden, stale/conflict, offline/reconnecting, archived and destructive states on every relevant route.
- [ ] Execute six critical E2E journeys from approved spec, with owner/member/admin and unrelated user in separate authenticated sessions. Add exact attendance deadline, all present/absent/leave states, permission denial, member removal without debt/with debt, notification read consistency, money correction/reconfirm, QR hard reload/expiry, archive-only funds, replacement-admin failure/rollback, long lists, two-tab concurrent mutations and dialog refresh races.
- [ ] Run desktop 1440x900, tablet landscape 1024x768, tablet portrait 768x1024, mobile 390x844 and narrow mobile 320x568; exercise 200% zoom, long Vietnamese names/reasons, keyboard/reduced-motion and modal scroll. Measure document/client widths, visible primary actions, header/logout location, peer-section gap consistency and border count. Record screenshots/outcomes using native browser capabilities only; do not claim simulated viewport verification if tools cannot set it.
- [ ] Repair only the demonstrated approved defects; run the smallest owning check first, then package regression. Verify error UX keeps form input, reconnect waits for authoritative refresh and invalid permissions disable controls with explanation. Browser console/network has no fixture source, no sensitive logs, no unauthorized successful rows or N+1 payments.
- [ ] Run `pnpm test`, `pnpm run test:runtime-data`, `pnpm run test:db`, `pnpm run test:integration`, `pnpm run test:contracts`, typecheck, scoped/full lint and diff check. Record pre-existing warnings separately. Report completed changes before production-mode build per repository workflow; run authorized `pnpm build` against real configured environment and inspect build output for mock imports/flags/secrets.
- [ ] Publish feature-by-route report: implemented behaviors, missing capabilities, FE/BE/config ownership, event coverage and remaining concrete blockers. All blocking criteria must pass before claiming production readiness; no success toast from a no-op. Preserve original redesign Tasks 8-9 pending scope explicitly if broader visual work was not performed.
- [ ] Commit: `test: verify real MVP flows and release gates`.

**Package acceptance:** Every spec requirement maps to evidence; no production mock/no-op/broken contrast; all critical business/security/realtime/runtime gates passed or the release remains explicitly incomplete.

**References:** [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
