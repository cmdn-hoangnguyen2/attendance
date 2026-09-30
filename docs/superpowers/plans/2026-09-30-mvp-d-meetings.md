# D — Meetings and Membership Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Implement explicit sessions, deadline snapshots/history and atomic room/member lifecycle with retained financial obligations.

**Architecture:** Database time and row locks govern deadlines/state transitions. Replace implicit session creation and multi-step browser mutations with authenticated server commands; keep existing workspace presentation.

**Tech Stack:** Existing Next/Supabase/PostgreSQL; native datetime input; Asia/Ho_Chi_Minh (+07:00).

**Spec:** Hardening design sections 8.4, 9-14 and existing `docs/03-domain-and-states.md`. Depends on C.

## Global Constraints

- Self-attendance deadline equals `startsAt`, exclusive; at exact start time submission is late.
- Absent candidate snapshot creates no monetary obligation; leave is excluded; later corrections never erase candidate evidence.
- Owner cannot leave; transfer recipient is an active member; old owner remains member.
- Room archive retains money/history; normal users cannot open archived details; contributor payment-info remains available.
- Exact phrases and white responsive visual system remain unchanged; no recurring schedule or extra dependency.

## Review Focus

- Job delayed beyond member removal: deadline snapshot uses membership validity at deadline (D1).
- Exact deadline/timezone midnight: server timestamp defines eligibility and current session (D1).
- Late owner override changes attendance but retains original candidate snapshot (D1).
- Archive and concurrent contribution/member action must serialize consistently (D2).
- Debt confirmation is determined server-side even if UI believed member had no debt (D2).

### Task D1: Schedule, attendance, deadline finalization and history

**Files:** Create `supabase/migrations/20260930000004_meetings.sql`, `src/app/api/rooms/[roomId]/sessions/route.ts`, `src/app/api/sessions/[sessionId]/attendance/route.ts`, `src/app/api/sessions/[sessionId]/close/route.ts`, `src/modules/meetings/presentation/ScheduleSessionModal.tsx`, `src/modules/meetings/presentation/SessionHistory.tsx`, `tests/database/meeting-lifecycle.test.sql`, `tests/contracts/meeting-lifecycle.test.mjs`; modify meeting repositories/interfaces, Meeting page, `AttendanceTab.tsx`, cron route, types and `tests/unit/scheduled-close.test.mjs`.

**Interfaces:** POST room sessions `{title:string,startsAt:string}`; server computes deadline=`startsAt`, closesAt=next midnight in Asia/Ho_Chi_Minh; `MeetingSession` includes title. POST attendance `{status:AttendanceStatus,userId?:string}`: absent userId means self; target userId requires owner/admin. SQL `schedule_session`, `set_attendance`, `close_session` use the master common mutator signature; `finalize_session_deadline(session_id uuid) RETURNS jsonb`, `close_due_sessions(as_of timestamptz) RETURNS jsonb` are service-only/idempotent system functions with audit `actor_id=null`, never fixed admin UUID. `findSessionHistoryPage(roomId:string,page:number,pageSize:number): Promise<PageResult<MeetingSession>>` and `findSessionHistory(sessionId:string): Promise<{session:MeetingSession;attendance:AttendanceRecord[];candidates:FundCandidate[];corrections:AuditLog[]}>` are added to the existing meeting repository. History DTO must respect current authorization.

- [ ] Write SQL/HTTP tests: future session only; starts 10:00 => self 09:59:59 accepted, 10:00:00 rejected; invalid enum/target denied; no auto-create on attendance; missing attendance defaults absent; leave never candidate; repeated finalization one record/candidate; delayed finalizer uses membership intervals at deadline; later join excluded; removal before deadline excluded, removal after deadline retains snapshot; owner override audit exists without removing candidate; next local midnight stops current session even if job late.
- [ ] Run DB/HTTP tests; expected FAIL for missing deadline function and old auto-create behavior.
- [ ] Implement schedule/time validation, global lock order and deadline finalized timestamp. Record participant eligibility sufficient to reproduce deadline state: temporal membership join/end timestamps plus session participant snapshot finalized under lock; do not infer solely from present `status='active'`. Rejoin produces a new membership interval. Resolve user lifecycle at deadline from immutable archive/restore audit transitions, not current status after a later restore; add delayed-job/archive/restore assertion. Preserve candidate `attendance_status_at_deadline`, display name, email and suggested amount as snapshot fields rather than deriving them from current corrected records/profile. Finalization runs before any post-deadline override, ensuring it captures pre-correction truth.
- [ ] Implement audited attendance corrections and immutable candidate snapshot; permit documented owner/admin corrections with audit, forbid silent overwrites of closed history. No automatic fund contribution creation. Native form handles timezone explicitly and selected session history retains title/date/attendance/candidates.
- [ ] Harden cron: GET requires configured bearer secret and fails closed when absent; remove query-string secret; POST manual action requires actual admin session. Use server Supabase client, not browser repository singleton. Finalize due deadlines then close expired sessions transactionally per session; add deployment scheduler instruction and job evidence without introducing a queue. Delayed scheduling is covered by read and mutation guards.
- [ ] Run tests and scheduled-close regression; live schedule->self attendance->deadline->history flow; verify owner/admin/member denial plus no-session empty state on all three viewports. Commit: `feat: persist meeting deadlines and session history`.

### Task D2: Atomic membership, archive, restore and ownership

**Files:** Create `src/app/api/rooms/[roomId]/members/[userId]/route.ts`, `src/app/api/rooms/[roomId]/lifecycle/route.ts`, `tests/database/membership-lifecycle.test.sql`, `tests/contracts/membership-lifecycle.test.mjs`; modify D migration, room repository, Meeting handlers, `MembersTab.tsx`, `RemoveMemberModal.tsx`, `LeaveRoomModal.tsx`, `ArchiveRoomModal.tsx`, `TransferOwnershipModal.tsx`, `AccessRevokedModal.tsx`.

**Interfaces:** POST member `{action:'leave'|'remove',reason?:string,confirmationPhrase?:string}`; leave target must equal actor. POST lifecycle `{action:'archive'|'restore'|'transfer'|'update',confirmationPhrase?:string,newOwnerId?:string,name?:string,visibility?:RoomVisibility}`. SQL `change_membership`, `change_room_lifecycle` use the exact common mutator signature, service-only and receipt-aware. Apply global lock order before eligibility/debt checks; archive/transfer emit one audit and intended notifications in transaction.

- [ ] Write cases: owner leave denied; member leave retains obligations; removal with debt accepts only exact trimmed phrase; removal without debt needs none; owner removal blocked until transfer; inactive recipient/outsider cannot receive ownership; old owner stays member; transfer recipient removed concurrently -> no partial transfer; archived room forbids joins/new sessions/contributions/images; existing payment remains confirmable; only admin restores; restoring retains former left/removed membership and never reactivates archived users.
- [ ] Run SQL/HTTP suite; expected FAIL under browser sequential writes.
- [ ] Implement authoritative transitions and consistent room-lock ordering shared with D1/E/F commands; update handlers to use B results and receipt keys. Archive preserves records and prior membership states, revokes normal detail access. Transfer selects active members only, without typed phrase. Preserve exact confirmation copy.
- [ ] Handle access loss during open modal: invalid action stops, form displays reason, close/return Home works; dirty harmless input can remain for conflict retry but cannot submit invalid subject. Refetch after mutation; do not silently discard outstanding debt or replace permission with client assumptions.
- [ ] Run new tests plus original membership lifecycle assertions; live owner/member/admin archive/restore/leave/remove cases, before/after deadline and realtime while dialog open. Commit: `feat: transact room and member lifecycle`.

**Package acceptance:** Scheduling and immutable history work; membership/archive/transfer transitions are atomic and financial visibility survives access changes.
