# A — Baseline and Development Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Reproduce an empty development schema and remove dead fixture/seed paths with guarded destructive operations.

**Architecture:** Retain Supabase/PostgreSQL and current domain tables. A read-only reset manifest identifies the exact target before a separate execution step; later packages replace active mock consumers when their real flow is available.

**Tech Stack:** Supabase CLI (verify/install approved tooling at execution), PostgreSQL, supabase-js 2.116.0, Node 24.3.0.

**Spec:** `docs/superpowers/specs/2026-09-30-mvp-production-hardening-design.md`, sections 3, 7, 14-16. Shared constraints: `2026-09-30-mvp-hardening.md`.

## Global Constraints

- Existing local and linked development data may be deleted; production data must never be targeted.
- Keep schema reproducible; no seed/business records after reset.
- No new application dependency; test doubles remain isolated under test-only boundaries.
- Do not start another visual redesign; Auth0 remains global role authority.

## Review Focus

- Project URL differs from linked ref: abort before deletion (A1).
- Missing/ambiguous environment or production target: abort (A1).
- DB reset does not prove Storage blobs are gone: verify both separately (A2).
- Empty DB invalidates fixed system UUID: remove fixture-dependent assumptions (A2/D1).
- Test fixture cleanup accidentally reaches product dev: integration harness requires dedicated disposable test target (A3).

### Task A1: Add an explicit development-reset guard and manifest

**Files:** Create `scripts/devResetGuard.mjs`, `scripts/devReset.mjs`, `tests/unit/dev-reset-guard.test.mjs`, `docs/operations/development-reset.md`; modify `.env.example` and `package.json`.

**Interfaces:** `assertDisposableTarget({ mode: 'local' | 'linked', environment: string, linkedRef: string | null, expectedRef: string | null, productionRef: string | null, supabaseUrl: string, acknowledgement: string }): { mode: 'local' | 'linked'; projectRef: string | null }` throws before side effects. `devReset.mjs --plan` emits a sanitized manifest; `--execute` consumes the same freshly verified inputs, never stale cached approval. A linked execution requires environment `development`, exact matching refs, explicit `DELETE DEV DATA`, and an explicit production reference exclusion; local mode requires the loopback CLI endpoint.

- [ ] Write failing tests: production ref equals target -> throws; expected/linked/URL mismatch -> throws; missing required value -> throws; `staging` without explicit disposable target contract -> throws; remote URL in local mode -> throws; matching development target -> returns verified ref. Assert zero calls to a fake command executor on every rejection.
- [ ] Run `node --test tests/unit/dev-reset-guard.test.mjs`; expected FAIL until the actual guard exists.
- [ ] Implement guard and read-only manifest using native URL parsing and `spawnSync`/`spawn` argument arrays. Define `APP_ENVIRONMENT`, `DEV_RESET_PROJECT_REF`, `PRODUCTION_PROJECT_REF` and process-only acknowledgement. Never print keys, cookies, tokens or database password. Do not set a default ref from an example URL.
- [ ] Run the guard tests and `node scripts/devReset.mjs --plan`; expected PASS and no destructive command. If CLI is missing (currently `pnpm exec supabase --version` fails), resolve installation/approved executable before dependent steps; record actual CLI version and `db reset --help` flags.
- [ ] Commit: `feat: guard development data reset`.

**Acceptance:** Reject unsafe targets deterministically; a manifest names exact affected business tables/buckets and command, without secrets.

Approved clarification (2026-10-01): BOSS confirmed no production project exists. An explicit literal `PRODUCTION_PROJECT_REF=none` records that declaration; empty/null remains rejected. All linked/development/URL equality and acknowledgement checks remain required. Remote CLI credentials/linking are independent prerequisites.

### Task A2: Establish a seed-free baseline and execute the guarded reset

**Files:** Replace the seven current `supabase/migrations/*.sql` with `supabase/migrations/20260930000001_baseline.sql`; create `supabase/config.toml` and `tests/database/baseline.test.sql`; delete `src/mocks/fixtures.ts`, `src/mocks/repository.ts`, `src/mocks/index.ts`, `public/design-system.html`; modify `scripts/devReset.mjs`, `src/types/database.ts`, `docs/operations/development-reset.md`.

**Interfaces:** Baseline reproduces users, rooms/type, memberships, requests, sessions, attendance, candidates, contributions, append-only payments/audit, room/user QR metadata, notifications, peer debts/payments, constraints/indexes, private `payment-images` bucket and publication. Until B lands, deny browser business access by default; service role is server-only. No seed file or insert of fixed identities. `resetVerifiedTarget(manifest): Promise<ResetEvidence>` performs Storage API removal on explicit listed object paths and the CLI reset only after A1 verification; evidence includes before/after counts and target ref.

- [ ] Write database checks for all required tables, unique active membership/pending request, positive integer amounts, append-only triggers, private bucket, zero records, and publication coverage. Assert no baseline INSERT creates users/rooms/debts. Run against an intentionally incomplete disposable schema; expected FAIL.
- [ ] Build the clean baseline from existing schema definitions, preserving documented states and constraints. Add timestamps/checks without inventing new workflow. Keep later subsystem additions in separate migrations. Preserve old schema in Git history; never apply this squash to production.
- [ ] Inspect old live function owners/grants without changing them; never copy `is_service_role()`'s `SECURITY DEFINER`/`current_user='postgres'` authorization shortcut into baseline policies. Use explicit role grants and native service-role bypass only. Add actual anon INSERT/UPDATE/DELETE denial assertions even when helper owner is postgres; function names alone are not evidence of security.
- [ ] Implement explicit Storage object enumeration/removal via installed Supabase SDK before DB reset, including nested folders and pagination; no wildcard or bucket-public workaround. Use CLI supported `db reset --local --no-seed` or `db reset --linked --no-seed` only from the verified manifest. A failure in object deletion blocks reset; verify zero objects afterward.
- [ ] Execute the approved dev reset only after exact target verification. Run `supabase test db tests/database/baseline.test.sql`; expected PASS. Record empty counts/schema constraints and Storage verification; report that erased dev data is not recoverable unless an external snapshot exists.
- [ ] Delete dead mocks/public demo after `rg` confirms no runtime imports; preserve `docs/design-system.html` and test doubles. Run `pnpm test`, typecheck and diff check. Active auth/invite/debt mocks are tracked for B/C/F, never claimed removed here.
- [ ] Commit: `chore: establish empty development baseline`.

**Acceptance:** Same schema rebuilds locally and in disposable dev; no seed or business data remains immediately after reset; critical append-only constraints survive.

### Task A3: Add real integration infrastructure and a final zero-mock gate

**Files:** Create `tests/integration/supabaseHarness.mjs`, `tests/contracts/httpHarness.mjs`, `scripts/scanRuntimeData.mjs`, `tests/unit/runtime-data-boundary.test.mjs`, `docs/qa/2026-09-30-mvp-hardening.md`; modify `package.json`, `.env.example`, enhancement log.

**Interfaces:** `requireTestTarget(): { url: string; serviceKey: string; anonymousKey: string }` refuses a non-dedicated or production target. `requireAuthenticatedContractSession(role: 'member' | 'owner' | 'admin'): { baseUrl: string; cookie: string }` reads process-only credentials and throws when unavailable. No role impersonation is shipped to product. `scanRuntimeDataBoundary(root): string[]` scans production source only, excluding test/documentation fixtures.

- [ ] Write failing tests for harness target rejection and scanner detection against test-only temporary fixture files: `AuthMockContext`, `NEXT_PUBLIC_ALLOW_MOCK_AUTH`, `MOCK_DEBTS`, local invitation users, `src/mocks` imports, dummy Supabase/Auth0 credentials and known no-op handlers. Pin the actual scanner, not a copied array implementation.
- [ ] Run `node --test tests/unit/runtime-data-boundary.test.mjs`; expected FAIL until scanner/harness exists, then PASS for safe/unsafe fixture cases. The actual product scan is separate from the unit glob so A-E do not deliberately leave the business suite red.
- [ ] Add scripts `test:db`, `test:integration`, `test:contracts`, `test:runtime-data`; `test:runtime-data` runs `node scripts/scanRuntimeData.mjs` and exits nonzero on actual findings. Use existing Node runner and Supabase CLI/pgTAP. Add test-only controlled data factories in the harness; never add `seed.sql`. Contract credentials come from real Auth0 sessions and are never committed/logged.
- [ ] Run harness/scanner unit tests; expected PASS. Run actual runtime scan; expected explicit remaining B/C/F inventory, tracked as pending release gate. Zero findings become required at F2 and H3. QA document records commands, identity roles, dates, routes, expected/actual outcomes and blockers without credentials.
- [ ] Commit: `test: add real backend verification boundaries`.

**Acceptance:** Integration failures cannot be hidden by a skip/fake; zero-mock inventory is executable and has explicit closure ownership.
