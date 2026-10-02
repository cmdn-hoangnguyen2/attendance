# MVP Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. BOSS selected Native execution; do not dispatch browser subagents.

**Goal:** Complete the approved MVP hardening scope with real data, authorized mutations, scoped realtime, and evidence for Tasks 1-7.

**Architecture:** Keep authenticated Supabase reads and Postgres Changes. Use Auth0-authorized Route Handlers calling narrow transactional SQL functions for critical writes. Reuse current modules and native controls.

**Tech Stack:** Next.js 16.3.5, React 19.2.8, Auth0 Next.js SDK 4.30.0, supabase-js 2.116.0, Tailwind 4, Node 24.3.0, pnpm 11.19.0.

**Spec:** `docs/superpowers/specs/2026-09-30-mvp-production-hardening-design.md` (approved by BOSS).

## Global Constraints

- Execution method: BOSS switched to coordinated subagents on 2026-10-01 in the existing `codex/ui-ux-redesign` worktree. Native browser verification remains required; no browser subagents.
- UI constraint: Do not start another visual redesign.
- Preserve the white Cobalt Commons theme, Vietnamese-first UI, Hugeicons, spacing recipes, header notification/user controls, and sidebar logout.
- Auth0 namespaced claims remain the source of truth for the global `admin`/`user` role.
- Existing local and linked development data may be deleted; production data must never be targeted.
- No new application dependency, query library, event bus, command registry, or parallel role authority.
- Money is positive integer VND; full payment only; no contribution due date, crop, payment gateway, chat, email notification, or recurring meetings.
- Channel rooms are invite-only and hidden from outsiders; private Meeting room metadata remains discoverable to active users as documented.
- Exact confirmation phrases: `Archive this room`, `Archive this user`, `I agree to remove this user`; trim surrounding whitespace only.
- Test doubles remain test-only; no production mock data or mock-auth flag.
- Read local Next.js guides and project-local coding/spacing skill references before implementation.

## Review Focus

- Archive/removal races: retained debt is readable by its contributor without restoring room access (D2/E2).
- Lost mutation response: retry preserves the request key and produces one financial/lifecycle effect (B3/E1/F1).
- Auth0 `sub` is a string, not a database UUID; map immutable subject, never cast to `auth.uid()` (B2).
- Empty database after reset: no fixed admin/system UUID or fixture fallback may be required (A2/B1/D1).
- Private channel data or location: unauthorized users must receive neither rows nor realtime payloads (B2/F1/G2).

## Files and package order

| Package plan | Tasks | Dependency | Independently reviewable output |
| --- | --- | --- | --- |
| [A — Baseline/reset](2026-09-30-mvp-a-baseline-reset.md) | A1-A3 | None | Guarded reset, reproducible seed-free baseline, test infrastructure |
| [B — Auth/RLS](2026-09-30-mvp-b-auth-rls.md) | B1-B3 | A | Real auth provider, token bridge, restrictive policies, command contract |
| [C — Home/My Rooms/invites](2026-09-30-mvp-c-rooms.md) | C1-C3 | B | Paginated catalog and real room/invitation actions |
| [D — Meetings/membership](2026-09-30-mvp-d-meetings.md) | D1-D2 | C | Atomic session, deadline, member and room lifecycle |
| [E — Funds/Storage](2026-09-30-mvp-e-funds-storage.md) | E1-E2 | D | Append-only correction, fund aggregates, private QR |
| [F — Channel debt](2026-09-30-mvp-f-channel-debt.md) | F1-F2 | E | Real peer ledger and personal QR; zero runtime mocks |
| [G — Notifications/Presence/admin](2026-09-30-mvp-g-realtime-admin.md) | G1-G3 | F | Event coverage, privacy, reconnect, admin lifecycle |
| [H — UX/release](2026-09-30-mvp-h-ux-release.md) | H1-H3 | G | Component corrections, complete E2E/responsive evidence |

The planned forward-only migration sequence has unique ownership: A `20260930000001_baseline.sql`; B2 auth helpers `20260930000002_auth_rls.sql`, room-access RLS `20260930000003_room_access_rls.sql`, safe read DTOs `20260930000004_safe_read_dtos.sql`; B3 `20260930000005_command_boundary.sql`; C `20260930000006_rooms.sql`; D `20260930000007_meetings.sql`; E `20260930000008_funds.sql`; F `20260930000009_peer_debts.sql`; G `20260930000010_realtime_admin.sql`. This is planned ownership, not evidence that a migration has been applied or accepted. Before implementation, verify actual migration history; preserve every applied migration and use a new forward migration for corrections. After the planned migrations exist and clear their dependency gates, disposable local integration databases are rebuilt with all migrations and no seeds. Never rewrite applied or released/production migration history.

Every privileged mutator named in C-G has the shared SQL signature `(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid) RETURNS jsonb`, service-role-only execute and fixed `search_path`. The Route Handler embeds the validated path entity ID into `payload`, overwriting any conflicting body ID. The server derives actor/global role; the transaction rechecks active lifecycle and authorization before writes. System deadline/cron and read RPCs have their separate signatures stated in the owning task. This contract is a convention, not a generic dispatcher or framework.

Transaction lock order is involved `users` rows sorted by UUID, then involved `rooms` sorted by UUID, then feature rows. Creation locks its proposed owner; user archive locks target/recipient, preventing a concurrent new owned room from escaping transfer. Room ownership and all permission predicates are rechecked after locks, never inferred from an earlier unlocked lookup. Commands use the same order across packages.

Existing-file shorthand in package tasks resolves as follows: Home=`src/app/page.tsx`; My Rooms=`src/app/my-rooms/page.tsx`; Funds=`src/app/funds/page.tsx`; Meeting=`src/app/meeting/[roomId]/page.tsx`; Settings=`src/app/settings/page.tsx`; Login=`src/app/login/page.tsx`. Shared control filenames live in `src/components/ui/`, layout controls in `src/components/layout/`, feature controls in the matching `src/modules/{rooms,meetings,funds,admin}/presentation/`. Repository/domain/generated type paths were inspected before planning; new paths are listed explicitly in the owning task.

## Shared execution and verification contract

- [ ] Record the current commit/worktree ownership before starting each package.
- [ ] Write a failing test against the actual helper, HTTP contract, or database function named by the task; do not create a second fake implementation of the rule.
- [ ] Implement the smallest change; verify the task-owned cases; commit each deliverable.
- [ ] Update `enhancement/2026-09-30-mvp-production-hardening.md` with changed paths, actual commands/results, remaining failures, and runtime limits.
- [ ] Run `pnpm test`, `pnpm exec tsc --noEmit --incremental false`, scoped ESLint, and `git diff --check` at package handoff. Tests involving infrastructure must fail visibly when required infrastructure is unavailable; a skipped test is not acceptance evidence.
- [ ] A3 introduces `test:db`, `test:integration`, and `test:contracts`. Use `supabase test db tests/database` for real SQL/RLS/transaction tests, `node --test tests/integration/*.test.mjs` for live Supabase tests, and `node --test tests/contracts/*.test.mjs` for HTTP contracts.
- [ ] Before a production-mode build, report implementation results per repository workflow; build only under the already approved test scope or subsequent explicit authorization.
- [ ] Record E2E results in `docs/qa/2026-09-30-mvp-hardening.md` using authenticated native browser sessions. Infrastructure test identities/fixtures are confined to disposable test databases; real product E2E uses real Auth0 users.

## Audit coverage map

| Audit requirement | Owning tasks |
| --- | --- |
| Task 1 contrast/control boundary | H1 |
| Task 2 selects/tabs/dialog focus | H2 |
| Task 3 auth/mock shell/notification/Presence | B1-B2, G1-G2, H2 |
| Task 4 guest skeleton/pagination/join errors | C1-C2, H3 |
| Task 5 My Rooms pagination/Personal Funds N+1/QR | C1, E2, H3 |
| Task 6 invite/schedule/history/deadline/member matrix | C3, D1-D2, H3 |
| Task 7 mock debt/revert trigger/storage/archive | E1-E2, F1-F2, H3 |
| All production mocks/seed/no-op actions | A2, B1, C3, F2, H3 |
| Realtime isolation/reconnect/dialog dirty state | B2, C1, E2, F1, G1-G3, H3 |
| Notifications for all approved events | B3 notification contract; C-D-E-F producers; G1 matrix |
| Admin lifecycle, role authority, audit, cron | B1-B3, D1, G3 |
| Development deletion instead of migration | A1-A2 |

## Progress rules

### Controller checkpoint — 2026-10-01

| Task/package | Implementation/review | Verified now | Open gate |
| --- | --- | --- | --- |
| A1/A2 | Guard, seed-free baseline, Storage executor independently approved | Real isolated-local reset, all15tables0/privatebucket0; pgTAP276PASS | Remote reset/live old owners require authorized remote link/credentials; not performed |
| A3 | Scanner/harness and missing-table follow-up reviewed/approved; checkpoint `cc282f2` | Regression6/6, fullunit136PASS; inventory12 remaining; dedicated serviceGET0/anon-denied | Final zero-mock belongs F/H |
| B1 | Source approved; checkpoint `44a2a4f` | Anonymous401/no-store, native Home->login, genuine Auth0 callback/hardreload/logout on3000 and one active profile/no duplicate | Archived/failure journeys and multi-role HTTP sessions |
| B2 | M1 checkpoints retained; M2 endpoint and browser lifecycle/logout/own-user wiring reviewed | Browser16/16,fullunit exit0,tsc/scopedlint/diff0; local rollback roomhelpers106/106,requestpredicate19/19 | Full permission matrix, safeDTOs and real issued-token DataAPI/Realtime/Storage remain pending; no fullB2 claim |
| B3/C-H | Not implemented | None claimed | Foundation dependency gates |

H1 native finding: login Google primary button uses dark normal text on cobalt, approximately3.03:1 at14px; fix common-button foreground and validate normal/hover/focus/disabled/loading in the owning task. See QA evidence; no opportunistic second redesign.

### Parallel execution contract (approved by BOSS)

#### Small milestone batches — BOSS request, 2026-10-01

Operational change only: preserve the approved feature scope and package dependencies. Do not dispatch an entire package as one long worker assignment. Current capacity is three workers plus the controller, not six concurrent workers.

| Batch | Bounded outputs | Exit gate |
| --- | --- | --- |
| B2-M1 | Profile provisioning without redundant writes; memory-only token cache; active-subject/global-role SQL helpers and focused tests | Each output has saved RED/GREEN evidence, independent spec/quality review, and combined regression checks |
| B2-M2 | Session token endpoint/client/realtime integration; complete restrictive RLS and safe read DTOs | HTTP contracts and real local SQL authorization matrix pass; no overlapping file writers |
| B2-M3 | Real issued-token Data API/Realtime/private Storage verification | Real-token evidence or explicit external configuration blocker; never substitute synthetic claims for this gate |
| Later packages | Split each approved task into test/helper, integration, and runtime acceptance batches where needed | Previous load-bearing output reviewed before dependent authoring; package completion still requires its original acceptance |

- A dispatch names one bounded deliverable, exclusive files, tests, a report path and a stop point. At most three independent implementers run; the controller handles infrastructure, aggregation and progress.
- Save the failing test first. Report the first concrete result or blocker promptly; send a progress message at least every three minutes while running. A long pending tool call must be identified, not presented as active implementation.
- After five minutes without an artifact or progress, the controller requests a checkpoint. After ten minutes without evidence, inspect status/files, interrupt if needed, preserve saved work, and reduce the assignment before resuming. These are escalation thresholds, not a promise that every task finishes within ten minutes.
- Stop after the assigned output and hand off for review. No automatic expansion into the next milestone, no worker infrastructure/reset/Git operations, and no extra agents.
- Review workers do not review their own code. Only the controller advances batch state after review and covering checks. Record partial completion separately from runtime acceptance.
- Current role routing follows `docs/operations/agent-team.md`: BOSS approved ordinary writers and independent read-only review on gpt-6.1-sol/medium; auth, RLS, financial and race-sensitive slices require explicit Sol High writing and Astra Medium independent review when available. If Astra usage is unavailable, controller explicitly dispatches an independent Sol High reviewer and logs task ID, availability reason and actual model/effort. Controller validates task proposals, dispatches exact ownership and retains Git/infrastructure/shared files. Actual capacity remains three active children: two or three independent writers during authoring, review in a freed slot, or two writers plus reviewer. Scout/Architect are conditional; no mandatory re-planning. Save checkpoint/artifact at least every three minutes when tools permit, reuse suitable bounded workers for related slices, and avoid repeating full suites on unchanged code. Setting changes require fresh supported dispatch. The former Astra endpoint-writer exception remains revoked. Full integration waits for accepted prerequisites; MVP/UI/dependency/security gates and runtime limits remain unchanged.

Recovery snapshot: foundation commits `cc282f2` (A) and `44a2a4f` (B1) are retained. Three workers were observed `interrupted` after turn interruption; no B2 implementation files were saved at recovery. This observation does not establish a root cause for the reported apparent hang. B1 native logout is verified; real archived/failure/multi-role acceptance remains open. H1 authoring is held until the first bounded B2 batch is reviewed.

M1 operational fallback: subsequent diagnostics confirmed child patch calls were pending for over five minutes without a write result; one child additionally waited on an escalation request. Checkpoint messages could not be answered inside those pending calls. The underlying tool/permission cause is not yet established. Stop child write calls; serialize the first profile slice with controller-applied worker-authored patches and two read-only reviewers. Ordinary tools must respect permissions; no bypass of a denied approval. Token and SQL implementation wait until this smaller slice clears review. Saved artifacts, not `running` status, determine progress.

- Split only independent deliverables. A1 guard, A2 schema, and A3 scanner/harness authoring may run concurrently; A2 destructive execution waits for A1 review, and database acceptance waits for the baseline.
- One writer per file. Controller owns `package.json`, `.env.example`, `.gitignore`, enhancement/progress docs and shared interfaces. Workers report shared-file changes instead of editing them.
- Controller alone stages/commits and manages Docker, test targets, reset, Storage deletion and external configuration. No worker resets data, changes infrastructure, touches another worker's files or spawns further agents.
- A completed worker hands off a file list, RED/GREEN evidence and explicit pending infrastructure gates. A fresh task reviewer checks spec compliance and code quality before dependent work starts.
- After review, controller runs combined regression/type/lint checks and commits explicit paths only. Auth/RLS/command foundation must be accepted before feature packages use it; authoring in parallel never bypasses dependency gates.
- Keep approval separate from verification: disposable development reset is already approved, but exact target must still be proven. Missing remote production exclusion/configuration blocks remote reset only; isolated local implementation/testing can proceed.

All task checkboxes begin incomplete. Do not mark a package complete from source inspection or historical 69/69 unit results. Separate implementation, automated verification, and authenticated runtime evidence. The original UI Tasks 8-9 remain pending; H incorporates their functional/contrast verification but does not silently mark their full visual scope complete.

## Self-review completed

- All redesign Task 1-7 findings and hardening spec sections map to owning tasks above.
- Cross-package interfaces use the common command/result/read-page contracts; migrations and routes have exact destinations.
- The scanner's unit tests can pass before feature replacement; its actual runtime release scan remains visibly failing until F removes the final consumer, without intentionally breaking `pnpm test` throughout A-E.
- Real Auth0/Supabase configuration, CLI installation and test session availability are explicit execution prerequisites; they are not assumed available or marked passed.
- UI Tasks 8-9, scope clarifications and external configuration work remain explicit; no additional round of layout redesign is bundled into hardening.

## Handoff

The plans are ready for a single BOSS review. Preserve the selected Native execution method. This handoff is an implementation-plan approval gate required by repository `AGENTS.md`, step 6, and `superpowers:writing-plans`; it is distinct from the architectural spec approval already granted.
