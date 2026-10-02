BEGIN;

SELECT plan(3);

SELECT has_table('payment_corrections');
SELECT has_function('create_contributions');
SELECT has_function('confirm_payment');

SELECT * FROM finish();

ROLLBACK;
