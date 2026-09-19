# Auth and security

## Authentication vs authorization

- **Authentication:** Auth0 proves identity.
- **Session management:** Auth0 Next.js SDK manages app session.
- **Authorization:** Auth0 session custom claim resolves global role; app database resolves user lifecycle and room ownership. Both are checked in every mutation.

## Token decision

Do **not** manually save ID tokens, access tokens, or refresh tokens in `localStorage` or `sessionStorage`.

An ID token is primarily identity data, but it is still a signed bearer credential. Any XSS that reads it can exfiltrate it. Auth0 explicitly says an ID token is not needed to call APIs and recommends no token storage in that situation. For this app, use the Auth0 Next.js SDK server session, ideally a server-side/custom session store if cookie size becomes relevant; expose only a narrow profile DTO to client UI.

## Login onboarding

1. User returns from Auth0 callback.
2. Server reads Auth0 session.
3. Transactionally find user by immutable `auth0Subject`, with email secondary lookup only for migration conflict handling.
4. Create active user if absent; update safe profile fields if present.
5. If `soft_deleted`, deny app access and show a neutral support message.

Never trust `role`, `ownerId`, `roomId`, amount, or visibility from client input without server-side lookup.

## Access rules

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
