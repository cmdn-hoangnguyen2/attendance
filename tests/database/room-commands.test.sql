BEGIN;

SELECT plan(3);

SELECT has_function(
    'public',
    'create_room',
    ARRAY['uuid', 'boolean', 'jsonb', 'uuid'],
    'Function create_room exists'
);

SELECT has_function(
    'public',
    'join_room',
    ARRAY['uuid', 'boolean', 'jsonb', 'uuid'],
    'Function join_room exists'
);

SELECT has_function(
    'public',
    'resolve_join_request',
    ARRAY['uuid', 'boolean', 'jsonb', 'uuid'],
    'Function resolve_join_request exists'
);

-- TODO: Add assertions for empty/whitespace/overlong room name, invalid type/visibility, etc.

SELECT * FROM finish();

ROLLBACK;
