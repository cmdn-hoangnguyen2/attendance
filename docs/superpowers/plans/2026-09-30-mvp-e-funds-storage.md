# E — Funds and Private Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Make financial state atomic/append-only and prove private QR upload, read, replacement, deletion and reload behavior.

**Architecture:** Existing positive payment rows stay immutable; a separate immutable correction record cancels a specific confirmation. Use authoritative aggregate reads and session-authorized Storage endpoints with compensating cleanup across DB/object boundaries.

**Tech Stack:** Existing PostgreSQL/Supabase Storage/Next Route Handlers, integer VND.

**Spec:** Hardening sections 8.6-8.7, 9-14; `docs/03-domain-and-states.md`, `docs/07-api-backend-phase.md`. Depends on D.

## Global Constraints

- Financial history is append-only with compensating corrections; never delete/update payment evidence.
- Positive integer VND only; full payment, no due date or partial-payment workflow.
- Private bucket, one QR per room, JPEG/PNG/WebP only, max 5,242,880 bytes; no public raw URLs.
- Auth0 session determines actor/admin; client `actorId` is never authority.
- Keep current redesigned Funds layout; only add real states/actions needed by behavior.

## Review Focus

- Double confirmation with different keys still makes one active payment (E1).
- Correction retry and reconfirm must retain all earlier evidence (E1).
- Archived/removed contributor can read payment info but not room details (E2).
- Valid server signed URL must survive realtime refresh and hard reload (E2).
- Storage succeeds but metadata fails: old QR remains usable and new object is cleaned (E2).

### Task E1: Atomic contributions, confirmations and compensating corrections

**Files:** Create `supabase/migrations/20260930000008_funds.sql`, `src/app/api/rooms/[roomId]/contributions/route.ts`, `src/app/api/contributions/[contributionId]/payment/route.ts`, `tests/database/funds-ledger.test.sql`, `tests/contracts/funds-ledger.test.mjs`; modify fund repository/interfaces, domain/generated types, `RoomFundsTab.tsx`, `CreateFundContributionModal.tsx`, Meeting handlers, `tests/unit/fund-actions.test.mjs`, product/API docs.

**Interfaces:** `PaymentCorrection {id:string;paymentId:string;correctedBy:string;correctedAt:string;reason:string}` with unique `payment_id`, append-only trigger. SQL `create_contributions`, `confirm_payment`, `correct_payment` use the exact common mutator signature. Confirm locks room/contribution after actor locks, inserts one positive full payment, sets status and enqueues audit/notification/receipt. Correct appends correction only for active payment, returns contribution outstanding, retains original payment. POST contributions `{contributorIds:string[],amount:number,reason:FundContributionReason,reasonDetails?:string,meetingSessionId?:string}` creates selected batch atomically. POST payment `{action:'confirm'|'correct',paymentId?:string,reason?:string}`. Actor/amount/status recomputed on server; correction reason required for audit, shown in existing confirmation UI.

- [ ] Write tests: amount zero/negative/fraction/NaN/>Postgres integer limit rejected; `Khác` requires trimmed text; target must be valid active member or eligible candidate with retained obligation rules; invalid one participant rolls back batch; archived room rejects new contribution; duplicate confirm/retry produces one financial effect; correction of unpaid/already-corrected/stale payment -> conflict; reconfirm after correction creates new payment; original+correction rows remain; transaction failure leaves no status/audit/notification mismatch.
- [ ] Run database/contracts; expected FAIL. Preserve user-visible revert-to-outstanding assertion in old test but replace the obsolete assertion that a payment must be deleted: import actual ledger contract or use new real SQL evidence. Document that this is approved behavior correction, not weakening a failing test.
- [ ] Implement room->contribution->payment locking order, full-amount server determination, active confirmation uniqueness within lock, append-only corrections and receipt handling. Keep `revertPayment` as a temporary compatibility adapter calling correction only while consumers migrate; no `.delete()` on payments. All authoritative totals exclude corrected events, and money history lists both original and correction.
- [ ] Wire dialogs/rows to actual async command states; disable repeat submit, preserve input/error, show current confirmation/correction actor/time. Send notifications to contributors and financial parties only. Archived owner/admin can confirm/correct existing obligations per narrowly scoped rule; new monetary obligations denied.
- [ ] Run financial tests and native real-owner/member flows including concurrent confirmation and archive race. Commit: `feat: record atomic fund payments and corrections`.

### Task E2: Aggregate funds reads and reliable private QR lifecycle

**Files:** Create `src/app/api/rooms/[roomId]/payment-info/route.ts`, `src/lib/server/paymentImageValidation.mjs`, `tests/unit/payment-image-validation.test.mjs`, `tests/integration/private-storage.test.mjs`, `tests/database/funds-read-model.test.sql`, `tests/contracts/payment-qr.test.mjs`; modify existing payment-qr route, E migration, fund repository, Funds/Meeting pages, `PaymentInfoModal.tsx`, `UploadPaymentQrModal.tsx`, `useRoomRealtime.ts`, `useUserRealtime.ts`, existing QR tests.

**Interfaces:** `findPersonalFundsPage({status?,page,pageSize}): Promise<PageResult<PersonalFundItem>>`, includes allowed room summary/ownerName, current payment/correction and authoritative totals in one read RPC, not N+1. `GET /api/rooms/:id/payment-info` returns `{roomName,ownerName,archived,qr:{signedUrl,expiresAt,version}|null}` after owner/admin/member or retained-contributor checks; never accepts arbitrary object path. QR POST file-only body; DELETE no actor query. `validatePaymentImage(bytes:Uint8Array,declaredType:string): {mimeType:'image/jpeg'|'image/png'|'image/webp';extension:string}` rejects zero length, MIME/signature mismatch, unsupported/corrupt minimum header, and size >5MB.

Define `PersonalFundItem` in fund domain repository as `{contribution:FundContribution;roomSummary:{id:string;name:string;archived:boolean;ownerName:string};payment:Payment|null;correction:PaymentCorrection|null}`; result also includes `totals:{outstandingAmount:number;paidAmount:number;outstandingCount:number;paidCount:number}`. Read SQL `get_personal_funds(status text,page integer,page_size integer) RETURNS jsonb` binds JWT identity; Room Funds `get_room_funds(room_id uuid,page integer,page_size integer) RETURNS jsonb` enforces owner/member/archive scope. QR metadata functions `attach_room_qr` and `unlink_room_qr` use common privileged signature and return authoritative metadata/version. Use `Idempotency-Key` on QR mutations too.

- [ ] Write actual helper and HTTP/Storage tests: forged actor denied; anonymous/nonmember/archived uploader denied; invalid MIME and spoofed file headers rejected; exact size boundary accepted; upload metadata/object/signed fetch verified; failed upload preserves old metadata; failed metadata cleans new object; replace removes old object only after new metadata commit; delete failure remains retryable; expired URL refetch; hard reload uses authorized endpoint; access-revoked contributor sees only payment-info DTO; no signed URL logs.
- [ ] Run tests; expected FAIL for actor-spoofable current route and anon signing fallback. Convert duplicated QR helper tests to import actual validation logic or contract route; keep protected file-type/size behavior.
- [ ] Implement auth checks before privileged Storage work. Allocate UUID object path; upload object, commit metadata/audit through SQL, clean new object on failed DB commit; remove replaced object afterward and record cleanup failure for retry. Deletion unlinks metadata transactionally and cleans explicit object with retry evidence. A PostgreSQL transaction cannot include Storage blob mutation; test compensating behavior rather than claiming cross-service atomicity.
- [ ] Implement server-authorized payment-info signed read and aggregate RPC. Store object path/version in DB, never signed URL; client preserves current valid QR while refetching and uses latest request guard; failure becomes visible retry state rather than empty-string overwrite. Generate one-hour URL and explicit expiration metadata; no public bucket fallback.
- [ ] Remove unfiltered `payments` listener; contribution update is the scoped room/contributor invalidation signal for confirmation/correction, plus room QR metadata filtered by room. Retained contributor payment-info refresh happens on selected modal reopening/reconnect and explicit relevant signal, not global metadata exposure.
- [ ] Run SQL read tests and real Storage HTTP fetch plus browser upload->refresh->hard reload->replace->delete. Verify long Funds lists on desktop/tablet/mobile and no N+1 payment requests. Commit: `feat: secure funds read models and private QR readback`.

**Package acceptance:** Monetary outcomes survive retries/concurrency; history stays append-only; private QR lifecycle is proven beyond upload HTTP 200.
