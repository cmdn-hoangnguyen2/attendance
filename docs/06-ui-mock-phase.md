# Phase 1 — UI with mock data only

## Goal and exit criteria

Deliver every required screen, interaction state, responsive layout, and accessibility state without Auth0/Supabase/Pusher. Mock repository returns deterministic fixtures; no production API contracts are coupled to components.

## UI foundation

- Next.js latest stable at implementation time, TypeScript strict mode.
- Tailwind CSS; create `cn(...inputs)` using `clsx` and `tailwind-merge`.
- Inter via `next/font`.
- 8-point spacing tokens: 4 only for hairline micro-adjustments; normal spacing 8/16/24/32/40/48/64.
- Light palette: primary `#10D9A3`/`#05966B`; neutrals `#FFFFFF`, `#E8FBF4`, `#0B1F1A`, `#4B665D`, `#C9F2E3`; semantic palette exactly as supplied.
- Hugeicons is the only icon source for application UI: render icons with `@hugeicons/react` and import icon data from `@hugeicons/core-free-icons`.
- Do not use Lucide, emoji, hand-authored/inlined SVG icons, or framework-provided/default SVG assets as application icons.
- Every icon-only interactive control must have an accessible name.

## Required mock states

| Feature | States to render |
| --- | --- |
| Header | logged out, logged in, admin nav visibility |
| Home | loading, empty, public/private cards (private shows name/owner/member count), create modal, request pending/success/error/cancel/re-submit |
| Meeting Members | 4-column desktop bento, search, member actions, request queue, empty/error/permission states |
| Attendance | future session, before-start self check-in, deadline passed, present/absent/leave, fund candidate list, owner override |
| Funds | outstanding/paid, manual fund contribution creation from immutable/manual candidates, payment confirmation, QR image gallery `object-contain`, archive owner/admin-only view |
| Funds (My Contributions) | empty, fund contribution cards 4 columns, archived-room badge |
| Settings | active/soft-deleted users, active/archived rooms, delete warning |
| Destructive modals | explicit impact list and typed-English confirmation validation; member-removal-with-fund modal; archive-user room-transfer selector; archived Funds QR/contact-owner modal |

## Responsive baseline

Desktop-first: 4 cards/row at desktop, then standard desktop/tablet/mobile layouts. Never simply squeeze four cards on mobile. Keyboard, focus-visible, escape/overlay modal behavior and color contrast are acceptance criteria. English-only copy for MVP, including money format `1,000 VND`. Support current evergreen Chrome, Edge, Safari and Firefox only.
