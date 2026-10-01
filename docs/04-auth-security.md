# Auth and security

## Authentication vs authorization

- **Authentication:** Auth0 proves identity.
- **Session management:** Auth0 Next.js SDK manages app session.
- **Authorization:** Trusted Auth0 namespaced session claims resolve global role; the app database resolves user lifecycle and room ownership. Every privileged mutation must check both. B1 establishes the actor boundary; B2/B3 and the feature packages integrate Data API policies and commands.

## Token decision

Do **not** manually save ID tokens, access tokens, or refresh tokens in `localStorage` or `sessionStorage`.

The Auth0 Next.js SDK owns the application session. `/api/me` exposes only the application profile and resolved global role; it does not return a bearer token. A missing session returns 401, an archived account returns 403, and configuration/provisioning failure returns a sanitized 503 with finite client recovery.

B2 introduces a separate session-authorized, no-store Supabase token endpoint. The approved Supabase third-party Auth0 integration specifically uses the ID token through the Supabase `accessToken` callback; its literal `role: authenticated` claim is a Postgres role, not application admin authority. Cache that token in memory only, clear it on logout/401 and stop on expiry. Tenant configuration and real-token acceptance are still pending B2. See [Supabase Auth0 integration](https://supabase.com/docs/guides/auth/third-party/auth0).

## Login onboarding

1. User returns from Auth0 callback.
2. Server reads Auth0 session.
3. `/api/me` upserts by immutable `auth0Subject`; repeated requests resolve the same application UUID. No email lookup or migration fallback exists in the reset database.
4. Create an active user if absent; update only safe profile fields if present. Do not overwrite lifecycle state or write an authorization role into the deprecated database role column.
5. If the stored status is `archived`, deny access without reactivation and show retry/logout recovery. A subsequent login does not unarchive the user.

`requireActor()` reuses that verified-session/profile boundary. Email, database `users.role`, unnamespaced role and literal JWT `role=authenticated` never grant application admin. Trusted claims are `https://diemdanh.cmdn/role`, or admin entries in the documented namespaced roles/permissions arrays. No runtime mock provider, role switcher or proxy bypass remains.

Never trust `role`, `ownerId`, `roomId`, amount, or visibility from client input without server-side lookup.

## Access rules

The following is the approved target permission matrix; completion requires the B-G command/RLS tests, not just B1 profile tests.

| Action | Required server check |
| --- | --- |
| Settings | global `admin` and user status `active` |
| Private request | active user; room active; not member/pending |
| Approve request | room owner or global admin |
| Manage member/attendance/fund/image | room owner or global admin |
| Self attendance | active member for the current eligible meeting |
| Archive | room owner or global admin; exact phrase `Archive this room` |
| Soft-delete user | global admin; typed confirmation; transactionally transfer each owned active room to acting admin first |

Removing a member with outstanding fund obligations requires server validation that the confirmation phrase is exact. The server, not the client, determines whether outstanding fund obligations exist and logs the removal actor/time.

For archived rooms, normal users receive `404` or `FORBIDDEN` and cannot retrieve room data through a guessed URL. Owner/admin retain a narrowly scoped archived-fund permission solely to confirm existing payments.

Auth0 is the source of truth for global `admin`/`user` role. Configure the two initial Auth0 identities `nvhoang2012002@gmail.com` and `hoang.nguyen@classmethod.vn` as admins in Auth0, then emit a namespaced custom role claim into the application session. Server code verifies that claim for every admin action; the application database neither mirrors nor overrides the role. Do not treat email from client input as authority.

Use route protection for UX, but also enforce each route handler/server action/use case. Hiding Settings nav is not authorization.
