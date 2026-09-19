# Research references

1. Auth0, [Token Storage](https://auth0.com/docs/secure/security-guidance/data-security/token-storage). Token storage trade-offs; ID token is unnecessary when no API token call is required; localStorage is exposed to XSS.
2. Auth0, [Add Login to Your Next.js Application](https://auth0.com/docs/quickstart/webapp/nextjs). Current Next.js 16 / Auth0 Next.js SDK v4 guidance and server `getSession()` use.
3. Next.js, [Authentication](https://nextjs.org/docs/app/guides/authentication). Authentication, session management and authorization are distinct; authorization must protect actions/routes.
4. Next.js, [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data). Server Functions must verify authentication and authorization.
5. Supabase, [Pricing](https://supabase.com/pricing). Current Free quotas: Postgres, Storage and Realtime included; projects pause after inactivity.
6. Supabase, [Realtime: Subscribing to Database Changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes). Broadcast is the recommended realtime method for scalability/security; Postgres Changes is simpler but less scalable.
7. Supabase, [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization). RLS-controlled private channel authorization.
8. Supabase, [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Exposed tables need RLS and policies.
9. Cloudflare, [Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/). Current recommended Workers Next.js path and beta caveat for `vinext`.
10. Cloudflare, [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/). Free/paid plan capability distinction, including Durable Objects availability.
