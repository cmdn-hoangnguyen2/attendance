# Realtime design

## Rule

The database transaction is the source of truth. Realtime only signals clients to refetch or applies a validated versioned update; it never grants permission or makes the original write.

## Private topics

| Topic | Audience | Events |
| --- | --- | --- |
| `room:{roomId}` | active members, owner, global admin | membership/request/attendance/fund candidate/fund contribution/payment/image/room archive changes |
| `user:{userId}` | that user, global admin | Funds contribution added/updated; user status change |
| `admin` | global admins | user/room lifecycle changes |

## Mutation flow

1. Client submits a Route Handler or Server Action.
2. Use case loads authoritative identity and permissions.
3. Transaction commits business change and audit log.
4. Server emits minimal event with entity ID/type/version to authorized private topic.
5. Clients receive event, invalidate/refetch affected query; UI handles reconnect/loading/error.

## Why not Pusher now

Pusher is viable, but it adds a vendor, secret/configuration, authorization endpoint and a second billing/operational surface. Supabase Free currently includes Realtime connections/messages adequate for the stated test scale, and its private Broadcast authorization uses RLS. Start there; benchmark/replace only with evidence.

## Security constraint

Never publish fund contribution amounts, requester identity, or private image URL to a topic broader than the people already authorized to read that record. When a room is archived, revoke normal-member room subscriptions; only owner/admin may subscribe to its archive-fund topic. Realtime channel authorization and database RLS must use matching membership rules.
