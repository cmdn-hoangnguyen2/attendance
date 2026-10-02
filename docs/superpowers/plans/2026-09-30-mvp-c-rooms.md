# C — Home, My Rooms and Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Make room discovery, pagination, creation, join requests and invitations operate on authorized real data.

**Architecture:** Extend existing room repositories with scoped paginated read RPCs and Route Handler commands backed by transactional SQL. Preserve redesigned composition while supplying real state and errors.

**Tech Stack:** Existing Next/React/Supabase; native fetch and PostgreSQL constraints.

**Spec:** Approved hardening design sections 6-12; shared constraints in `2026-09-30-mvp-hardening.md`. Depends on B.

## Global Constraints

- Channel rooms are invite-only and hidden from outsiders.
- Private Meeting rooms expose only discoverable name/owner/member count to active nonmembers.
- Keep white Cobalt Commons UI and desktop/tablet/mobile composition; no new application dependency.
- Auth0 determines global role; commands determine actor from session.
- No mock invite list, browser alert, no-op pagination or console-only errors.

## Review Focus

- Search/filter while on last page resets to page 1 and ignores stale responses (C1).
- Private room count/owner DTO does not disclose member identities (C1).
- Double-click/retry create or approve creates one room/membership (C2).
- Invite target joins or is archived while dialog is open: refresh and actionable conflict (C3).
- Join rejection permits resubmit; cancellation cannot undo approval (C2).

### Task C1: Authoritative catalog and My Rooms pagination

**Files:** Create `supabase/migrations/20260930000006_rooms.sql`, `tests/database/room-catalog.test.sql`, `tests/integration/room-catalog.test.mjs`, `src/types/pagination.ts`; modify `src/modules/rooms/domain/repository.ts`, `src/modules/rooms/infrastructure/supabase-room-repository.ts`, `src/app/page.tsx`, `src/app/my-rooms/page.tsx`, `src/modules/rooms/presentation/RoomListFilter.tsx`, `src/components/ui/Pagination.tsx`, `src/lib/realtime/useLobbyRealtime.ts`, generated DB types.

**Interfaces:** `PageResult<T> = { items: T[]; total: number; page: number; pageSize: number }`. `RoomCatalogItem = {room:Room;ownerName:string;isMember:boolean;requestStatus:JoinRequestStatus|null}`; `MyRoomItem` extends it with `invitation:{id:string;status:string}|null`. Define these types in room domain repository, not an unnamed later file. `findCatalogPage({ search?: string; visibility?: RoomVisibility; type?: RoomType; page: number; pageSize: number }): Promise<PageResult<RoomCatalogItem>>`; `findMyRoomsPage({ section: 'owned'|'joined'|'pending'|'invited'; search?: string; page: number; pageSize: number }): Promise<PageResult<MyRoomItem>>`. Use `pageSize=12`, 1-based page; stable `created_at DESC,id DESC`; literal case-insensitive search. SQL `get_room_catalog(search text, visibility text, room_type text, page integer, page_size integer) RETURNS jsonb`, `get_my_rooms(section text, search text, page integer, page_size integer) RETURNS jsonb` bind current JWT identity. Row predicates and totals are identical. C3 adds invitations; invited section becomes available only after C3 schema/flow lands.

- [ ] Write real SQL/integration assertions: 13 visible rooms -> pages 12+1; wildcard characters `%`/`_` are literal search input; foreign Channel/archived rooms excluded from items AND total; private Meeting metadata includes no member emails; last page becomes empty after deletion/archive; read errors reject instead of returning an empty list.
- [ ] Run catalog DB/live tests; expected FAIL under old array/no-op model.
- [ ] Implement scoped read RPCs and repository mappings; replace client all-users/all-membership scans. Home sends anonymous user to `/login` after auth resolves; no infinite skeleton. Search/visibility/type changes reset page 1; stale requests use cancellation or monotonically increasing request ID; out-of-range page refetches nearest valid page once.
- [ ] Wire Pagination current/total pages to server result; hide single-page navigation if appropriate. Extend My Rooms with pending/invited sections using same design primitives. Add initial loading, real empty/search-empty, explicit read error/retry; retain old list during background refresh with stale indicator.
- [ ] Add `room_catalog_signals(room_id uuid PRIMARY KEY, member_count integer, version bigint, updated_at timestamptz)` maintained transactionally by room/membership triggers. RLS exposes only safe signal IDs/counts for discoverable Meeting rooms or own current/prior Channel relationship; no member identity/name/amount. Keep a safe lifecycle signal after archive so catalogs can remove a now-hidden room. Publish this table and scope lobby refresh to these signals and own requests; preserve 300ms debounce/latest callback/cleanup. Test count/archive updates without granting nonmember membership-row access. G2 completes connection/reconnect handling.
- [ ] Run tests and native browser cases at 1440x900, 768x1024, 390x844; expected actual page transition and guest redirect, zero overflow. Commit: `feat: paginate authorized room discovery`.

### Task C2: Atomic create, public join and private request lifecycle

**Files:** Create `src/app/api/rooms/route.ts`, `src/app/api/rooms/[roomId]/join/route.ts`, `src/app/api/join-requests/[requestId]/route.ts`, `tests/database/room-commands.test.sql`, `tests/contracts/room-commands.test.mjs`; modify C migration, room repositories/interfaces, Home/My Rooms/Meeting handlers, `CreateRoomModal.tsx`, `RoomCard.tsx`.

**Interfaces:** POST `/api/rooms` `{name,type,visibility}`; POST `/api/rooms/:id/join` `{action:'join'|'request'}`; POST `/api/join-requests/:id` `{action:'approve'|'reject'|'cancel'}`. All consume B `Idempotency-Key` and `CommandResult<T>`. SQL `create_room`, `join_room`, `resolve_join_request` use the master plan's exact privileged mutator signature and return authoritative room/membership/request JSON. Channel creation forces private invite-only semantics; outsiders cannot request/join it.

- [ ] Write tests for empty/whitespace/overlong room name (1-120 trimmed characters), invalid type/visibility, archived/soft-deleted actor, anonymous request, double create same key, two public joins, approve/approve and approve/cancel races, cancelled/rejected request resubmit. Assert one owner membership and one audit/notification per successful transition; injected failure rolls back all rows.
- [ ] Run SQL and HTTP tests; expected FAIL before routes/RPCs.
- [ ] Implement row locks, existing partial unique indexes, receipt handling and stable B errors. Derive actor on server, validate before RPC, recheck lifecycle inside transaction. Approval creates membership and notification in same transaction; requester cannot review; owner cannot spoof another requester; no browser direct write remains in handlers.
- [ ] Replace repository critical methods with command calls or directly wire feature handlers to `postCommand`; do not add a parallel repository abstraction. Forms expose submitting, field errors, permission/conflict and explicit retry using the same request key after ambiguous network loss. Fresh intent generates a new UUID. Refetch authoritative count/request status after success; remove optimistic increments that can double-count realtime.
- [ ] Run actual command tests plus existing membership suite; verify forbidden path and concurrent retry in two sessions. Commit: `feat: transact room creation and join workflows`.

### Task C3: Real eligible-user directory and invitations

**Files:** Create `src/app/api/rooms/[roomId]/invitations/route.ts`, `src/app/api/invitations/[invitationId]/route.ts`, `tests/database/invitations.test.sql`, `tests/contracts/invitations.test.mjs`; modify C migration, `src/types/domain.ts`, generated types, room repository, `InviteMemberModal.tsx`, `MembersTab.tsx`, My Rooms page, Meeting page.

**Interfaces:** `RoomInvitation { id:string;roomId:string;inviterId:string;inviteeId:string;status:'pending'|'accepted'|'declined'|'cancelled';createdAt:string;resolvedAt:string|null }`; one pending invite per room/user. `findEligibleInvitees(roomId:string, search:string, page:number): Promise<PageResult<{id:string;displayName:string;email:string}>>` is owner/admin-only, 12 per page. GET the room invitations route with `search/page` returns eligible-user DTO; POST `{inviteeId}` sends invite. POST invitation `{action:'accept'|'decline'|'cancel'}`. Accept/decline only recipient; cancel owner/admin. SQL `send_room_invitation`, `resolve_room_invitation` use the exact common mutator signature and atomically mutate membership/request/invite/receipt/audit/notification.

- [ ] Write tests: members/archived users excluded; non-owner cannot enumerate directory; outsider cannot enumerate invitations; concurrent invite duplicates return existing pending; accept twice one membership; accepting resolves own pending join request; archived room invite cannot be accepted; recipient cannot accept another user's invitation; declined can be invited again.
- [ ] Run SQL/HTTP tests; expected FAIL with local fake users/alert behavior.
- [ ] Implement real directory, invitation RLS and functions; remove `mockUsers` and `alert`. Modal search has loading/empty/error/retry, per-target submitting and conflict refresh; close only on success/cancel. My Rooms invited rows offer actual accept/decline and accurate pending status. Notifications use B enqueue contract and safe known links.
- [ ] Run tests; verify live owner->member invitation, real acceptance and Channel isolation in separate sessions; rerun runtime-data scan to confirm invite finding gone. Commit: `feat: implement real room invitations`.

**Package acceptance:** Home/My Rooms use real pagination; all create/join/request/invite controls have actual authorized behavior and visible failures.
