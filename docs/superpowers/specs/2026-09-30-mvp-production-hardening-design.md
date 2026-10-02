# DiemDanhCMDN MVP Production Hardening Design

## Document status

- Date: 2026-09-30
- Status: Approved by BOSS; detailed implementation plans prepared separately
- Scope: Product behavior, Backend, realtime, security boundary, test coverage, mock removal, and limited UI correctness
- UI constraint: Do not start another visual redesign
- Data decision: Existing local and linked development data may be deleted; production data must never be targeted
- Predecessor: `docs/superpowers/specs/2026-09-29-ui-ux-redesign-design.md`

## 1. Purpose

This phase moves the redesigned application from a UI-complete development state toward a production-capable MVP.

It closes gaps that the UI-only Tasks 1-7 intentionally did not change:

- Remove runtime mock data and development-only authentication paths.
- Replace placeholder and no-op behavior with real product flows.
- Define complete route-level features and edge cases.
- Secure Auth0, Supabase RLS, Storage, and realtime boundaries.
- Make multi-record business mutations atomic and idempotent where required.
- Add missing realtime, notification, conflict, error, offline, and reconnect behavior.
- Verify the existing redesign against real Backend behavior on desktop, tablet, and mobile.
- Correct contrast, semantics, and broken component states without reopening layout direction.

## 2. Scope and non-goals

### 2.1 In scope

- Auth0-to-Supabase authenticated identity bridge.
- RLS and Storage policies based on real application identity and permissions.
- Server-side commands or transactional Postgres functions for privileged and multi-record mutations.
- Development database reset and clean reproducible schema baseline.
- Removal of all production/runtime mock data, mock-auth switches, no-op actions, and silent placeholder clients.
- Real implementations for invitation, channel peer debt, pagination, notification, session history, and missing state handling.
- Realtime event matrix for lobby, meeting rooms, channel rooms, funds, notifications, presence, and admin.
- Unit, integration, RLS, realtime, end-to-end, accessibility, and responsive test coverage.
- Limited UI corrections required for contrast, feedback, keyboard semantics, focus behavior, or real business states.

### 2.2 Out of scope

- A second visual redesign.
- Changing Cobalt Commons brand direction, information hierarchy, or responsive shell without evidence of a functional defect.
- New dependencies unless a later approved implementation plan proves that native/platform capabilities are insufficient.
- Production database deletion or reset.
- Preserving current development records through data migration.
- Treating Presence as an authorization or security mechanism.
- Weakening tests, RLS, or business rules to preserve current mock behavior.

## 3. Safety contract for destructive development reset

The user has confirmed that current development data is disposable. This approval does not authorize deleting production data.

2026-10-01 clarification: BOSS confirmed that no production project exists. A linked reset may use an explicit `PRODUCTION_PROJECT_REF=none` declaration for that situation; an absent/blank value still blocks reset. The development/linked/URL references and exact acknowledgement remain mandatory. If production is later created, replace `none` with its real reference before any reset.

Before any destructive command:

1. Resolve the exact Supabase project reference and environment.
2. Prove the target is local, development, or an explicitly disposable staging environment.
3. Abort when the target is production, ambiguous, or cannot be independently identified.
4. Record the target project reference, command, timestamp, and pre-reset table counts without recording secrets.
5. Keep schema and policy definitions reproducible in version control.
6. Run the reset without seed data.
7. Verify business tables and relevant Storage objects are empty.
8. Verify schema, functions, triggers, RLS, and Realtime publication are present after reset.
9. Create the first records only through real authenticated product flows.

`No data migration` means existing development records may be discarded. It does not mean that schema migrations can be removed without a reproducible replacement.

## 4. Architecture decision record

| Approach | Advantages | Risks and cost | Verdict |
| --- | --- | --- | --- |
| Direct browser repositories for all reads and writes | Smallest code change; native Supabase realtime integration | Multi-record workflows are difficult to make atomic; service-role-only mutations fail; sensitive policy mistakes reach the browser boundary; stable domain errors and idempotency are weak | Rejected |
| Route Handler/server command for every read and write | One authorization boundary; easiest secret isolation | Duplicates Supabase read/realtime strengths; more server endpoints and cache plumbing; slower MVP delivery | Rejected as the universal model |
| Hybrid: authenticated RLS reads/realtime plus server commands for privileged/multi-record writes | Least-privilege live reads, small MVP footprint, transactional critical writes, clear security boundary | Requires an explicit mutation classification and both RLS plus command integration tests | Selected |

The selected hybrid model is the smallest design that resolves the current Auth0/RLS mismatch and transaction gaps without introducing a new state-management framework or converting every query into a custom API.

## 5. Evidence classification

| Classification | Meaning in this document |
| --- | --- |
| Confirmed | Proven from current source, migration, test, or recorded runtime evidence |
| High-risk gap | Source boundaries conflict or a real Backend path has not been proven; implementation must treat it as blocking |
| Unknown | Requires integration/runtime evidence before a final conclusion |

Passing unit tests is not proof that RLS, Auth0 identity propagation, Storage policy, transactionality, or realtime behavior works against the real Backend.

## 6. Audit of redesign Tasks 1-7

| Task | Confirmed state | Missing production behavior or component contract | Required closure |
| --- | --- | --- | --- |
| 1 — Design foundation | Semantic tokens, light theme, 8-point spacing, and shared visual guardrails exist | No automated token contrast gate; default and strong border tokens are below 3:1 against white when used as the only control boundary | Add contrast contract tests; strengthen input/control boundaries or add a non-color visual boundary; audit all shared variants |
| 2 — Shared primitives | Button, fields, dropdowns, tabs, dialogs, states, and pagination were visually unified | Custom listboxes lack complete keyboard navigation/focus/typeahead; tabs lack full tab semantics; dialog has no focus fallback when no enabled control exists | Prefer native `select` for simple forms/filters; use `aria-pressed` for filters; implement complete ARIA patterns only where true custom behavior is required; add focus fallback |
| 3 — Application shell | Responsive desktop/tablet/mobile shell, header order, sidebar logout, and notification presentation exist | Runtime shell still depends on mock-auth branches; Presence is public/spoofable; notification popover lacks complete loading/error/keyboard behavior; no authenticated private realtime proof | Remove runtime mock auth; establish identity bridge; make Presence private and informational only; add notification state and keyboard contracts |
| 4 — Home | Search/filter/create/join/cancel presentation and responsive layouts exist | Guest branch can remain in indefinite skeleton; pagination is hardcoded/no-op; mutation errors are console-only; browser writes are not proven under real RLS; join races are undefined | Define guest/auth redirect behavior; real server pagination; user-facing retry/errors; authorized server commands; idempotent join/request conflict handling |
| 5 — My Rooms and Personal Funds | Redesigned lists, summaries, dialogs, loading/empty states, and responsive presentation exist | My Rooms pagination is no-op; load/mutation errors are ambiguous; Personal Funds performs per-contribution payment lookup; payment realtime is over-broad; private QR readback is not fully proven | Real pagination; explicit error/retry states; aggregate read model; scoped realtime invalidation; signed URL upload/read/hard-reload E2E |
| 6 — Meeting, attendance, members | UI wiring stayed unchanged; membership lifecycle tests pass; representative dialogs and attendance states rendered | Invite uses local mock users and browser alert; no explicit meeting/session schedule flow; no immutable history UI; deadline finalization and candidate lifecycle are incomplete; permission, race, and dialog-refresh paths are not fully verified | Real directory/invite flow; session schedule/history; atomic deadline finalization; complete notification and permission matrix; full runtime acceptance matrix |
| 7 — Room funds, management overlays, channel debt | Funds and management UI were redesigned; payment QR unit tests pass; dialogs preserve callbacks | Channel debt is entirely local mock state; payment revert conflicts with append-only database trigger; destructive/money mutations are not transactionally proven; QR/archival/realtime paths remain partially verified | Real peer-debt model and commands; replace destructive revert with compensating correction; transactional fund operations; complete Storage, archive, long-list, reconnect, and mutation E2E |

### 6.1 Current regression evidence

- Full test suite: 69/69 passing.
- Membership and payment QR targeted tests: 14/14 passing.
- TypeScript: passing with incremental output disabled.
- Scoped ESLint for Tasks 6-7: zero errors and two pre-existing warnings.
- Task 6-7 diff check: passing.
- Recorded representative desktop/tablet/mobile runtime evidence has no horizontal document overflow.

### 6.2 Current evidence limitation

The evidence above proves presentation compatibility and current isolated business contracts. It does not prove that all real Auth0, Supabase, RLS, transaction, Storage, or realtime flows work end to end.

## 7. Mock and placeholder inventory

### 7.1 Remove from runtime and shipped product

| Source | Current role | Disposition |
| --- | --- | --- |
| `src/mocks/fixtures.ts` | Production-shaped fixture data | Delete after confirming no imports |
| `src/mocks/repository.ts` | In-memory runtime repository | Delete after real adapters cover every route |
| `src/mocks/index.ts` | Mock export barrel | Delete |
| `supabase/migrations/20260919000003_seed_data.sql` | Development seed records | Remove from the new clean baseline; reset with no seed |
| `src/context/AuthMockContext.tsx` | Mock users, roles, and development auth provider | Remove runtime provider and all production imports |
| `src/components/layout/RoleSwitcherBanner.tsx` | UI role switcher for mock auth | Delete |
| `src/proxy.ts` mock-auth bypass | Route protection bypass | Delete the bypass while retaining real Auth0 routing |
| Login, header, settings, and shell mock branches | Alternative mock-auth UI behavior | Remove and use one real auth path |
| `InviteMemberModal` local users | Fake invitation directory | Replace with real eligible-user search and invitation command |
| `PeerDebtDashboard` mock debts/local mutation | Fake Channel Room business data | Replace with real repository/read model and commands |
| `public/design-system.html` | Publicly shipped demo with sample identities/role switcher | Remove from public output; retain canonical documentation under `docs/` if still useful |
| Supabase placeholder URL/key fallbacks | Silent fake client when environment is invalid | Replace with explicit startup/configuration failure |
| Hardcoded pagination totals and no-op page handlers | UI placeholder behavior | Replace with real count/cursor behavior or remove the control until functional |

### 7.2 Preserve as test infrastructure

The following are not production mock data and must not be deleted blindly:

- Unit-test fakes and spies under `tests/`.
- Deterministic fixture builders used only by tests.
- Mock Supabase clients used to test adapter contracts without network access.
- Browser/network interception used by isolated UI tests, when the test explicitly declares the boundary.

Test doubles must never be reachable from a production build or selected by a public environment flag.

### 7.3 Zero-runtime-mock acceptance rule

The phase is incomplete if any shipped route can obtain identity, room, member, attendance, fund, payment, debt, notification, or presence data from local hardcoded arrays or in-memory runtime repositories.

## 8. Target feature catalog by product area

### 8.1 Authentication and account

- Real Auth0 login, callback, session restore, logout, and unauthorized handling.
- Supabase client receives a trusted Auth0 token compatible with RLS.
- User profile is synchronized or provisioned idempotently.
- Auth0 namespaced claims remain the source of truth for the global `admin`/`user` role; the application database owns room membership, ownership, and other domain permissions only.
- Archived users are denied protected actions and receive a clear recovery/support state.
- Role and permission changes refresh without requiring unsafe client impersonation.
- Missing or invalid configuration fails explicitly.

### 8.2 Home

- Browse discoverable Meeting rooms and only authorized Channel rooms; Channel remains invite-only and hidden from outsiders.
- Search, type filter, visibility-aware empty states, and real pagination.
- Create a room through an authorized atomic command.
- Join public rooms; request/cancel access for private rooms.
- Display pending, approved, rejected, archived, and permission-conflict states.
- Show route-aware online context without exposing private room membership.
- Reflect room/request changes through realtime invalidation.

### 8.3 My Rooms

- Separate owned, joined, pending-request, and invited rooms.
- Search and paginate real records.
- Accept/decline invitations.
- Explain archived, access-revoked, and ownership-transfer states.
- Refresh list and counts after membership, archive, and transfer events.

### 8.4 Meeting Room

- Room identity, members, pending requests, invitation, and permission-aware management.
- Explicit meeting/session creation with deadline and immutable session history.
- Attendance choices, owner override, candidate snapshot, and finalization.
- Late/offline/reconnected submissions receive deterministic outcomes.
- Leave, remove, archive, restore, and ownership transfer obey debt and permission rules.
- All privileged multi-record mutations are atomic and audited.

### 8.5 Channel Room

- Real peer-debt ledger; no local fake balances.
- Create debt/expense with participants, amount, reason, and timestamp.
- Full settlement in integer VND; partial payment is outside the existing MVP rules.
- Personal payment QR upload/read/delete through private Storage.
- Immutable ledger/history and compensating corrections instead of destructive financial edits.
- Participant-scoped notifications and realtime invalidation.

### 8.6 Personal Funds

- Outstanding obligations first, followed by payment history.
- Aggregate read model without one request per contribution.
- Outstanding, confirmed, corrected, and archived-room states; no due date or overdue state is introduced.
- Private payment evidence access with expiring signed URLs and hard-reload readback.
- Scoped realtime refresh after contribution/payment/correction changes.

### 8.7 Room Funds

- Create contribution for selected members or candidate snapshot.
- Confirm payment and record actor/time.
- Correct mistakes through a compensating event; do not delete append-only payments.
- Owner payment QR upload/delete with size/type/storage validation.
- Totals derived from authoritative records and consistent after concurrent actions.

### 8.8 Notifications

- Events for invite, join request, approval/rejection, removal, ownership transfer, archive/restore, session/deadline, attendance result, fund contribution, payment confirmation/correction, QR availability, and admin lifecycle where relevant.
- Each notification has recipient, event key, entity reference, deep link, created time, and read state.
- Dedupe prevents retry/reconnect from creating duplicates.
- Read/unread state remains consistent across header, route change, reconnect, and multiple tabs.

### 8.9 Admin

- User and room discovery with real pagination and filters.
- Archive/restore user and room workflows with exact confirmation rules.
- Safe ownership resolution when archiving an owner.
- Manual session closure where allowed.
- Realtime refresh for lifecycle changes and visible audit outcomes.
- No service-role credential or unrestricted dataset is exposed to the browser.

## 9. Auth, authorization, and data boundary

### 9.1 Confirmed current risks

- Browser repositories use the public Supabase client.
- Current Auth0 session is not wired into that client as an authenticated RLS identity.
- Several tables have broadly readable policies, while mutation policies are service-role oriented.
- Channel-room read policy is service-role restricted.
- Current public Presence allows client-provided identity and room metadata.
- Source helper `is_service_role()` uses `current_user = 'postgres'` inside `SECURITY DEFINER`. Under a postgres-owned function this can evaluate true for non-service callers. Live function owner/grants have not been inspected, so deployed exploitability is unknown; the new baseline must eliminate this bypass and prove anonymous writes are denied.

Depending on deployed function ownership/grants, real browser mutations may be rejected or overauthorized; sensitive reads may also be overexposed. The live RLS matrix, not the policy names, determines the actual boundary.

### 9.2 Target model

1. Configure Supabase third-party authentication for Auth0.
2. Supply the trusted Auth0 token to the Supabase browser client for RLS-protected reads and subscriptions.
3. Authorize every table by identity, room membership, role, lifecycle state, and least privilege.
4. Route privileged, financial, destructive, and multi-record mutations through server-side commands or transactional Postgres functions.
5. Validate the authoritative Auth0 session again at the server boundary.
6. Never expose the service-role credential to browser code.
7. Return stable domain error codes rather than leaking database errors.

### 9.3 Mutation classification

| Mutation class | Execution boundary |
| --- | --- |
| Simple user-owned single-row preference/read-state update | Direct RLS-protected mutation may be allowed after policy integration tests |
| Room creation plus owner membership | Atomic server command/transaction |
| Join approval plus membership creation | Atomic server command/transaction |
| Remove member plus audit/notification | Atomic server command/transaction |
| Archive/restore/transfer plus audit/notification | Atomic server command/transaction |
| Attendance finalization and candidate snapshot | Atomic and idempotent server command/transaction |
| Payment confirmation/correction plus contribution totals/audit | Atomic and idempotent server command/transaction |
| User archival plus owned-room resolution | Atomic workflow with explicit ownership rule |

## 10. Realtime design

### 10.1 Principle

Realtime is a signal that authoritative data may have changed. The client invalidates and refetches the smallest affected read model; it does not reconstruct critical financial or membership truth from unordered events.

For the current MVP scale, authenticated Postgres Changes plus debounced scoped refetch is acceptable. Private Broadcast/Presence is used only where low-latency ephemeral state is needed. A new client state/query library is not required for this phase.

### 10.2 Event matrix

| Scope | Signal | Consumer behavior | Privacy and conflict rule |
| --- | --- | --- | --- |
| Current user | Profile, archive, role/permission lifecycle | Refresh session-facing profile and protected navigation | User may only receive own lifecycle signal; server remains authority |
| Home/lobby | Room create/archive/restore; visible counts | Debounced catalog/count refetch | RLS returns only discoverable rooms; no private member metadata |
| My Rooms | Membership, invite, join-request, ownership changes | Refetch affected membership lists and badges | User-scoped channel/query |
| Meeting room | Member/request/session/attendance/candidate changes | Refetch only affected tabs/read models; preserve safe dialog input | Membership required; stale mutation receives conflict result |
| Channel room | Debt, participant, settlement, QR metadata changes | Refetch ledger/summary/participant data | Participants only; payment evidence remains private |
| Funds | Contribution, payment, correction, QR changes | Refetch totals and affected rows | No unfiltered global payment subscription |
| Notifications | Insert/read update for current user | Update unread count/list with dedupe | Current recipient only |
| Presence | Join, leave, heartbeat, route context | Show approximate online state | Private channels; server-derived identity; never authorizes or forces logout |
| Admin | User/room/session lifecycle | Refetch active admin view | Admin authorization required; no global browser service role |

### 10.3 Reconnect and ordering rules

- Show `reconnecting` when a live channel drops; do not show stale status as confirmed truth.
- After reconnect, refetch authoritative data before clearing stale state.
- Coalesce event bursts to prevent duplicate fetch storms.
- Ignore duplicate notification/event keys.
- A dialog remains open only if its subject still exists and the action remains permitted.
- If data changes while a form is dirty, preserve input and show a conflict message instead of silently overwriting it.
- Presence entries expire by heartbeat timeout and are treated as approximate.

## 11. Conflict and idempotency rules

| Conflict | Required outcome |
| --- | --- |
| Two owners approve the same join request | One membership is created; repeated approval returns an idempotent success or stable already-resolved result |
| Join/cancel races | Final state is derived from one request state machine; client refetches on conflict |
| Member removed while acting | Command is rejected with `permission_changed` or `membership_inactive`; UI preserves context and exits safely |
| Room archived while a mutation is submitted | Server rejects non-allowed writes; client moves to archived read-only state |
| Two payment confirmations | Unique idempotency key prevents double financial effect |
| Payment correction after another correction | Append-only correction chain accepts only the latest valid target state |
| Deadline closes during attendance submit | Server timestamp decides; response returns final accepted/rejected state |
| Two session finalizers | One finalization wins; later requests return the same finalized result |
| QR replaced/deleted during signed URL use | Old URL expires/fails safely; metadata refetch shows current state |
| Owner archived or leaves | Ownership transfer rule completes atomically or operation is blocked with actionable reason |
| Realtime event arrives before command response | Idempotent refetch/dedupe yields one final state without duplicate toast or row |

## 12. UX state contract

Every data-bearing screen and mutation must define:

| State | Required behavior |
| --- | --- |
| Initial loading | Stable skeleton/progress without implying an empty result |
| Empty | Explain why it is empty and expose the next valid action |
| Error | Human-readable message, stable error code for diagnostics, retry when safe |
| Validation | Field-level message linked to the input; do not rely on color alone |
| Submitting | Prevent duplicate submit while preserving form values |
| Success | Confirm the state change and show authoritative refreshed state |
| Permission changed | Explain that access changed; remove invalid controls |
| Conflict/stale | Explain the record changed and offer refresh/retry without discarding input |
| Offline | Preserve safe local input; block server-dependent claims; retry after reconnect |
| Reconnecting | Show stale indicator until authoritative refetch completes |
| Archived/read-only | Preserve history; disable mutation with reason |
| Destructive confirmation | Name the target and consequence; preserve exact protected phrases where required |

Browser `alert()` and console-only errors do not satisfy this contract.

## 13. Limited UI and component corrections

This phase may modify UI only when required by real behavior, accessibility, or contrast.

- Replace undefined legacy color classes that can produce transparent or white-on-white controls.
- Validate every shared Button variant and direct button style against its actual background.
- Ensure text meets WCAG contrast requirements.
- Ensure controls and meaningful non-text boundaries meet 3:1 where color is the visual identifier, or provide an equivalent non-color boundary.
- Use native controls for simple select behavior.
- Use buttons with `aria-pressed` for filters that are not true tabs.
- When true tabs are required, implement label/tabpanel relationships, roving focus, and arrow keys.
- Dialogs must have a focus fallback, Escape behavior where dismissal is permitted, and focus return.
- Notification popover must expose loading, empty, error, unread, keyboard, focus-return, and narrow-screen behavior.
- No new card grids, gradients, excessive borders, arbitrary spacing, or header restructuring.

## 14. Test strategy

### 14.1 Automated layers

| Layer | Required coverage |
| --- | --- |
| Pure unit | State transitions, permission guards, idempotency keys, deadline decisions, totals, pagination mapping, notification dedupe |
| Repository/command integration | Real local Supabase schema; success, constraint, rollback, retry, and stable error mapping |
| RLS matrix | Anonymous/authenticated/member/owner/admin/archived identities across select/insert/update/delete and realtime visibility |
| Storage integration | Upload, metadata, private read, signed URL expiry, replace, delete, hard reload, and unauthorized access |
| Realtime integration | Authorized subscription, isolation, reconnect/refetch, duplicate/out-of-order signals, dialog conflict |
| Route/API contract | Auth0 session validation, payload validation, permission denial, idempotent retry, no service-role leakage |
| End to end | Real login and critical route workflows with zero runtime mock providers |
| Accessibility | Keyboard, focus, names/roles/states, contrast, zoom, reduced motion, status announcements |
| Responsive | Desktop, tablet landscape/portrait, and mobile with long content and dialogs |
| Static zero-mock gate | Fail when production paths import mock modules, expose mock-auth flags, or contain known no-op handlers/data arrays |

### 14.2 Critical E2E journeys

1. Login -> create Meeting Room -> invite/request/approve -> schedule session -> submit/finalize attendance -> view history.
2. Create contribution -> member views obligation -> upload/read QR -> confirm payment -> correct mistake through append-only event -> verify totals/history.
3. Create Channel Room debt -> participant views debt -> settle -> verify ledger, notification, and realtime refresh.
4. Archive/restore/transfer room -> verify permissions, history, notifications, and concurrent stale clients.
5. Admin archives/restores user -> verify owned-room rule, active sessions, audit, and denied archived-user action.
6. Disconnect/reconnect during an open dialog -> preserve input, surface conflict, refetch authoritative state.

## 15. Implementation package sequence after spec approval

The detailed implementation plans will be written as separate reviewable packages after this spec is approved.

| Package | Scope | Exit gate |
| --- | --- | --- |
| A — Baseline, reset, zero mocks | Environment guard, clean schema baseline, remove seeds/runtime mocks/placeholders, static zero-mock test | Empty dev reset reproduces schema and app has no runtime mock path |
| B — Auth, RLS, command boundary | Auth0 token bridge, user provisioning, least-privilege RLS, server command/error/idempotency foundation | RLS matrix and authenticated integration suite pass |
| C — Home and My Rooms | Catalog/pagination, create/join/request/cancel, invitations, errors, conflict handling, realtime invalidation | Real-user E2E passes on desktop/tablet/mobile |
| D — Meeting and membership | Session scheduling/history, attendance, candidate finalization, member lifecycle, archive/transfer | Atomic lifecycle, deadline, concurrency, and permission tests pass |
| E — Funds and private Storage | Contributions, payments, compensating corrections, aggregates, QR upload/read/delete | Transaction, RLS, signed URL, hard reload, and realtime tests pass |
| F — Channel peer debt | Real debt/settlement ledger, participant permissions, personal QR, history, notifications | Zero mock debt data and full participant E2E pass |
| G — Notifications, Presence, admin | Event matrix, private Presence, reconnect semantics, admin realtime/lifecycle | Privacy, dedupe, stale, reconnect, and admin E2E pass |
| H — UX and release hardening | Contrast/components, loading/error/conflict/offline states, responsive/zoom/a11y, performance and release audit | No no-op actions, no critical accessibility failure, full regression passes |

Packages may be implemented sequentially with small independently reviewable commits. Package B is a dependency for all real-data feature packages. Destructive reset belongs only to Package A after its environment guard proves the target.

Execution dependency clarification: A removes dead fixtures and seeds and establishes the reset guard; B removes mock authentication, C replaces mock invitations, and F replaces mock debts. The zero-runtime-mock release gate is enforced after F and again in H. Temporarily disabling an unfinished action must show an explicit unavailable state, never fake success or fake data.

## 16. Definition of done

- Development reset ran only against a proven non-production target and left no seed/business records.
- Schema, functions, triggers, RLS, Storage policies, and realtime configuration are reproducible from version control.
- No production route imports or selects runtime mock data or mock authentication.
- Test doubles remain isolated under test-only boundaries.
- Auth0 identity is trusted by Supabase RLS and verified by integration tests.
- Sensitive reads are least-privilege; privileged mutations are server-authorized and atomic.
- Financial history is append-only with compensating corrections.
- Every feature catalog item has success, permission, error, conflict, empty, offline/reconnect, and archived behavior where applicable.
- Realtime subscriptions are scoped, authenticated, deduplicated, and recover through authoritative refetch.
- Notifications cover the approved domain event matrix without duplicates.
- No shipped button is white-on-white, low-contrast, or a no-op.
- Shared controls meet keyboard, focus, semantics, and contrast contracts.
- Critical E2E journeys pass with real Auth0/Supabase development infrastructure on desktop, tablet, and mobile.
- Full unit, type, lint, integration, RLS, Storage, realtime, E2E, accessibility, and responsive gates pass.

## 17. References

- [Supabase Auth0 third-party authentication](https://supabase.com/docs/guides/auth/third-party/auth0)
- [Supabase third-party authentication overview](https://supabase.com/docs/guides/auth/third-party/overview)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase subscribing to database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Supabase local development CLI workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase seed data](https://supabase.com/docs/guides/local-development/seeding-your-database)
- [Auth0 Next.js SDK `getAccessToken`](https://auth0.github.io/nextjs-auth0/functions/client.getAccessToken.html)
- [WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2 non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [PostgreSQL current_user and SECURITY DEFINER](https://www.postgresql.org/docs/current/functions-info.html)
