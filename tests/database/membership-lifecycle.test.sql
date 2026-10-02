BEGIN;
SELECT plan(1);

-- TODO: Write proper tests for D2 features

SELECT ok(false, 'Expected failure under browser sequential writes');

SELECT * FROM finish();
ROLLBACK;
