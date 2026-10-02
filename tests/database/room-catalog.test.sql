BEGIN;

SELECT plan(6);

-- 1. Setup test data (mock roles/users if necessary, assuming dependencies B1/B2 exist)
-- Since B3 is missing, we only assert the schema and RPC existence for now, plus expected failures for logic

SELECT has_function(
    'public',
    'get_room_catalog',
    ARRAY['text', 'text', 'text', 'integer', 'integer'],
    'Function get_room_catalog exists'
);

SELECT has_function(
    'public',
    'get_my_rooms',
    ARRAY['text', 'text', 'integer', 'integer'],
    'Function get_my_rooms exists'
);

SELECT has_table('public', 'room_catalog_signals', 'room_catalog_signals table exists');

SELECT has_column('public', 'room_catalog_signals', 'room_id', 'room_catalog_signals has room_id');
SELECT has_column('public', 'room_catalog_signals', 'member_count', 'room_catalog_signals has member_count');
SELECT has_column('public', 'room_catalog_signals', 'version', 'room_catalog_signals has version');

-- TODO: Add integration assertions for 13 visible rooms -> pages 12+1, wildcard characters `%`/`_`, etc.
-- when the baseline schema from A is available and seed-free data is populated in tests.

SELECT * FROM finish();

ROLLBACK;
