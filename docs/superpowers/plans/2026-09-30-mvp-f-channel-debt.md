# F — Channel Peer Debt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution: Native.

**Goal:** Replace local fake channel balances and no-op actions with real participant-scoped debt, settlement, correction and personal QR.

**Architecture:** Reuse room membership and B command contract. Existing peer debt/payment tables gain audited corrections and restrictive participant policies; personal QR reuses E validation and compensation behavior.

**Tech Stack:** Existing Next/React/Supabase/PostgreSQL, integer VND, native forms.

**Spec:** Hardening sections 7, 8.5, 10-14; Channel behavior in `enhancement/2026-09-29-realtime-and-channel-room.md` as clarified by approved spec. Depends on E.

## Global Constraints

- Channel is invite-only, hidden from outsiders; Meeting attendance/fund flows remain separate.
- Positive integer VND, full settlement only; no payment gateway or partial split-bill engine.
- Debts are visible to their creditor/debtor; unrelated members/room owner do not gain financial access merely by owning a channel.
- Global admin has explicitly audited maintenance access; creditor confirms receipt, debtor never marks creditor paid on their behalf.
- No local debt data, fake success or no-op Add/QR buttons; no new dependency or visual redesign.

## Review Focus

- Active room membership does not authorize reading other pairs' private debts (F1).
- Removal/leave retains own financial history and settlement rights through narrow DTO, not channel detail access (F1).
- Creditor=debtor, nonmember target or fractional/overlarge amount rejected (F1).
- Two confirm/correct attempts preserve one active financial effect (F1).
- Personal QR access requires a debt-party relationship, not a guessed user/object ID (F2).

### Task F1: Participant debt ledger and real dashboard

**Files:** Create `supabase/migrations/20260930000006_peer_debts.sql`, `src/modules/rooms/infrastructure/supabase-peer-debt-repository.ts`, `src/app/api/rooms/[roomId]/peer-debts/route.ts`, `src/app/api/peer-debts/[debtId]/payment/route.ts`, `src/modules/rooms/presentation/CreatePeerDebtModal.tsx`, `tests/database/peer-debt.test.sql`, `tests/contracts/peer-debt.test.mjs`; modify `PeerDebtDashboard.tsx`, Meeting page Channel branch, `src/modules/rooms/domain/repository.ts`, domain/generated types, repository wiring, room/user realtime hooks.

**Interfaces:** Add domain types `PeerPayment {id:string;peerDebtId:string;amount:number;paidAt:string;confirmedBy:string;confirmedAt:string}` and `PeerPaymentCorrection {id:string;paymentId:string;correctedBy:string;correctedAt:string;reason:string}`. `PeerDebtItem { debt:PeerDebt; creditorName:string; debtorName:string; activePayment:PeerPayment|null; corrections:PeerPaymentCorrection[] }`. `findMyPeerDebts({roomId?:string,section:'owe_me'|'i_owe'|'history',page:number,pageSize:number}): Promise<PageResult<PeerDebtItem>>`. POST peer debts `{debtorId:string,amount:number,reason:string}` sets creditor to actor; active Channel members only. POST settlement `{action:'confirm'|'correct',paymentId?:string,reason?:string}` is creditor or trusted admin; full amount derived server-side. SQL `create_peer_debt`, `settle_peer_debt` use exact common signature; `get_my_peer_debts(room_id uuid,section text,page integer,page_size integer) RETURNS jsonb` binds JWT identity; append-only `peer_payment_corrections` unique by original payment.

- [ ] Write real SQL/HTTP tests: outsider/member-not-party denied; creditor cannot create debt for unrelated nonmember/self; invalid amount/reason rejected; debtor cannot confirm; creditor retry idempotent; correction and reconfirm retain all history; archived channel forbids new debt but allows narrow old settlement; removed party retains own record only; injected audit/notification failure rolls back ledger; simultaneous settle double-key yields one active payment.
- [ ] Run tests; expected FAIL before actual repo/functions.
- [ ] Implement row locks and receipt/audit/notification transactions using E ledger semantics; no generic ledger abstraction needed. Add explicit RLS for debt parties/current active user and audited admin. Same-room active membership required at creation; lifecycle guards forbid new debt after archive. Personal Funds adds own Channel obligations/history through authorized read model so leaving a Channel cannot hide debt.
- [ ] Replace `MOCK_DEBTS` with repository reads and pass `roomId` from actual route. Add real Create action and creditor-only confirmation/correction; history renders immutable events. Prepare data outside JSX, use shared list/modal primitives; loading/empty/error/retry/stale/conflict states preserve meaningful form input.
- [ ] Subscribe to room-filtered peer debt updates and own creditor/debtor updates (RLS still authority); settlement updates parent debt as invalidation signal, no global payment listener. Two sessions prove create/settle/realtime, unrelated third session sees neither rows nor payload. Commit: `feat: implement authorized channel peer ledger`.

### Task F2: Personal private QR and close zero-runtime-mock gate

**Files:** Create `src/app/api/me/payment-qr/route.ts`, `src/app/api/peer-debts/[debtId]/payment-info/route.ts`, `src/modules/rooms/presentation/PersonalPaymentQr.tsx`, `tests/contracts/personal-payment-qr.test.mjs`; modify F migration, `PeerDebtDashboard.tsx`, `src/app/funds/page.tsx`, repository/types, E Storage integration tests, runtime-data scanner, enhancement log.

**Interfaces:** POST/DELETE `/api/me/payment-qr` derives owner from session; GET own endpoint returns current personal QR state for `PersonalPaymentQr` composed on the existing Funds page. GET `/api/peer-debts/:id/payment-info` returns permitted creditor name and `{signedUrl,expiresAt,version}|null`. Reuse `validatePaymentImage` from E, same 5MB JPEG/PNG/WebP and compensating lifecycle; `attach_user_qr`, `unlink_user_qr` use common privileged signature. Metadata one per user. No object path or alternate actor supplied by client.

- [ ] Write contracts: anonymous and actor spoof denied; unrelated user cannot read; debtor/creditor receives creditor QR; missing QR shows contact creditor; file signature/size/private read/replace/delete/hard reload covered; archived/left participant still has narrow payment-info access for own obligation; upload failure preserves old image.
- [ ] Run contracts/live Storage suite; expected FAIL before endpoint/consumer.
- [ ] Implement personal upload/read/delete using E helpers and authorized metadata transaction; compose existing account UI with native/shared modal. Wire every QR button to debt payment info, with loading/error/retry and expiration refresh.
- [ ] Complete `test:runtime-data` enforcement: no `src/mocks`, auth toggle/provider/role-switcher, mock users/debts, dummy URLs/credentials, public demo, known no-op actions or fixture identity fallback in shipped source. Scan dynamic imports and environment branches, then inspect matches manually for unrecognized arrays; a word search alone is insufficient proof.
- [ ] Run `pnpm run test:runtime-data`, full unit/typecheck/scoped lint, actual Channel/personal QR E2E. Expected zero runtime findings and real empty state on a newly created channel. Commit: `feat: add private personal QR and remove runtime mocks`.

**Package acceptance:** Channel works from empty real data; all debt/QR actions have Backend effects; every earlier mock-inventory entry has closure evidence.
