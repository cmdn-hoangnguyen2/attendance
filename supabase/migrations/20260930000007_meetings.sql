-- Migration 20260930000007_meetings.sql
-- Created by Worker D

-- 1. schedule_session
CREATE OR REPLACE FUNCTION schedule_session(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_room_id uuid;
  v_title text;
  v_starts_at timestamptz;
  v_deadline timestamptz;
  v_closes_at timestamptz;
  v_session_id uuid;
BEGIN
  v_room_id := (payload->>'roomId')::uuid;
  v_title := payload->>'title';
  v_starts_at := (payload->>'startsAt')::timestamptz;

  IF v_starts_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'startsAt must be in the future');
  END IF;

  v_deadline := v_starts_at;
  v_closes_at := date_trunc('day', v_starts_at AT TIME ZONE 'Asia/Ho_Chi_Minh' + interval '1 day') AT TIME ZONE 'Asia/Ho_Chi_Minh';

  -- apply lock order users -> rooms -> feature rows
  PERFORM 1 FROM users WHERE id = actor_id FOR UPDATE;
  PERFORM 1 FROM rooms WHERE id = v_room_id FOR UPDATE;
  
  INSERT INTO room_sessions (room_id, title, starts_at, deadline, closes_at, created_by, status) 
  VALUES (v_room_id, v_title, v_starts_at, v_deadline, v_closes_at, actor_id, 'scheduled') 
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('sessionId', v_session_id));
END;
$$;

-- 2. set_attendance
CREATE OR REPLACE FUNCTION set_attendance(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id uuid;
  v_target_user_id uuid;
  v_status text;
  v_deadline timestamptz;
  v_is_owner boolean;
  v_room_id uuid;
BEGIN
  v_session_id := (payload->>'sessionId')::uuid;
  v_target_user_id := COALESCE((payload->>'userId')::uuid, actor_id);
  v_status := payload->>'status';
  
  IF v_status NOT IN ('present', 'absent', 'late') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid attendance status');
  END IF;

  SELECT room_id, deadline INTO v_room_id, v_deadline FROM room_sessions WHERE id = v_session_id;
  SELECT (owner_id = actor_id) INTO v_is_owner FROM rooms WHERE id = v_room_id;

  IF v_target_user_id = actor_id THEN
    IF now() >= v_deadline THEN
      RETURN jsonb_build_object('success', false, 'error', 'Self-attendance rejected at or after deadline');
    END IF;
  ELSE
    IF NOT (v_is_owner OR actor_is_admin) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Target user requires owner or admin');
    END IF;
  END IF;

  PERFORM 1 FROM users WHERE id IN (actor_id, v_target_user_id) ORDER BY id FOR UPDATE;
  PERFORM 1 FROM rooms WHERE id = v_room_id FOR UPDATE;

  INSERT INTO session_attendance (session_id, user_id, status, updated_at, updated_by)
  VALUES (v_session_id, v_target_user_id, v_status, now(), actor_id)
  ON CONFLICT (session_id, user_id) DO UPDATE SET status = v_status, updated_at = now(), updated_by = actor_id;

  IF now() >= v_deadline AND (v_is_owner OR actor_is_admin) THEN
     -- Insert audit log for override
     INSERT INTO audit_logs (action, target_id, actor_id, metadata) VALUES ('attendance_override', v_target_user_id, actor_id, jsonb_build_object('session_id', v_session_id, 'new_status', v_status));
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. close_session
CREATE OR REPLACE FUNCTION close_session(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id uuid;
  v_room_id uuid;
BEGIN
  v_session_id := (payload->>'sessionId')::uuid;
  SELECT room_id INTO v_room_id FROM room_sessions WHERE id = v_session_id;

  PERFORM 1 FROM rooms WHERE id = v_room_id FOR UPDATE;
  
  UPDATE room_sessions SET status = 'closed' WHERE id = v_session_id AND status != 'closed';
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. finalize_session_deadline
CREATE OR REPLACE FUNCTION finalize_session_deadline(session_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_room_id uuid;
  v_deadline timestamptz;
  v_is_finalized boolean;
BEGIN
  SELECT room_id, deadline, (status = 'finalized' OR status = 'closed') INTO v_room_id, v_deadline, v_is_finalized
  FROM room_sessions WHERE id = session_id;

  IF v_is_finalized THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already finalized');
  END IF;

  -- Snapshot eligible participants
  INSERT INTO session_candidates (session_id, user_id, attendance_status_at_deadline, display_name, email, suggested_amount)
  SELECT 
    session_id, 
    m.user_id, 
    COALESCE(a.status, 'absent'), 
    u.display_name, 
    u.email, 
    COALESCE(r.default_amount, 0)
  FROM room_members m
  JOIN users u ON m.user_id = u.id
  JOIN rooms r ON m.room_id = r.id
  LEFT JOIN session_attendance a ON a.session_id = session_id AND a.user_id = m.user_id
  WHERE m.room_id = v_room_id
    AND m.joined_at <= v_deadline
    AND (m.left_at IS NULL OR m.left_at > v_deadline)
    AND m.status = 'active'
  ON CONFLICT DO NOTHING;

  UPDATE room_sessions SET status = 'finalized' WHERE id = session_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. close_due_sessions
CREATE OR REPLACE FUNCTION close_due_sessions(as_of timestamptz) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM room_sessions WHERE closes_at <= as_of AND status != 'closed' LOOP
    PERFORM finalize_session_deadline(r.id);
    UPDATE room_sessions SET status = 'closed' WHERE id = r.id;
  END LOOP;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Functions for Membership lifecycle (D2)
CREATE OR REPLACE FUNCTION change_membership(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_action text;
  v_room_id uuid;
  v_target_id uuid;
  v_reason text;
  v_phrase text;
  v_is_owner boolean;
  v_has_debt boolean;
BEGIN
  v_action := payload->>'action';
  v_room_id := (payload->>'roomId')::uuid;
  v_target_id := (payload->>'userId')::uuid;
  v_reason := payload->>'reason';
  v_phrase := trim(payload->>'confirmationPhrase');

  PERFORM 1 FROM users WHERE id IN (actor_id, v_target_id) ORDER BY id FOR UPDATE;
  PERFORM 1 FROM rooms WHERE id = v_room_id FOR UPDATE;

  SELECT (owner_id = v_target_id) INTO v_is_owner FROM rooms WHERE id = v_room_id;
  v_has_debt := false; -- placeholder for actual debt calculation
  
  IF v_action = 'leave' THEN
    IF v_target_id != actor_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Leave target must equal actor');
    END IF;
    IF v_is_owner THEN
      RETURN jsonb_build_object('success', false, 'error', 'Owner cannot leave without transfer');
    END IF;
    UPDATE room_members SET status = 'left', left_at = now() WHERE room_id = v_room_id AND user_id = v_target_id;

  ELSIF v_action = 'remove' THEN
    IF v_is_owner THEN
      RETURN jsonb_build_object('success', false, 'error', 'Owner removal blocked until transfer');
    END IF;
    
    IF v_has_debt THEN
      IF v_phrase != 'I agree to remove this user' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid confirmation phrase for removal with debt');
      END IF;
    END IF;
    
    UPDATE room_members SET status = 'removed', left_at = now() WHERE room_id = v_room_id AND user_id = v_target_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION change_room_lifecycle(actor_id uuid, actor_is_admin boolean, payload jsonb, request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_action text;
  v_room_id uuid;
  v_new_owner_id uuid;
  v_phrase text;
  v_is_recipient_active boolean;
BEGIN
  v_action := payload->>'action';
  v_room_id := (payload->>'roomId')::uuid;
  v_phrase := trim(payload->>'confirmationPhrase');
  
  PERFORM 1 FROM users WHERE id = actor_id FOR UPDATE;
  PERFORM 1 FROM rooms WHERE id = v_room_id FOR UPDATE;

  IF v_action = 'archive' THEN
    IF v_phrase != 'Archive this room' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid confirmation phrase');
    END IF;
    UPDATE rooms SET status = 'archived' WHERE id = v_room_id;
    
  ELSIF v_action = 'transfer' THEN
    v_new_owner_id := (payload->>'newOwnerId')::uuid;
    SELECT (status = 'active') INTO v_is_recipient_active FROM room_members WHERE room_id = v_room_id AND user_id = v_new_owner_id;
    IF NOT v_is_recipient_active THEN
      RETURN jsonb_build_object('success', false, 'error', 'Transfer recipient must be an active member');
    END IF;
    UPDATE rooms SET owner_id = v_new_owner_id WHERE id = v_room_id;
    
  ELSIF v_action = 'restore' THEN
    IF NOT actor_is_admin THEN
      RETURN jsonb_build_object('success', false, 'error', 'Restore requires admin');
    END IF;
    UPDATE rooms SET status = 'active' WHERE id = v_room_id;
    
  ELSIF v_action = 'update' THEN
    -- update name/visibility
    UPDATE rooms SET name = COALESCE(payload->>'name', name), visibility = COALESCE(payload->>'visibility', visibility) WHERE id = v_room_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
