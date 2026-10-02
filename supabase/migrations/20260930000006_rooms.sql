-- Migration: 20260930000006_rooms.sql
-- Dependency: 20260930000005_command_boundary.sql (B3)

-- 1. room_catalog_signals table
CREATE TABLE IF NOT EXISTS public.room_catalog_signals (
    room_id uuid PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
    member_count integer NOT NULL DEFAULT 0,
    version bigint NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_catalog_signals ENABLE ROW LEVEL SECURITY;

-- 2. Read RPCs
CREATE OR REPLACE FUNCTION public.get_room_catalog(
    search text DEFAULT NULL,
    visibility text DEFAULT NULL,
    room_type text DEFAULT NULL,
    page integer DEFAULT 1,
    page_size integer DEFAULT 12
) RETURNS jsonb AS $$
BEGIN
    -- TODO: Implement catalog query with RLS and pagination
    RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0, 'page', page, 'pageSize', page_size);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_rooms(
    section text,
    search text DEFAULT NULL,
    page integer DEFAULT 1,
    page_size integer DEFAULT 12
) RETURNS jsonb AS $$
BEGIN
    -- TODO: Implement my rooms query with RLS and pagination
    RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0, 'page', page, 'pageSize', page_size);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Mutator RPCs (C2: create, join, resolve_request)
CREATE OR REPLACE FUNCTION public.create_room(
    actor_id uuid,
    actor_is_admin boolean,
    payload jsonb,
    request_id uuid
) RETURNS jsonb AS $$
BEGIN
    -- TODO: Implement atomic room creation
    RETURN jsonb_build_object('success', false, 'error', 'Not implemented');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.join_room(
    actor_id uuid,
    actor_is_admin boolean,
    payload jsonb,
    request_id uuid
) RETURNS jsonb AS $$
BEGIN
    -- TODO: Implement public join or private request
    RETURN jsonb_build_object('success', false, 'error', 'Not implemented');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.resolve_join_request(
    actor_id uuid,
    actor_is_admin boolean,
    payload jsonb,
    request_id uuid
) RETURNS jsonb AS $$
BEGIN
    -- TODO: Implement approve, reject, cancel
    RETURN jsonb_build_object('success', false, 'error', 'Not implemented');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Mutator RPCs (C3: send_invitation, resolve_invitation)
CREATE OR REPLACE FUNCTION public.send_room_invitation(
    actor_id uuid,
    actor_is_admin boolean,
    payload jsonb,
    request_id uuid
) RETURNS jsonb AS $$
BEGIN
    -- TODO: Implement send invitation
    RETURN jsonb_build_object('success', false, 'error', 'Not implemented');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.resolve_room_invitation(
    actor_id uuid,
    actor_is_admin boolean,
    payload jsonb,
    request_id uuid
) RETURNS jsonb AS $$
BEGIN
    -- TODO: Implement accept, decline, cancel
    RETURN jsonb_build_object('success', false, 'error', 'Not implemented');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
