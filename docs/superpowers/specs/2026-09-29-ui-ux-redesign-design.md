# DiemDanhCMDN UI/UX Redesign Design

## Document status

- Date: 2026-09-29
- Status: Approved design, implementation not started
- Mode: Complete visual reset
- Scope: UI/UX and presentation only
- Product behavior: Frozen
- Theme: Light only
- Product language: Vietnamese-first

## 1. Purpose

DiemDanhCMDN is approaching MVP, but its current presentation lacks a consistent visual language, predictable hierarchy, and intentional responsive behavior.

This redesign replaces the current visual system and page composition while preserving every existing business rule, permission, data contract, handler outcome, route, and automated business test.

The intended product personality is friendly community:

- Human and approachable without becoming childish.
- Clear and trustworthy for attendance and money workflows.
- Desktop-dominant while treating tablet and mobile as first-class layouts.
- Visually distinctive without decorative effects or generic AI-generated UI patterns.

## 2. Approved design decisions

| Decision | Approved direction |
| --- | --- |
| Redesign depth | Complete visual reset |
| Product personality | Friendly community |
| Primary device | Desktop dominant |
| Responsive support | Intentional desktop, tablet, and mobile layouts |
| Brand preservation | No existing color, typography, or logo-treatment constraint |
| Theme | Light only |
| Product language | Vietnamese-first |
| Color direction | Cobalt Commons |
| Typography | Plus Jakarta Sans |
| Icon family | Hugeicons only |
| Spacing | Existing 8-point grid |
| Motion intensity | Low, feedback and state transitions only |
| Dependency policy | No new UI or animation library |

The approved Vietnamese-first decision supersedes the English-only presentation rule in `docs/06-ui-mock-phase.md`. It does not supersede English strings that participate in business validation.

The following protected confirmation phrases remain exactly unchanged:

- `Archive this user`
- `Archive this room`
- `I agree to remove this user`

## 3. Goals

- Create a cohesive design system with semantic tokens and clear governance.
- Improve hierarchy, scanability, and action clarity across every MVP screen.
- Make attendance, membership, and funds states immediately understandable.
- Provide intentional desktop, tablet, and mobile compositions.
- Standardize loading, empty, error, success, focus, disabled, and permission states.
- Preserve every existing behavior and business test.
- Remove AI UI slop patterns such as decorative marquees, unnecessary pills, arbitrary gradients, glow, and card-heavy layouts.

## 4. Non-goals

- No route changes.
- No business workflow changes.
- No new domain state.
- No new dashboard metrics.
- No repository, API, Auth0, Supabase, realtime, migration, or RLS changes.
- No new UI component library.
- No dark mode in the MVP redesign.
- No animation framework.
- No refactor unrelated to presentation safety.
- No test expectation changes to make a regression pass.

## 5. Scope boundaries

### 5.1 Presentation scope

The redesign may change:

- `src/app/globals.css`
- App shell and layout components.
- Shared UI components.
- Presentation components inside product modules.
- JSX composition inside page files.
- Vietnamese UI copy that does not participate in business validation.
- Responsive rendering and visual ordering.
- Accessibility behavior such as focus management, keyboard operation, dialog semantics, and live-region feedback.
- Loading, empty, error, success, and permission presentation.

### 5.2 Protected scope

The redesign must not change:

- Domain entities, policies, and state transitions.
- Repository interfaces or adapters.
- API Route Handlers.
- Supabase migrations, RLS, or storage policy.
- Auth0 integration or role claims.
- Realtime subscriptions and refresh behavior.
- Request payloads or response mapping.
- Permission rules.
- Business validation.
- Confirmation phrase values.
- Existing business test expectations, fixtures, or execution paths.

When a file contains both presentation and business behavior, only markup, presentation classes, accessibility wiring, and responsive composition may change. Existing callbacks, arguments, dependency arrays, handler ordering, and side effects remain unchanged.

## 6. Anti-slop design contract

- One primary accent color for interactive emphasis.
- One documented neutral scale.
- Semantic colors are reserved for semantic meaning.
- One typography family and a limited type scale.
- One documented radius rule.
- Three elevation levels at most.
- Hugeicons is the only icon source.
- The 8-point grid governs spacing and component dimensions.
- Every screen has one dominant task and one primary action per region.
- Cards are used only when a boundary communicates an actionable object or real elevation.
- Responsive design follows information priority, not simple column reduction.
- Every component considers default, hover, focus, active, disabled, loading, empty, error, and success states where applicable.
- Every animation must communicate hierarchy, feedback, or state change.

### 6.1 Common style guardrails

These rules are mandatory for every screen and component in Tasks 3-9. They are
the visual regression contract for preventing the redesign from drifting back to
the current layout.

#### Structure and density

- Do not copy the current page composition, header order, card grid, or spacing
  rhythm into a redesigned screen.
- Every screen follows one visible hierarchy: page header -> context or filter
  controls -> primary content -> secondary context. A screen must not present
  competing primary regions at the same visual weight.
- Use the 8-point grid as a rhythm, not as permission to stack large gaps. Use
  `8-16px` inside a component, `24px` between related blocks, and `32px` between
  major sections. Use `48px` only for a deliberate page-level separation.
- Adjacent sections in the same workspace must use the same gap token. Do not
  combine arbitrary `32px`, `40px`, and `48px` gaps between peer sections.
- Internal spacing must remain smaller than the surrounding section spacing.
  If a section looks detached from the next section, reduce the gap before
  adding another card or border.
- Prefer one structured list, data row, or content panel over several equal
  floating cards. A card is allowed only when it communicates an actionable
  object, a meaningful boundary, or real elevation.

#### Border and surface policy

- Default boundaries use exactly `1px solid #DDE2EA`.
- Strong boundaries use exactly `1px solid #B8C0CE` and are reserved for focus,
  selected emphasis, or a high-value separation.
- Do not mix multiple border colors or weights within one component hierarchy.
- Do not add borders to every nested element. Use one boundary per component,
  or a single row divider for a structured list; use spacing and surface contrast
  for all other grouping.
- Avoid double borders between adjacent panels, rows, and dialogs. Shared edges
  must collapse into one visible boundary or no boundary.
- `color-community` and semantic colors must never be used as decorative border
  colors.

#### Header and navigation hierarchy

- The application header exposes only notification access and user information.
- Logout is not a header action. It lives in the sidebar account section on
  desktop/tablet and inside the sidebar/More drawer on mobile.
- User information remains a profile/account affordance; moving logout does not
  change the existing logout handler, auth behavior, or permission logic.
- The header must not contain a second copy of primary navigation, redundant
  breadcrumbs, or competing action clusters.

#### Anti-regression review

- Reject a screen if it visually resembles the old layout, has inconsistent
  border treatment, relies on card repetition, or leaves unexplained whitespace
  between peer sections.
- Review desktop, tablet, and mobile screenshots side by side before marking a
  task complete. Confirm header control order, logout location, section gaps,
  border count, primary-action visibility, and content density.
- Any intentional exception must be recorded in the enhancement log with the
  reason, affected viewport, and the alternative considered.

Forbidden visual defaults:

- Glassmorphism.
- Decorative gradients.
- Glow.
- Marquee.
- Decorative status dots.
- Infinite animation.
- Oversized dashboard typography.
- Pill treatment for ordinary buttons and navigation.
- Generic three-card feature rows.
- Decorative metrics not backed by existing data.
- Emoji used as application icons.

## 7. Visual foundation

### 7.1 Brand and neutral colors

| Token | Value | Purpose |
| --- | --- | --- |
| `color-canvas` | `#FFFFFF` | Page background |
| `color-surface` | `#FFFFFF` | Modal, dropdown, and elevated content |
| `color-surface-subtle` | `#F5F7FB` | Grouping, table headers, and secondary regions |
| `color-primary` | `#2F5BD3` | Primary action, active navigation, and selected state |
| `color-primary-hover` | `#2446A8` | Primary hover state |
| `color-primary-active` | `#1D3987` | Primary pressed state |
| `color-primary-soft` | `#E9EEFF` | Selected and informational backgrounds |
| `color-community` | `#F59E42` | Avatar and community highlights only |
| `color-text-primary` | `#172033` | Headings and emphasized body text |
| `color-text-secondary` | `#596275` | Supporting content |
| `color-text-tertiary` | `#667085` | Metadata |
| `color-border` | `#DDE2EA` | Default boundary |
| `color-border-strong` | `#B8C0CE` | Strong separation |

`color-community` is not an interactive or warning color. It is limited to member, avatar, or community highlights and should occupy no more than a small portion of a screen.

### 7.2 Semantic colors

| State | Strong | Soft background |
| --- | --- | --- |
| Success, present, paid | `#17745A` | `#E8F6F0` |
| Warning, pending | `#7A4A00` | `#FFF4D6` |
| Error, absent, destructive | `#B4233A` | `#FDECEF` |
| Informational | `#2F5BD3` | `#E9EEFF` |
| Neutral, leave | `#596275` | `#EEF1F5` |

Status must never rely on color alone. Text and an icon or other structural indicator accompany every meaningful state.

### 7.3 Typography

Use Plus Jakarta Sans through `next/font`. The font supports Vietnamese glyphs and variable weights.

| Role | Size / line-height | Weight |
| --- | --- | --- |
| Page title | `32 / 40px` | 700 |
| Section title | `24 / 32px` | 700 |
| Component title | `20 / 32px` | 600 |
| Large body | `16 / 24px` | 400 or 500 |
| Body | `14 / 24px` | 400 |
| Label | `14 / 24px` | 600 |
| Supporting text | `12 / 16px` | 400 or 500 |

Do not use weight 800 or 900 in normal product UI. Do not use uppercase for paragraphs or navigation. Money may use tabular numerals without introducing a monospace font.

### 7.4 Shape system

| Component type | Radius |
| --- | --- |
| Input, button, and filter | `8px` |
| Card and panel | `16px` |
| Modal and large overlay | `24px` |
| Badge, status, and avatar | Full pill or circle |

Pills are limited to badges, statuses, avatars, and genuine segmented controls.

### 7.5 Spacing

Approved spacing values:

`8, 16, 24, 32, 40, 48, 64, 80, 96px`

- Internal spacing is smaller than external spacing.
- Related content uses `8-16px`.
- Component groups use `24px`.
- Major screen regions use `32-48px`.
- Arbitrary spacing is not introduced without a documented optical reason.

### 7.6 Elevation

| Level | Purpose |
| --- | --- |
| Level 0 | Default content separated by spacing or border |
| Level 1 | Dropdown, popover, and sticky controls |
| Level 2 | Modal and blocking overlay |

Room, member, and fund rows do not automatically become floating cards.

## 8. Application shell and responsive architecture

### 8.1 Desktop

At `1280px` and above, the shell contains:

- A persistent `240px` left navigation.
- A fluid main workspace with controlled maximum width.
- An optional `280px` contextual rail only when it adds task-relevant information.

Approved navigation labels:

| Route | Label |
| --- | --- |
| `/` | Trang chủ |
| `/my-rooms` | Phòng của tôi |
| `/funds` | Quỹ của tôi |
| `/settings` | Quản trị |

`Quản trị` remains admin-only. Role visibility and navigation targets do not change.

The page header contains a title, optional supporting context, and one primary action. Search and filters sit below the header. The shallow route structure does not require breadcrumbs; room detail uses a back action with room context.

Online members may use a fixed contextual rail at `1440px` and above. Between `1024px` and `1439px`, the same presence data opens in a drawer.

### 8.2 Tablet

Between `768px` and `1279px`:

- Persistent navigation becomes a drawer.
- A top app bar contains menu, current context, notifications, and avatar.
- Content uses one or two columns based on the task.
- Contextual rails become drawers.
- Primary actions remain visible in the page header.
- Secondary table columns move into detail or overflow presentation.

### 8.3 Mobile

Below `768px`:

- Use a `56px` or `64px` top app bar.
- Use bottom navigation for Trang chủ, Phòng, Quỹ, and Thêm.
- Quản trị is available inside Thêm for admins.
- Use `16px` page gutters.
- Default to one column.
- Use `48px` touch height for primary controls.
- Convert multi-filter toolbars into a filter sheet.
- Convert standard dialogs into bottom sheets where appropriate.
- Use a full-screen dialog for long destructive confirmations.
- Preserve every capability available on larger screens.

### 8.4 Grid

| Device | Page gutter | Columns | Major gap |
| --- | --- | --- | --- |
| Mobile | `16px` | 1 | `24px` |
| Tablet | `24px` | 6 | `24px` |
| Desktop | `32px` | 12 | `32px` |
| Wide desktop | `48px` | 12 | `32px` |

## 9. Screen UX architecture

### 9.1 Trang chủ

Primary job: find a room and join or request access quickly.

Order:

1. Page header and Tạo phòng action.
2. Search and room filters.
3. Room catalog.
4. Loading, empty, error, and pagination states.
5. Online members as contextual content.

Room item hierarchy:

1. Room name.
2. Public or private state.
3. Owner.
4. Member count and meeting context.
5. Current-user relationship state.
6. One primary action.

Existing public join, private request, pending, cancel, re-submit, success, error, and open-room behaviors remain unchanged.

### 9.2 Phòng của tôi

Primary job: return to rooms the user owns or has joined.

- Use Tôi quản lý and Tôi tham gia segments.
- Keep active and archived state clear.
- Show owner actions only when permission allows.
- Do not duplicate the Home discovery composition.

### 9.3 Room workspace

The room workspace contains:

- A back action.
- Room name, type, owner, and session status.
- Permission-aware contextual actions.
- Tabs for Điểm danh, Thành viên, and Quỹ.

Tabs remain visible and recognizable on mobile. They may scroll horizontally but do not collapse into a dropdown.

### 9.4 Điểm danh

Order:

1. Session date, time, and deadline.
2. Current-user attendance state.
3. Available action.
4. Member attendance summary.
5. Owner override tools.
6. Fund candidates after deadline.

Selected state uses text, icon, and structural emphasis. Realtime updates must not reset focus or unexpectedly move the active action.

### 9.5 Thành viên

- Pending requests receive a priority region when present.
- Members use structured rows rather than an equal-card grid.
- Owner and admin actions remain permission-aware.
- Mobile rows keep identity, role, and state visible while secondary metadata may collapse.

### 9.6 Quỹ trong room

Order:

1. Payment and QR information.
2. Outstanding contributions.
3. Paid contributions.
4. Candidate or creation tools for owner/admin.
5. Archived-room context.

Money uses tabular numerals and consistent alignment. No metric is added unless current business data already provides it.

### 9.7 Quỹ của tôi

Primary job: understand outstanding obligations and how to pay them.

- Outstanding items have priority over paid history.
- Each item shows room, reason, amount, status, and payment-information access.
- Archived-room context remains visible without removing payment history access.

### 9.8 Quản trị

Admin-only sections cover active users, archived users, active rooms, and archived rooms.

- Desktop uses tables or structured lists based on real column needs.
- Mobile uses stacked data rows, not a card for every table cell.
- Identifier, state, and primary action remain visible.
- Secondary metadata opens through detail presentation.

## 10. Component system

### 10.1 Layers

1. Foundations: color, typography, spacing, radius, elevation.
2. Primitives: Button, Input, Select, Badge, Avatar, IconButton.
3. Composites: PageHeader, FilterBar, SegmentedControl, DataRow, Modal, Sheet.
4. Domain patterns: RoomItem, AttendanceControl, MemberRow, FundRow, PaymentPanel.

A shared primitive is created only when it has at least two consumers or resolves demonstrated duplication. Domain-specific components remain in their domain module.

### 10.2 Buttons

Approved variants:

- Primary.
- Secondary.
- Ghost.
- Destructive.
- Icon-only with accessible name.

Approved heights:

- `32px` compact desktop toolbar.
- `40px` default desktop control.
- `48px` touch-priority control.

One region has one primary button. Loading retains control width. Destructive actions never use cobalt primary styling.

### 10.3 Form controls

Every field contains label, control, optional helper text, and inline error. Placeholder is not a label.

`DropdownFilter` and `SelectDropdown` receive one appearance and interaction contract without changing their values, callbacks, or filtering behavior.

### 10.4 Status presentation

- Badge: public/private, role, archived.
- Status text and icon: attendance and payment.
- Inline banner: permission, archived context, important warning.
- Localized loading region: pending operation.
- Toast: transient success or non-blocking feedback.

### 10.5 DataRow

Desktop anatomy:

`Identity | Primary data | Secondary data | Status | Actions`

Mobile anatomy:

`Identity + status | Primary data | Secondary metadata | Primary action / More`

### 10.6 Modal and sheet

The content and handlers remain identical across viewport presentations.

- Desktop/tablet uses a centered dialog.
- Mobile uses a bottom sheet.
- Long destructive flows may use a full-screen mobile dialog.
- Focus enters the dialog, remains trapped while open, and returns to the trigger on close.
- Escape and overlay behavior are consistent with the action risk.
- A destructive request in progress prevents accidental dialog closure.

## 11. Interaction states and error handling

| State | Presentation |
| --- | --- |
| Initial loading | Skeleton matching final layout |
| Action loading | Localized to the triggering control or region |
| Empty | Explanation and one valid next action when available |
| Validation error | Directly under the field |
| Request error | Near the affected region, with retry when valid |
| Permission error | Blocking inline state |
| Success | Inline confirmation or transient toast |
| Realtime update | Subtle update without focus reset or layout jump |

Critical errors and permission failures are never communicated only through toast.

## 12. Accessibility contract

- Semantic HTML precedes ARIA.
- Every interactive control is keyboard operable.
- Focus state is visually clear.
- Primary mobile controls use at least `48px` touch height.
- Icon-only controls have accessible names.
- Status never relies on color alone.
- Important dynamic states use an appropriate live region.
- Error messages are associated with fields.
- Tab order follows visual order.
- Text zoom does not hide content or actions.
- Reduced motion disables non-essential transitions.

## 13. Motion contract

Motion intensity is `3/10`.

Allowed:

- Hover and pressed feedback.
- Short dropdown and dialog transitions.
- Tab indicator transition.
- Subtle skeleton pulse.
- Short realtime-update highlight.

Forbidden:

- Marquee.
- Parallax.
- Infinite decorative animation.
- Magnetic controls.
- Scroll hijacking.
- Motion that moves focus or changes action position unexpectedly.

## 14. Behavior preservation

The following flows are protected:

| Flow | Invariant |
| --- | --- |
| Create room | Validation, payload, success/error, and navigation |
| Public room | Direct join |
| Private room | Request, pending, cancel, and re-submit |
| Room access | Member, owner, and admin permission |
| Attendance | Deadline, self check-in, and owner override |
| Member management | Approve, reject, leave, and removal constraints |
| Funds | Candidate selection, contribution creation, and payment status |
| Payment QR | Upload, private readback, and archived behavior |
| Ownership | Transfer completes before archive |
| Archive room/user | Impact list, exact phrase, and permission |
| Realtime | Subscription, refresh, and focus preservation |
| Authentication | Mock/Auth0 modes and role visibility |

## 15. Worktree safety

The repository currently contains uncommitted work that overlaps presentation files.

Before implementation:

- Record `git status` and the current diff.
- Identify which changes belong to existing work.
- Do not stage, revert, or rewrite unrelated changes.
- Stop if ownership of overlapping edits cannot be established.
- Create a user-owned checkpoint before broad overlapping implementation when necessary.

## 16. Rollout phases

| Phase | Scope | Exit condition |
| --- | --- | --- |
| 0 | Baseline, route/role inventory, current diff, tests | Behavior contract recorded |
| 1 | Tokens, typography, and application shell | No screen behavior change |
| 2 | Home pilot, room item, filters, online-members presentation | Approved at desktop, tablet, and mobile |
| 3 | My Rooms and My Funds | State and flow parity verified |
| 4 | Attendance, Members, and Room Funds | Member and owner behavior verified |
| 5 | Settings, modal, drawer, and sheet patterns | Destructive flows verified |
| 6 | Remove obsolete presentation, document system, final QA | No unexplained visual duplication |

Each phase is reviewed before the next phase begins.

## 17. Verification strategy

Planned automated commands:

```text
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Existing business tests are not edited, skipped, deleted, or weakened. A failure introduced after a presentation change is treated as a regression until evidence proves otherwise.

No new UI testing library is added by default. A dependency requires a demonstrated verification gap and separate approval.

### 17.1 Role matrix

| Role | Required flows |
| --- | --- |
| Guest | Login and public Home state |
| Member | Join/request, attendance, and Funds |
| Owner | Room management, members, contributions, and archive |
| Admin | Settings, cross-room permissions, and archive user |

### 17.2 Viewport matrix

| Class | Viewports |
| --- | --- |
| Desktop | `1440x900`, `1280x800` |
| Tablet landscape | `1024x768` |
| Tablet portrait | `768x1024` |
| Mobile | `390x844`, `360x800` |

Every viewport checks overflow, navigation, primary action visibility, dialog/sheet behavior, focus, long Vietnamese text, state presentation, and data-row transformation.

## 18. Acceptance criteria

- [ ] Cobalt Commons tokens replace the previous mint presentation.
- [ ] Plus Jakarta Sans renders Vietnamese copy correctly.
- [ ] Application navigation matches the approved desktop, tablet, and mobile shell.
- [ ] Every MVP route has an intentional responsive composition.
- [ ] Existing handlers, callbacks, payloads, permissions, and state transitions remain unchanged.
- [ ] Existing business tests remain unchanged and pass.
- [ ] Typecheck, lint, and build pass.
- [ ] Guest, member, owner, and admin behavior is verified.
- [ ] Loading, empty, error, success, permission, and disabled states are present where applicable.
- [ ] Keyboard and focus behavior passes the accessibility contract.
- [ ] Status is never communicated by color alone.
- [ ] Protected English confirmation phrases remain exact.
- [ ] No domain, repository, API, realtime, Auth0, database, or migration file changes are included.
- [ ] Unrelated worktree changes are neither staged nor overwritten.
- [ ] Verification evidence is recorded per phase.

## 19. Reference

- Plus Jakarta Sans official repository: <https://github.com/tokotype/PlusJakartaSans>
- Product scope: `docs/01-product-scope.md`
- Existing UI requirements: `docs/06-ui-mock-phase.md`
- Architecture: `docs/02-architecture.md`
- Auth and security: `docs/04-auth-security.md`
