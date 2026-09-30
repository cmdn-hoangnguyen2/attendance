# G — Notifications, Presence, Realtime and Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Complete the domain event matrix, private online/room context, reconnect behavior and authorized admin lifecycle.

**Architecture:** Persist notifications inside business transactions; Postgres Changes invalidates scoped read models. Private channels carry minimal signals; authoritative Presence display comes from session-authorized heartbeat records, never arbitrary client payload identity. Admin commands use Auth0 role claims and transactional SQL.

**Tech Stack:** Existing Supabase Realtime, PostgreSQL, Next Route Handlers, native fetch; Auth0 Management API only for authoritative replacement-admin roster.

**Spec:** Hardening sections 8.8-8.9, 9-14; existing realtime and archive docs. Depends on F.

## Global Constraints

- Presence is approximate and never authorizes actions or forces logout.
- Sensitive room/financial/requester/private QR data is never sent to broader channels.
- After reconnect refetch authoritative data before clearing stale state.
- Auth0 is global role authority; application DB must not become an independent role mirror.
- No new event bus/query library; use existing 300ms debounce and channel-name helper.

## Review Focus

- Notification transaction rollback produces no phantom event; retry produces one notification (G1).
- Forged Presence key/name/room cannot alter displayed identity or log another user out (G2).
- Lost connection, multiple tabs, hidden tab and route changes preserve one coherent approximate state (G2).
- Existing private-channel authorization may outlive a membership change; recheck data permissions and close stale subscriptions (G2).
- User archival transfers owned active rooms atomically; replacement eligibility comes from Auth0, not cached DB role/email (G3).

### Task G1: Notification event completeness and header/read consistency

**Files:** Create `tests/database/notification-events.test.sql`, `tests/contracts/notifications.test.mjs`, `tests/integration/notification-realtime.test.mjs`, `docs/qa/notification-event-matrix.md`; modify all C/D/E/F producer SQL functions, `src/lib/repository/notificationRepository.ts`, `NotificationPopover.tsx`, `AppHeader.tsx`, `useUserRealtime.ts`, types and `docs/05-realtime.md`.

**Interfaces:** Existing B `enqueue_notification` contract; `findNotificationsPage({page,pageSize}): Promise<PageResult<AppNotification>>`; `markAsRead(id)` and `markAllAsRead()` affect only authenticated recipient. Notifications include event key/entity/deep link. A generated known-route link is reauthorized on navigation; permission loss shows clear destination state.

| Event | Recipients | Safe destination |
| --- | --- | --- |
| join requested | room owner | Members request list |
| approved/rejected | requester | My Rooms or authorized room |
| invitation sent/resolved | invitee; inviter on resolution | My Rooms invitation; room members |
| member removed | removed user | My Rooms/access state |
| ownership transfer | old/new owners | My Rooms/authorized room |
| room archived/restored | affected members and obligation contributors | My Rooms; Funds for retained debts |
| session scheduled/deadline finalized | eligible session participants | Attendance/history where permitted |
| attendance override | affected participant | Session result |
| fund contribution/payment/correction | contributor; designated owner when relevant | Funds/payment info |
| peer debt/settlement/correction | creditor/debtor | Own ledger/Funds |
| QR added/replaced/deleted | current affected obligation parties | Authorized payment info |
| user archived/restored/admin action | affected user; acting admin where actionable | Account state/admin audit |

- [ ] Write transaction-level assertions for every matrix row: exact allowed recipients, one event key per recipient, no self-action noise unless a lifecycle result needs retention, rollback emits none, repeated command no duplicates. Cross-user mark/read/title/recipient edit denied. HTTP deep-link payload cannot supply external/unsafe URL.
- [ ] Run SQL/contracts/live subscription tests; expected FAIL on missing producers and unstructured notifications.
- [ ] Complete producer calls in the existing transactions; add no independent event dispatcher. Extend repository to propagate errors rather than console-only fallbacks. Read-state command is own-row RLS or narrow RPC with column protection. Concurrent mark-all/new insert keeps later notification unread; do not overwrite entire list with stale response.
- [ ] Header popover shows loading/empty/error/retry, unread count, per-item destination and mark-read; keyboard/Escape/focus return and mobile bounds are pinned in H2. Room access loss revalidates deep link rather than exposing cached private detail.
- [ ] Run matrix tests and two-tab read/unread/reconnect E2E; expected consistent count with no duplicate notification. Commit: `feat: complete transactional notification events`.

### Task G2: Scoped realtime and authoritative approximate Presence

**Files:** Create `supabase/migrations/20260930000007_realtime_admin.sql`, `src/app/api/presence/route.ts`, `src/context/PresenceContext.tsx`, `src/lib/realtime/subscriptionLifecycle.mjs`, `tests/unit/subscription-lifecycle.test.mjs`, `tests/database/realtime-privacy.test.sql`, `tests/integration/realtime-privacy.test.mjs`; modify all four realtime hooks, OnlineUsersSidebar, AppShell, Meeting page, B token provider, existing realtime tests, `docs/05-realtime.md`.

**Interfaces:** `RealtimeState = 'connecting'|'live'|'reconnecting'|'offline'|'error'`; hook options retain existing identifiers/callback/enabled and add `onStateChange`, `onReconnect` callbacks. `createScopedSubscription(client,bindings,{onDataChange,onStateChange,onReconnect,delayMs:300})` returns cleanup; registrations happen before subscribe and each mount gets unique instance name. `POST /api/presence` `{connectionId:uuid,roomId?:uuid}` derives user/room authorization; per-connection `last_seen_at` from server. `GET /api/presence` returns safe DTOs, expiry 90s, heartbeat 30s, and private location only when viewer may know it. Name/identity comes from trusted profile join. Private lobby/room Presence payload is a signal only; display refetches authorized DTO, never renders raw track payload.

G migration defines `user_presence_connections(user_id uuid, connection_id uuid, room_id uuid NULL, last_seen_at timestamptz, PRIMARY KEY(user_id,connection_id))`, direct browser writes/reads denied. `GET /api/presence` joins only active-user public display DTO `{userId,name,isOnline,roomId:null|authorizedId,roomName:null|authorizedName}`; it never returns email, bearer/session IDs or raw private location to unauthorized viewer. POST updates the authenticated actor's connection only; DELETE own connection on best-effort exit, TTL covers crashes. User-scoped lifecycle subscription binds `users.id=currentUser.id` and owns auth profile refresh, not the Presence payload.

- [ ] Write actual lifecycle helper tests: latest callback, 300ms burst coalescing, timers/channels removed on unmount, route/session change creates clean subscription, network loss -> stale, subscribed after disconnect -> refetch before live, failed refetch keeps stale. Extend existing fake channel only as test transport, never duplicate production hook logic.
- [ ] Write live privacy cases: unauthorized room/user/admin topic denial; third party receives no financial row, private location or notification; payload forged with another user key triggers at most safe refetch; no logout. Two own tabs do not eject each other; one tab leaves while another remains -> online; all expire -> offline; reconnect revalidates data; archived/removed member cannot read subsequent private rows.
- [ ] Run tests; expected FAIL for global public Presence and missing lifecycle states.
- [ ] Implement topic-specific RLS on `realtime.messages` with `private:true` for private Broadcast/Presence; do not ALTER managed realtime schema ownership. Postgres Changes authorization uses table RLS independently. Remove public access where authorized config supports it; record dashboard setting evidence. Private topic parsing must distinguish logical room/user ID from generated instance suffix exactly; do not trust channel name alone.
- [ ] Replace duplicate-session logout with harmless approximate status. Heartbeat identities are server-derived; profile/location cannot be supplied by track payload. Route-aware provider mounted once in shell sends null location on navigation outside room; hide a private location globally and show it only inside authorized room context. Hidden-tab throttling can mark approximate offline; document rather than claiming exact attendance.
- [ ] Scope user/room payment refresh to parent contribution/debt updates. Catalog count invalidation uses safe room count change, not broadcasted member list. On lifecycle notification/room update, close obsolete channels and refetch permissions. Since private-channel policies are evaluated at join and may be cached, never stream sensitive raw fields through Broadcast; subsequent reads/table events must independently enforce current RLS. Reauthenticate socket after token replacement; no silent anon fallback.
- [ ] Run integration suite and two native sessions: lobby->room->outside, connection loss/reconnect, archive/removal while dialog dirty, third-party privacy. Commit: `feat: scope realtime and secure room-aware presence`.

### Task G3: Authoritative admin directory, lifecycle and realtime

**Files:** Create `src/lib/server/adminDirectory.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/users/[userId]/lifecycle/route.ts`, `src/app/api/admin/rooms/route.ts`, `src/lib/realtime/useAdminRealtime.ts`, `tests/database/admin-lifecycle.test.sql`, `tests/contracts/admin-lifecycle.test.mjs`; modify G migration, admin repositories/interfaces/presentation, Settings page, domain/generated types, `.env.example`, operations Auth0 doc, existing archive modals.

**Interfaces:** `listEligibleReplacementAdmins(): Promise<Array<{id:string;displayName:string}>>` uses native Auth0 Management API `/api/v2/roles/{roleId}/users` with server-only M2M credentials and endpoint-required least-privilege scope, maps Auth0 role members to active provisioned app subjects. Environment includes `AUTH0_MANAGEMENT_CLIENT_ID`, `AUTH0_MANAGEMENT_CLIENT_SECRET`, `AUTH0_ADMIN_ROLE_ID`; no credential/role mirror shipped to browser. POST user lifecycle `{action:'archive'|'restore',replacementAdminId?:string,confirmationPhrase?:string}`; SQL `change_user_lifecycle` uses exact common privileged signature and server-validated recipient, applies global user/room lock order, transfers ALL active owned rooms and ensures recipient active membership, then archive/audit/notifications atomically. Audit uses consistent `user.archived`/`user.restored` lifecycle actions so D1 can reconstruct deadline-time eligibility.

- [ ] Write cases: nonadmin/archived actor denied; exact phrase required; missing replacement with owned rooms denied; one eligible replacement preselected, multiple require selection; inactive/nonadmin/self recipient rejected; Management API failure does not trust stale DB role; one transfer failure rolls back whole archival; restore does not undo transferred ownership; archived user's next command denied; debt history preserved; concurrent room ownership creation serializes safely.
- [ ] Run contracts/SQL; expected FAIL under browser sequential archive and DB-role authority.
- [ ] Implement directory fetch with server-only token/no logs and pagination; verify actual Auth0 endpoints/scopes before external configuration. Configure only if authorized account access exists; missing credentials are a visible admin capability error, not a fallback role list. Existing login/normal features remain usable while this specific external gate is blocked.
- [ ] Implement paginated admin users/rooms/audit reads, archived filters, lifecycle RPC and `useAdminRealtime` on authorized user/room/session changes. Wire current admin UI with proper denial/loading/empty/error/retry; preserve protected phrases. Manual session closure uses D1 admin command, never browser cron secret.
- [ ] Run actual admin archive/restore/manual-close and second-client realtime tests. Record Auth0 external config completion separately from repository test success. Commit: `feat: authorize admin lifecycle and live management views`.

**Package acceptance:** Event matrix and private realtime proven; online state is route-aware, approximate and non-authoritative; admin transactions/role source remain consistent.

**References:** [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes). Verify current Auth0 Management API role-member endpoints/scopes from official docs during G3 before implementation/configuration.

Verified roster source: [Auth0 — View users assigned to roles](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/roles/view-users-assigned-to-roles). Exact Management API token scope is an external execution prerequisite and must be checked against that endpoint; do not request broad user-write permissions.
