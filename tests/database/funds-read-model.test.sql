BEGIN;

-- This test should fail because get_personal_funds is just a stub returning {}
DO $$
DECLARE
    res jsonb;
BEGIN
    res := get_personal_funds('active', 1, 10);
    IF NOT res ? 'items' THEN
        RAISE EXCEPTION 'Expected items in response, got %', res;
    END IF;
END $$;

ROLLBACK;
