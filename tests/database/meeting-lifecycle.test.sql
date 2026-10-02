BEGIN;
SELECT plan(6);

-- Test 1: Future session only
-- Test 2: Starts 10:00 -> self 09:59:59 accepted, 10:00:00 rejected
-- Test 3: Missing attendance defaults absent
-- Test 4: Leave never candidate
-- Test 5: Repeated finalization one record/candidate
-- Test 6: Owner override audit exists without removing candidate

SELECT ok(false, 'Expected failure: future session only');
SELECT ok(false, 'Expected failure: starts 10:00 -> self 09:59:59 accepted, 10:00:00 rejected');
SELECT ok(false, 'Expected failure: missing attendance defaults absent');
SELECT ok(false, 'Expected failure: leave never candidate');
SELECT ok(false, 'Expected failure: repeated finalization one record/candidate');
SELECT ok(false, 'Expected failure: owner override audit exists without removing candidate');

SELECT * FROM finish();
ROLLBACK;
