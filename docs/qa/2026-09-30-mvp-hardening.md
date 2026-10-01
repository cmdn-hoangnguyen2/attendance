# MVP hardening QA evidence

Evidence date: 2026-10-01 (Asia/Ho_Chi_Minh). Package A and concurrent B1 implementation. Runtime mocks remain an executable pending release gate; unit fixture tests do not claim production behavior. Historical commands below are retained; the latest controller snapshot supersedes their counts.

## Latest controller snapshot

| Check | Actual outcome | Remaining gate |
| --- | --- | --- |
| Full unit suite, `node --test 'tests/unit/**/*.test.mjs'` | Latest 164 passed, 0 failed, 0 skipped after bounded memory-only token cache slice | Authenticated runtime and domain integration are separate; native TS import emits MODULE_TYPELESS_PACKAGE_JSON tooling warning |
| TypeScript, direct installed compiler with `--noEmit --incremental false` | Exit 0 | Re-run after further changes |
| `git diff --check` | Exit 0 | Re-run at commit |
| Verified local reset | Completed 2026-09-30T17:57:17Z; project `diemdanh-mvp-hardening`, API `http://127.0.0.1:54321`, CLI 2.118.0 `db reset --local --no-seed` | Remote development reset has NOT run |
| Database/Storage after reset | All 15 business tables have 0 records; `payment-images` is private with 0 objects | No business schema/bucket existed before this isolated-local reset; this does not prove removal of remote records |
| `supabase test db tests/database/baseline.test.sql` | 276 assertions PASS against actual local PostgreSQL 17 | B-G authorization/transaction matrices remain pending |
| Latest runtime scan | Exit 1; 12 occurrences | B2/C/F/H must close them; zero-mock gate is NOT passed |
| Real local Data API read, process-only dedicated credentials | Service-role zero-row GET count0; anonymous GET denied | Connectivity/default-deny proof only, not B authorization matrix |
| Native browser B1 anonymous journey on actual worktree preview3100 | `/api/me` 401 with `private, no-store`; `/login` 200; hydrated Home redirected to `/login`; login UI contains only real Google action, no role switcher | Real login/reload/logout/archived/provisioning-failure contracts still need real sessions |
| Actual preflight missing-table regression | RED5/6 (old HEAD falsely printed PASS); GREEN6/6 after zero-row GET/exact nonnegative count; independent review approved | Transport substitute is child-test-only; not live domain evidence |
| Native Auth0 on port3000 | Existing Google session completed genuine callback; profile remained after hard reload; actual local DB count1/active1, no duplicate provisioning; real sidebar logout removed profile and subsequent Home settled on login | Archived/failure cases and multi-role HTTP sessions still pending |
| B2-M1 profile slice | Actual imported helper RED0/5 (missing module) -> GREEN5/5; TypeScript/scoped ESLint exit0; two independent read-only reviews approved | No live concurrent-create/archive race or realtime refresh evidence; token-cache/SQL helpers pending |
| B2-M1 token cache | Actual absent-module contract RED1fail/22skip -> GREEN23/23,0skip; fullunit164/164; TypeScript/scoped ESLint exit0; Challenger spec/quality PASS | Module-type tooling warning is LOW; endpoint/logout/client/fullRLS/real-issued-token acceptance remain M2/M3 |

Independent A1/A2/A3 reviews approved the implementation; the executor's missing-table GET regression and explicit no-production declaration received a scoped re-review before reset. Old deployed function owners/grants remain unverified without authorized remote database access. This is an explicit remote gate, not local baseline evidence.

Preview3100 initially hit Auth0 Callback URL mismatch, which is confirmed by native Auth0 error page. BOSS explicitly requested freeing port3000. Controller stopped only Docker container `ols-front-webserver` (`f218e0b009db`), kept its volumes/container and all other OLS/Supabase containers, and restarted the controller-created Next preview on configured origin `http://localhost:3000`. Auth0 callback then succeeded without tenant changes. Restore OLS with `docker start ols-front-webserver` after stopping CMDN preview3000. No `.env.local` or secret values changed. Post-login database now legitimately contains one provisioned real profile; the zero-record reset evidence above is the immediate post-reset snapshot, not a permanent zero-data assertion.

Checkpoint commits: A `cc282f2` (31 files), B1 `44a2a4f` (24 files), neither pushed. B1 scoped ESLint exit0 with four pre-existing warnings in Home/Meeting (unused MeetingTab and hook dependencies); those are tracked for owning feature tasks, not opportunistically changed. Native direct navigation to `/api/me` after logout was blocked by the browser client, so that attempt is NOT cookie-bearing HTTP-status evidence; the verified outcome is SDK logout/profile removal/Home-to-login UI.

## Commands and outcomes

| Command | Actual outcome | Status |
| --- | --- | --- |
| `node --test tests/unit/runtime-data-boundary.test.mjs` | 5 passed, 0 failed, 0 skipped after fixround1 | PASS |
| `node --test 'tests/unit/**/*.test.mjs'` | 99 passed, 0 failed, 0 skipped at A3 verification; concurrent A1/A2 work may add cases | PASS |
| Same full unit command during fixround1 | 100 passed, 1 failed: A1 `dev-reset-execution.test.mjs` imports not-yet-exported `resetVerifiedTarget`; concurrent implementation | BLOCKED A1 re-verification |
| `node scripts/scanRuntimeData.mjs` | Exit 1; 38 known-pattern occurrences in production paths | PENDING B/C/F/H release closure |
| `node tests/integration/supabaseHarness.mjs` | Exit 1, no dedicated process configuration; refused before DB access | BLOCKED real target |
| `node tests/contracts/httpHarness.mjs` | Exit 1, no dedicated origin/real Auth0 sessions | BLOCKED real sessions |
| `pnpm test:db` | Root/A2 own CLI/pgTAP schema verification | PENDING root/A2 evidence |

No integration or contract suite is skipped or replaced with simulated success. The current database executable verifies a real, read-only `users` query; the contract executable verifies real `/auth/profile` sessions. They are infrastructure probes, not proof of transactions, RLS permissions, Storage, realtime, or role authorization. Add domain cases with later packages; retain all relevant failures.

## Dedicated database configuration (process-only)

| Variable | Requirement |
| --- | --- |
| `CMDN_TEST_ENVIRONMENT` | Exact `dedicated-test`; `development` is refused |
| `CMDN_TEST_SUPABASE_URL` | Dedicated HTTPS `<ref>.supabase.co` plain origin, or disposable HTTP `localhost`, `127.0.0.1`, `[::1]` on exact port 54321 |
| `CMDN_TEST_SUPABASE_PROJECT_REF` | Exactly 20 lowercase letters matching remote host; exact `local` for loopback target |
| `CMDN_PRODUCTION_SUPABASE_PROJECT_REF` | Mandatory remote production exclusion, exactly 20 lowercase letters; must differ from test ref; optional on local target |
| `CMDN_TEST_SUPABASE_SERVICE_ROLE_KEY` | Dedicated service credential, never product credential fallback |
| `CMDN_TEST_SUPABASE_ANON_KEY` | Dedicated anonymous credential, required even for service probe |

`requireTestTarget()` returns `{ url, serviceKey, anonymousKey }`. `createTestClients()` disables persisted/refreshing sessions. `createUserFixture()` creates random test-only IDs, subjects and reserved example.invalid emails; it performs no writes. Tests that use it own exactly the rows they insert and remove. No seeds, broad deletion, development cleanup, or live factory runs belong to A3. A dedicated marker is an operator assertion, not independent verification of infrastructure ownership: verify the ref/origin before providing it.

## Real Auth0 contract sessions (process-only)

| Variable | Requirement |
| --- | --- |
| `CMDN_TEST_ENVIRONMENT` | Exact `dedicated-test` |
| `CMDN_CONTRACT_BASE_URL` | Dedicated application plain origin |
| `CMDN_CONTRACT_DEDICATED_ORIGIN` | Exact same origin as base; explicit operator assertion |
| `CMDN_PRODUCTION_APP_ORIGIN` | Mandatory for remote HTTPS tests; must differ from base; optional on dedicated HTTP loopback |
| `CMDN_CONTRACT_MEMBER_COOKIE` | Real Auth0 session of member identity, injected into process |
| `CMDN_CONTRACT_OWNER_COOKIE` | Real Auth0 session of room owner identity, injected into process |
| `CMDN_CONTRACT_ADMIN_COOKIE` | Real Auth0 session of global admin identity, injected into process |

Do not save cookie values in `.env`, `.env.example`, fixtures, commands, reports, screenshots, or logs. `requireAuthenticatedContractSession(role)` returns `{ baseUrl, cookie }`; it neither fabricates nor elevates roles. The operator must supply three authenticated identities; the `/auth/profile` probe proves session acceptance, not that a supplied identity owns a room or has the admin claim. B/C/G domain authorization tests must prove those properties.

| Identity / route | Expected | Actual on 2026-10-01 | Status / owner |
| --- | --- | --- | --- |
| Member, `/auth/profile` | 200 with real authenticated subject | No cookie supplied | BLOCKED B |
| Owner, `/auth/profile` | 200 with real authenticated subject | No cookie supplied | BLOCKED B/C |
| Admin, `/auth/profile` | 200 with real authenticated subject | No cookie supplied | BLOCKED B/G |
| Anonymous/member/owner/admin, protected APIs | Exact permission matrix, no role impersonation | Not exercised by connectivity probe | PENDING B-G |
| Authenticated product routes, money/Storage/realtime | Real critical journeys, authoritative state | Not exercised | PENDING H3 |

## Runtime boundary closure inventory

Scanner output records only relative file, line and rule; it never records matched credentials. It scans `src`, `app`, `pages`, `public`, excludes tests/docs/generated dependencies and ignores symlinks. Missing roots and roots without any recognized production source directory fail with exit 1; a valid root may omit optional source directories. This is a lexical known-pattern gate, not an exhaustive semantic proof: new runtime fake shapes require a scanner rule plus isolated fixture regression.

| Finding group | Occurrences | Current locations | Closure owner |
| --- | ---: | --- | --- |
| `mock-auth-context` | 17 | AuthMockContext, layout, login, home, settings, meeting, funds, My Rooms, shell/header/sidebar/notifications/role switcher | B1 |
| `mock-auth-flag` | 3 | AuthMockContext and proxy, including explanatory comment | B1 |
| `dummy-auth0` | 4 | `src/lib/auth0.ts` | B1 |
| `dummy-supabase` | 4 | `src/lib/supabase/client.ts`, `server.ts` | B1 |
| `local-invitation-users` | 1 | `InviteMemberModal.tsx` | C3 |
| `mock-debts` | 2 | `PeerDebtDashboard.tsx` | F1/F2 |
| `noop-handler` | 5 | Home pagination, My Rooms join/cancel/pagination, AccessRevokedModal close | C1/C2/H1 review |
| `noop-handler` | 2 | PeerDebtDashboard payment/QR actions | F2 |

The inventory above is the initial 38-occurrence snapshot. The latest scan has no mock-auth context/flag or dummy Auth0/server-client finding. Its 12 remaining occurrences are: browser Supabase dummy config (2, B2), local invitation users (1, C3), peer mock debts (2, F1/F2), Home/My Rooms/AccessRevokedModal no-op handlers (5, C/H), and peer payment/QR no-op handlers (2, F2).

Counts are pattern occurrences, not unique defects: repeated imports/providers and comments can report the same behavior. AccessRevokedModal's close callback may intentionally prevent dismissal; H1 must review it and remove/replace the no-op with an explicit supported modal contract rather than blindly enabling close.

F2 and H3 acceptance requires `pnpm test:runtime-data` exit 0 plus real authenticated E2E evidence. Keep the runtime scan separate from the normal unit glob while B-F replacements are in progress; do not suppress findings to make an unfinished package pass.

## Native UI finding retained for H1

Login Google button normal state has background `rgb(47,91,211)` and text `lab(7.78201,-0.0000149012,0)`, 14px/700. Neutral text/background contrast is approximately 3.03:1: below the 4.5:1 normal-text threshold in [WCAG 2.2 SC1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Source `src/app/login/page.tsx` explicitly uses `text-neutral-900` on `bg-primary`, changing to white only on hover. H1 must use the common primary-button text token/primitive for default, hover, focus, disabled and loading states, with real computed-color validation. This finding is not fixed or claimed accepted by B1 source review.
