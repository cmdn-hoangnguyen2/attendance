# Domain model and state rules

## Core entities

| Entity | Important fields |
| --- | --- |
| User | `id`, `auth0Subject`, `email`, `displayName`, `role`, `status`, timestamps |
| Room | `id`, `name`, `visibility`, `ownerId`, `status`, timestamps |
| RoomMembership | `roomId`, `userId`, `status`, join/leave timestamps |
| JoinRequest | `roomId`, `requesterId`, `status`, reviewer and decision timestamp |
| MeetingSession | `id`, `roomId`, `startsAt`, `attendanceDeadline`, `closesAt`, `status` |
| AttendanceRecord | `meetingSessionId`, `userId`, `status`, changedBy, timestamp |
| FundContribution | `id`, `roomId`, `contributorId`, `amount`, `reason`, `status`, timestamps |
| Payment | `id`, `contributionId`, `amount`, `paidAt`, `confirmedBy`, `confirmedAt` |
| RoomPaymentImage | `roomId`, `storagePath`, `sortOrder`, timestamps |
| AuditLog | actor, action, target, metadata, occurredAt |

## State transitions

```text
User: active → soft_deleted → restored
Room: active → archived
Join request: pending → approved | rejected | cancelled
Membership: active → left | removed
Meeting: scheduled → active → closed
Attendance: absent | present | leave
FundContribution: outstanding → paid
```

## Attendance behavior

- Owner/admin creates a future meeting `startsAt`. The self-attendance deadline is exactly `startsAt`, exclusive: at `10:00:00`, a 10:00 meeting is already late.
- When the deadline is reached, generate one attendance record per active room member, default `absent` if no earlier self-attendance was submitted.
- Active member may change **their own** record to `present`, `absent`, or `leave` only before `startsAt`.
- Owner/admin may change any active member record.
- At the deadline, every `absent` active member enters the meeting's **fund candidate list** (danh sách ứng viên đóng quỹ). This is not a `FundContribution` record and creates no monetary obligation automatically. Owner/admin manually select candidates and enter a positive amount plus a reason.
- `leave` does not enter the fund candidate list.
- Fund candidates are an audit snapshot: later attendance corrections do **not** remove a candidate. Owner/admin may also add any active member manually, including someone marked `present` or `leave`.
- At local midnight after the meeting date, the UI should no longer expose that meeting as current; history must remain immutable except for audited corrections.

**Important:** do not “reset” or overwrite a single room-level status at 00:00. Persist records per `MeetingSession`; that is how history, fund contribution generation, audit, and realtime remain correct. A scheduled job closes expired sessions; query logic determines the current session even if the job is delayed.

## Archive behavior

- Archive must be a transaction: mark room archived; forbid new join requests/members/meetings/new fund contributions/images; retain all records.
- Existing outstanding fund contributions remain payable and remain visible in **Funds** with `Room archived` badge.
- Archived rooms are inaccessible to normal users, including direct URL navigation. Owner/admin may open an archive-only fund view to confirm old payments; no new members, meetings, fund contributions, or images are allowed.
- A contributor clicking an archived-room item in Funds opens a payment-information modal, not the room. Show the room's QR/bank images if any; otherwise show `Liên hệ chủ room: {ownerName}`. The contributor cannot access archived room details.
- Global admin may restore an archived room. Restore its prior visibility and prior active-member list; it does not revive users that are globally soft-deleted or prior memberships that had already left/been removed.
- Archived room is hidden from Home and active My Rooms; shown in admin archive list and to affected contributors.

## Fund contribution behavior currently inferred

- Owner/admin creates fund contribution manually from the fund candidate list with a positive money amount and a non-empty reason.
- Reason options: `Đi trễ`, `Bận nhưng chưa xin phép`, `Khác`; `Khác` requires free-text reason details.
- Payment is a confirmed all-or-nothing record, not a boolean on `FundContribution`. Partial payment is out of scope; confirmation must retain the actor and confirmation timestamp for auditability.
- Owner/admin may remove a member with outstanding fund obligations only after a typed-confirmation modal. The membership ends, but all fund/payment records and Funds visibility remain.
- The member-removal phrase is exactly `I agree to remove this user`. Normalize surrounding whitespace only; preserve one fixed English phrase in server and UI tests.

## Ownership, user archive, and money

- Transfer recipient must be an active member. After a successful transfer, the former owner remains an active member. No typed phrase is required; the confirmation dialog has a confirm button.
- An admin may soft-delete an active user only after typing `Archive this user`, even when they have unpaid fund contributions; user moves to the archived-user list and is blocked from app access.
- If that user owns active rooms, ownership must transfer first. The archive dialog lists those rooms and selects the replacement admin. When multiple admins exist, the selection is mandatory; with one eligible admin, it is preselected. Archive is rejected if transfer fails.
- Money is VND integer only. APIs send/return `1000`; the UI formats it as `1,000` for English display. Never use decimal/floating arithmetic.
- No due date or supporting evidence is required for a fund contribution in this MVP; reason is sufficient, with text required for `Khác`.
