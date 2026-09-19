# Delivery sequence for implementation agent

No phase starts until the prior phase acceptance criteria pass. Do not commit to `main` without explicit approval.

1. **Discovery lock:** resolve every question in `09-open-questions.md`; add accepted decisions to a spec.
2. **Repo convention intake:** read and follow the supplied FE-convention skill; inspect existing repo instructions before scaffolding.
3. **UI foundation:** scaffold Next.js, Tailwind, `cn`, fonts, palette, layout, icon decision, mock repository/types.
4. **All mock UI:** build routes, cards, modals, data tables/search, state fixtures and responsive QA. No Auth0/API yet.
5. **UI review gate:** BOSS validates flows/labels/states from local preview; amend only UI issues.
6. **Data design:** ERD, migrations, seed data, repository interfaces, RLS/security review.
7. **Auth0:** configure dev tenant/environment secrets, session integration, onboarding sync, global/room authorization.
8. **Core server:** rooms + membership/request + archive + ownership transfer; contract and authorization tests.
9. **Meetings/attendance:** session lifecycle, deadline, scheduled close and history.
10. **Funds/payment/images:** transactions, signed private uploads, confirmation/audit, archive behavior.
11. **Realtime:** private topics, event publishing, reconnection/refetch behavior, authorization tests.
12. **Admin/settings:** user lifecycle, fund obligation warning, archived data, 403 redirect/toast.
13. **Production readiness:** security headers, error monitoring, backups/retention decision, Vercel test deploy, deploy verification.

## Scheduled close design

The app must be correct even when background scheduling is late. Store an explicit `closesAt` at the next local midnight for each meeting. Reads treat a session after `closesAt` as closed. A scheduled worker/cron only performs cleanup/finalization and emits UI events. Choose scheduler after deployment is selected: Vercel Cron, Supabase scheduled job, or Cloudflare Cron Trigger.
