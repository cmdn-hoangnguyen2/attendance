# Architecture proposal

## Recommended MVP

```text
Browser
  └─ Next.js UI (Server Components + Client Components)
       └─ Next.js Route Handlers / Server Actions
            ├─ Auth0 Next.js SDK (server session)
            └─ Application layer → Repository interfaces → Supabase Postgres/Storage
                                                   └─ Realtime Broadcast → subscribed clients
```

## Platform choice

| Concern | Recommended | Why |
| --- | --- | --- |
| Deploy | Vercel | Lowest compatibility risk for Next.js full-stack MVP |
| Database | Supabase Postgres | Relational data fits room/member/fund/history; free tier sufficient for test scale |
| File storage | Supabase Storage private bucket | QR/bank images stay private; signed URLs can control read access |
| Realtime | Supabase Realtime Broadcast, private channels | Avoid a second realtime vendor; official recommendation over Postgres Changes for security/scale |
| Auth | Auth0 Next.js SDK v4 | Server-side session and protected App Router routes |

## Cloudflare position

Cloudflare is a valid later option, but should be a time-boxed proof of compatibility, not the default MVP target. Its current Next.js Workers path uses `vinext`; docs label it beta. Workers Free also does not include the paid Durable Objects capability, so it does not simplify this MVP’s realtime requirement.

## Clean architecture boundary

```text
src/
  app/                         # routes, UI composition, Route Handlers
  modules/
    rooms/
      domain/                  # entities, policies, repository ports
      application/             # commands/use cases
      infrastructure/          # Supabase repositories, realtime publisher
      presentation/            # feature UI, view models
```

Rule: UI and route handlers call use cases. Only infrastructure knows Supabase. Authorization runs in the application use case, not merely by hiding buttons.
