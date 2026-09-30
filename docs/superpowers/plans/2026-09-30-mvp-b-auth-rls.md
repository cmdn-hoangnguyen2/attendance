# B — Auth, RLS and Command Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Replace mock authentication with real Auth0 identity and enforce consistent read, realtime, and command authorization.

**Architecture:** A session-authorized endpoint supplies an Auth0 ID token to Supabase in memory. RLS maps string `sub` to application UUID and namespaced role claim; critical commands validate the SDK session server-side and call service-role-only transactional RPCs.

**Tech Stack:** Auth0 Next.js SDK 4.30.0, supabase-js 2.116.0, Next 16.3.5 Route Handlers, PostgreSQL.

**Spec:** Approved hardening design sections 8.1, 9-12; shared constraints in `2026-09-30-mvp-hardening.md`. Depends on A.

## Global Constraints

- Auth0 namespaced claims remain the source of truth for the global `admin`/`user` role.
- Never persist bearer tokens in localStorage/sessionStorage, log them, or expose service-role credentials.
- Supabase literal JWT `role` is `authenticated`; global application role is `https://diemdanh.cmdn/role`, not the same claim.
- No production mock provider, bypass, email-based authority or browser provisioning fallback.
- Missing or invalid configuration fails explicitly; no new application dependency.

## Review Focus

- Auth0 subject is non-UUID and repeated callback must not create duplicate users (B1-B2).
- Archived profile must remain archived after fresh login/provisioning (B1).
- Spoofed actor/body role and cross-origin cookie-bearing requests are denied (B3).
- Literal authenticated claim does not imply application admin (B2).
- Expired token or provisioning failure must terminate loading with recovery UI (B1-B2).

### Task B1: Real authentication provider, profile and configuration

**Files:** Create `src/context/AuthContext.tsx`, `src/lib/authClaims.mjs`, `src/lib/server/requireActor.ts`, `src/app/api/me/route.ts`, `tests/unit/auth-claims.test.mjs`, `tests/contracts/auth-session.test.mjs`; modify `src/lib/auth0.ts`, `src/lib/supabase/server.ts`, `src/proxy.ts`, `src/app/layout.tsx`, `.env.example`, `tests/unit/auth0-sync.test.mjs`, `docs/04-auth-security.md`; update imports/branches in `AppHeader`, `AppShell`, `NotificationPopover`, `OnlineUsersSidebar`, Home/My Rooms/Funds/Meeting/Settings/Login pages; delete `AuthMockContext.tsx` and `RoleSwitcherBanner.tsx`.

**Interfaces:** `resolveGlobalRole(claims: Record<string, unknown>): 'admin' | 'user'` recognizes documented trusted Auth0 role claims, never an email/DB role. `requireActor(): Promise<{ userId: string; auth0Subject: string; globalRole: 'admin' | 'user' }>` uses `auth0.getSession()` and active lifecycle. `useAuth(): { currentUser: User | null; isAuthenticated: boolean; isAdmin: boolean; isLoading: boolean; error: string | null; retry: () => void; login: () => void; logout: () => void }`. `/api/me` provisions by immutable subject through server-only repository and returns profile/lifecycle state; no email fallback in a reset database.

- [ ] Write tests: email matching an admin -> user; missing claims -> user; literal `role=authenticated` -> user; namespaced admin -> admin. HTTP contracts: anonymous -> 401; archived -> 403 without reactivation; repeated login -> one user; provisioning failure -> explicit error; client role cannot override. Revise the old copied auth test to import actual role logic while retaining business assertions.
- [ ] Run `node --test tests/unit/auth-claims.test.mjs` and contract suite; expected FAIL for missing boundary.
- [ ] Implement provider and session lookup; remove role switcher/mock branches/imports and proxy bypass. Remove dummy Auth0/Supabase fallbacks. Configuration validation must occur at first required runtime access with a precise error, allowing unit tests unrelated to auth to run without secrets. Remove `users.role` as authorization authority; retain deprecated column temporarily only if mapping needs it until generated types are updated.
- [ ] Run tests/typecheck/scoped lint; real login -> hard reload -> logout -> anonymous denial. Record failed provisioning and archived-account recovery states. Update docs to explain trusted token bridge in B2 and no token storage.
- [ ] Commit: `feat: enforce real Auth0 session lifecycle`.

### Task B2: Auth0 ID-token bridge and least-privilege RLS

**Files:** Create `src/app/api/auth/supabase-token/route.ts`, `src/lib/supabase/tokenProvider.ts`, `supabase/migrations/20260930000002_auth_rls.sql`, `tests/database/authorization.test.sql`, `tests/integration/auth-rls.test.mjs`, `docs/operations/auth0-supabase.md`; modify `src/lib/supabase/client.ts`, `src/types/database.ts`, `.env.example`, `supabase/config.toml`, `docs/04-auth-security.md`.

**Interfaces:** `getSupabaseToken(): Promise<string | null>` fetches only the authenticated same-origin session endpoint, caches in memory until expiry minus 60s, clears on logout/401. Endpoint returns `{ token: string; expiresAt: number }` with `Cache-Control: no-store`; use SDK session `tokenSet.idToken`, never `getAccessToken()` as a substitute for this Supabase integration. Missing/expired ID token returns 401 and requires session renewal/login, with no indefinite retries. SQL `current_app_user_id() returns uuid`, `is_app_admin() returns boolean`, `can_manage_room(room_id uuid)`, `can_read_room(room_id uuid)` use JWT subject/namespaced role plus active DB lifecycle; fixed `search_path`, narrow grants and no caller-supplied identity.

- [ ] Write SQL assertions for anonymous, active nonmember, member, owner, admin, removed member, archived user and contributor-with-retained-debt. Cases cover read/write across all tables, forged UUID subject, private/channel discovery, archived room detail denial, own notification read-state only, peer party isolation, direct financial writes denied. Add HTTP tests for token endpoint no-store, 401, same-origin, no token logging and missing claims.
- [ ] Pin the definer-owner case: baseline/new helpers owned by postgres must not make `anon` or normal authenticated callers service-role equivalent. Inspect `pg_proc.proowner`, EXECUTE grants and policy role targets; assert sensitive reads and all direct privileged writes fail under actual switched roles. Do not assume a policy named service_role applies only to that role.
- [ ] Run DB/integration tests; expected FAIL under baseline deny-all or broad old rules. Test SQL may set trusted synthetic claims in a disposable DB to exercise policies, but live integration must additionally prove real Auth0-issued token acceptance.
- [ ] Configure third-party Auth0 integration and an Auth0 Post Login Action adding literal `role: authenticated` to ID token and approved namespaced role. Tenant changes are an external configuration action: document exact action and apply only through available authorized access. Use RS256-compatible tenant settings and verify issuer against actual project config. Implement client `accessToken` callback with installed Supabase SDK; use `auth.jwt()->>'sub'`, not `auth.uid()` for non-UUID Auth0 subjects.
- [ ] Implement default-deny RLS for base rows; expose narrowly scoped DTO/read RPCs for catalog owner/count and archived contributor payment info, not broad users/membership reads. Contributor retains own obligations/history after leaving/removal/archive; normal member cannot open archived details; owner/admin can confirm existing archived payments. Remove role mirror/helper authority. Column restrictions prevent notification title/recipient editing while allowing own `is_read` update. New tables in later packages inherit explicit restrictive policies.
- [ ] Preserve a narrow own-lifecycle signal even when the current user becomes archived: subject-bound own profile/status visibility allows the `users` change signal, while financial/room reads and mutations remain denied. SQL tests assert this deliberate exception. `useUserRealtime` triggers AuthContext `/api/me` refresh, which shows suspension on 403; window focus/reconnect also refreshes profile so a missed signal cannot leave access falsely claimed.
- [ ] Run real-token Data API/Realtime/Storage integration and SQL matrix. Expected unauthorized rows absent, direct critical writes denied, own scoped reads allowed. Refresh/relogin applies Auth0 claim changes; do not promise immediate detection of tenant role edits in an already issued JWT.
- [ ] Commit: `feat: bridge Auth0 identity into Supabase RLS`.

### Task B3: Stable command, idempotency and notification contract

**Files:** Create `src/types/commands.ts`, `src/lib/commandClient.ts`, `src/lib/server/commandResponse.ts`, `tests/contracts/command-boundary.test.mjs`; modify `src/lib/server/requireActor.ts`, B migration, `src/types/database.ts`, `src/types/domain.ts`, `docs/07-api-backend-phase.md`.

**Interfaces:** `CommandResult<T> = { success: true; data: T } | { success: false; error: { code: CommandErrorCode; message: string; fields?: Record<string,string> } }`. Codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `ARCHIVED`, `MEETING_CLOSED`, `PERMISSION_CHANGED`, `MEMBERSHIP_INACTIVE`, `INTERNAL_ERROR`. `postCommand<T>(url: string, body: unknown, requestId: string): Promise<CommandResult<T>>` sends a UUID in `Idempotency-Key` and reuses it on explicit retry. SQL `command_receipts(actor_id uuid, request_id uuid, command text, payload_hash text, response jsonb)` unique `(actor_id, request_id)`; same key/different command or payload -> conflict, hash canonical `jsonb::text` plus command name, insert receipt and mutation in one transaction. Extend notifications with `event_key`, `event_type`, `entity_type`, `entity_id`, safe `deep_link`; unique `(user_id,event_key)`. SQL `enqueue_notification(recipient_id uuid, event_key text, event_type text, entity_type text, entity_id text, deep_link text, title text, content text) returns void`, server-only execute.

- [ ] Write HTTP/SQL tests: forged actor ignored/rejected; no cookie -> 401; cross-origin mutation -> 403; malformed JSON/UUID -> 400; internal DB detail sanitized -> 500; reused request+same payload -> same response; different payload -> 409; rollback removes receipt/audit/notification; duplicate recipient/event -> one notification.
- [ ] Run command contracts and DB tests; expected FAIL before actual contract/functions.
- [ ] Implement helpers with native fetch/JSON/crypto and explicit same-origin check; do not introduce a generic command dispatcher or transaction abstraction. Each later feature Route Handler calls `requireActor`, validates finite input, then its own service-only RPC passing authoritative actor/role. SQL functions recheck active lifecycle and room state within the same lock/transaction; browser cannot execute actor-parameterized privileged functions.
- [ ] Run contracts/DB tests; expect stable status/code mapping. Pin HTTP 401/403/404/409/400/500 respectively. UI messages remain Vietnamese, diagnostics contain no SQL/secrets. Notification deep links are generated server-side from known entities only.
- [ ] Commit: `feat: define authorized idempotent command contracts`.

**Package acceptance:** Real login/provisioning/RLS/token integration proven; no runtime mock-auth branch; financial/direct privileged writes cannot bypass server command boundary. Zero-mock final gate remains pending C/F.

**References:** [Supabase Auth0 ID-token integration](https://supabase.com/docs/guides/auth/third-party/auth0), [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization). Installed SDK declarations confirm `SessionData.tokenSet.idToken` and Supabase `accessToken` callback; revisit exact local SDK interfaces before coding.
