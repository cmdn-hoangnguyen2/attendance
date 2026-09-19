# Phase 2 — Backend and API contracts

## Boundary

Use server-side Route Handlers for explicit external-like contracts and Server Actions for local form mutations only when they do not obscure authorization/error semantics. Both invoke identical application use cases.

## Command groups

| Module | Commands |
| --- | --- |
| Identity | sync authenticated user, restore/soft-delete user |
| Rooms | create, list, request join, approve/reject, leave, remove member with fund obligation confirmation, transfer owner, archive, admin restore |
| Meetings | schedule, finalize deadline/candidates, close, set attendance |
| Funds | create contribution from candidate, confirm full payment, list Funds, archived-room payment-info read model |
| Images | request signed upload, attach/replace/remove the one payment image, issue signed read URL |

## Persistence standards

- PostgreSQL foreign keys, constraints, unique indexes, timestamps, money represented as integer VND rather than floating point.
- Every multi-record business mutation uses a transaction.
- Use append-only `Payment` and `AuditLog`; do not overwrite evidence.
- Soft deletion uses `archivedAt`/`deletedAt` plus actor/reason where relevant, never just a boolean.
- Storage object path is saved; public buckets/public raw URLs are prohibited for bank/QR images.
- Each room has at most one payment image, max 5 MB. Allow only JPEG, PNG and WebP; validate actual MIME and file signature on server. SVG and all other formats are rejected.

## Error contract

Use stable machine codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `ARCHIVED`, `MEETING_CLOSED`. UI maps these to English messages; it must not infer permission from error text.

## Testing

Test use cases (authorization/state transitions), repository integration (constraints/RLS), Route Handler contract, and one end-to-end happy + forbidden path per critical action. Realtime gets integration tests for emitted event after a successful transaction only.
