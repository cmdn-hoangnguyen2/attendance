-- 20260930000008_funds.sql

CREATE TABLE IF NOT EXISTS payment_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL UNIQUE,
    corrected_by UUID NOT NULL,
    corrected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason TEXT NOT NULL
);

-- Note: In a real implementation we would reference the payments table. Assuming it exists or will be altered here.

-- Trigger for append-only corrections
CREATE OR REPLACE FUNCTION prevent_correction_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'payment_corrections is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_append_only_corrections
BEFORE UPDATE OR DELETE ON payment_corrections
FOR EACH ROW EXECUTE FUNCTION prevent_correction_update();

CREATE OR REPLACE FUNCTION create_contributions(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid)
RETURNS jsonb AS $$
BEGIN
    -- pending implementation
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION confirm_payment(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid)
RETURNS jsonb AS $$
BEGIN
    -- pending implementation
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION correct_payment(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid)
RETURNS jsonb AS $$
BEGIN
    -- pending implementation
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_personal_funds(status text, page integer, page_size integer)
RETURNS jsonb AS $$
BEGIN
    -- pending implementation
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_room_funds(room_id uuid, page integer, page_size integer)
RETURNS jsonb AS $$
BEGIN
    -- pending implementation
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION attach_room_qr(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid)
RETURNS jsonb AS $$
BEGIN
    -- pending implementation
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION unlink_room_qr(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid)
RETURNS jsonb AS $$
BEGIN
    -- pending implementation
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;
