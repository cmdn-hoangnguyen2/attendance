BEGIN;

SELECT plan(2);

SELECT has_function(
    'public',
    'send_room_invitation',
    ARRAY['uuid', 'boolean', 'jsonb', 'uuid'],
    'Function send_room_invitation exists'
);

SELECT has_function(
    'public',
    'resolve_room_invitation',
    ARRAY['uuid', 'boolean', 'jsonb', 'uuid'],
    'Function resolve_room_invitation exists'
);

-- TODO: Add assertions for members/archived users excluded; non-owner cannot enumerate directory, etc.

SELECT * FROM finish();

ROLLBACK;
