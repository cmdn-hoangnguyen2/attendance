-- Focused private-history authorization tests; no genuine-token acceptance claim.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
-- The file owns its fixture transaction and rolls it back after pgTAP finishes.
SET LOCAL search_path = public, extensions;
SELECT no_plan();

-- Convert missing RED grants into TAP failures, not an aborted transaction.
CREATE FUNCTION pg_temp.s4_expect_rows(query text, expected uuid[], label text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE actual uuid[];
BEGIN
  EXECUTE 'SELECT coalesce(array_agg(id ORDER BY id), ARRAY[]::uuid[]) FROM ('
    || query || ') AS scoped_rows' INTO actual;
  RETURN is(actual, ARRAY(SELECT item FROM unnest(expected) item ORDER BY item), label);
EXCEPTION WHEN OTHERS THEN
  RETURN fail(label || ': unexpected SQLSTATE ' || SQLSTATE);
END $$;

CREATE FUNCTION pg_temp.assert_peer_behavior() RETURNS SETOF text
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  creditor_id uuid := gen_random_uuid(); debtor_id uuid := gen_random_uuid();
  confirmer_id uuid := gen_random_uuid(); owner_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid(); outsider_id uuid := gen_random_uuid();
  archived_room uuid := gen_random_uuid(); debt_id uuid := gen_random_uuid();
  payment_id uuid := gen_random_uuid(); creditor_qr uuid := gen_random_uuid();
  debtor_qr uuid := gen_random_uuid(); fixture record;
  prefix text := 'auth0|s4-' || gen_random_uuid() || '-';
  claim jsonb; debt_expected uuid[]; payment_expected uuid[];
  creditor_qr_expected uuid[]; debtor_qr_expected uuid[];
BEGIN
  INSERT INTO public.users(id, auth0_subject, email, display_name) VALUES
    (creditor_id, prefix || 'creditor', 's4-creditor@test.invalid', 'S4 Creditor'),
    (debtor_id, prefix || 'debtor', 's4-debtor@test.invalid', 'S4 Debtor'),
    (confirmer_id, prefix || 'confirmer', 's4-confirmer@test.invalid', 'S4 Confirmer'),
    (owner_id, prefix || 'owner', 's4-owner@test.invalid', 'S4 Owner'),
    (admin_id, prefix || 'admin', 's4-admin@test.invalid', 'S4 Admin'),
    (outsider_id, prefix || 'outsider', 's4-outsider@test.invalid', 'S4 Outsider');
  INSERT INTO public.rooms(id, name, owner_id, visibility, type, status) VALUES
    (archived_room, 'S4 Archived Channel', owner_id, 'private', 'channel', 'archived');
  -- Parties are no longer active members; history remains their own.
  INSERT INTO public.room_memberships(room_id, user_id, status) VALUES
    (archived_room, creditor_id, 'removed'), (archived_room, debtor_id, 'left');
  INSERT INTO public.peer_debts(id, room_id, creditor_id, debtor_id, amount) VALUES
    (debt_id, archived_room, creditor_id, debtor_id, 50000);
  -- A server-written confirmer reference must not become a read capability.
  INSERT INTO public.peer_payments(id, peer_debt_id, amount, confirmed_by) VALUES
    (payment_id, debt_id, 50000, confirmer_id);
  INSERT INTO public.user_payment_images(id, user_id, storage_path, mime_type, file_size) VALUES
    (creditor_qr, creditor_id, 's4/creditor.png', 'image/png', 1),
    (debtor_qr, debtor_id, 's4/debtor.png', 'image/png', 1);

  PERFORM set_config('request.jwt.claim', '', true);
  FOR fixture IN SELECT * FROM (VALUES
    ('creditor', creditor_id, true, false),
    ('debtor', debtor_id, true, false),
    ('confirmer', confirmer_id, false, false),
    ('owner', owner_id, false, false),
    ('admin', admin_id, false, true),
    ('outsider', outsider_id, false, false)
  ) AS cases(label, actor_id, is_party, admin)
  LOOP
    claim := jsonb_build_object('sub', prefix || fixture.label, 'role', 'authenticated');
    IF fixture.admin THEN
      claim := claim || jsonb_build_object('https://diemdanh.cmdn/role', 'admin');
    END IF;
    PERFORM set_config('request.jwt.claims', claim::text, true);
    debt_expected := CASE WHEN fixture.is_party THEN ARRAY[debt_id] ELSE ARRAY[]::uuid[] END;
    payment_expected := CASE WHEN fixture.is_party THEN ARRAY[payment_id] ELSE ARRAY[]::uuid[] END;
    creditor_qr_expected := CASE WHEN fixture.is_party THEN ARRAY[creditor_qr] ELSE ARRAY[]::uuid[] END;
    debtor_qr_expected := CASE WHEN fixture.label = 'debtor' THEN ARRAY[debtor_qr] ELSE ARRAY[]::uuid[] END;
    SET LOCAL ROLE authenticated;
    RETURN NEXT is(current_user::text, 'authenticated', fixture.label || ' actual authenticated role');
    RETURN NEXT is(public.current_app_user_id(), fixture.actor_id, fixture.label || ' binds active actor');
    IF fixture.admin THEN
      RETURN NEXT is(public.is_app_admin(), true, 'nonparty admin has genuine trusted claim in synthetic harness');
    END IF;
    RETURN NEXT pg_temp.s4_expect_rows(format('SELECT id FROM public.peer_debts WHERE id=%L', debt_id),
      debt_expected, fixture.label || ' exact archived-room debt scope');
    RETURN NEXT pg_temp.s4_expect_rows(format('SELECT id FROM public.peer_payments WHERE id=%L', payment_id),
      payment_expected, fixture.label || ' exact archived-room payment scope');
    RETURN NEXT pg_temp.s4_expect_rows(format('SELECT id FROM public.user_payment_images WHERE id=%L', creditor_qr),
      creditor_qr_expected, fixture.label || ' exact creditor QR scope');
    RETURN NEXT pg_temp.s4_expect_rows(format('SELECT id FROM public.user_payment_images WHERE id=%L', debtor_qr),
      debtor_qr_expected, fixture.label || ' debtor QR only own, never merely debt relationship');
    RESET ROLE;
  END LOOP;

  -- Archive the isolated actors after proving they can read. No stale JWT authority.
  FOR fixture IN SELECT * FROM (VALUES
    ('creditor', creditor_id), ('debtor', debtor_id)
  ) AS cases(label, actor_id)
  LOOP
    UPDATE public.users SET status='soft_deleted', deleted_at=now() WHERE id=fixture.actor_id;
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', prefix || fixture.label,
      'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    RETURN NEXT is(current_user::text, 'authenticated', fixture.label || ' archived check actual role');
    RETURN NEXT is(public.current_app_user_id(), NULL::uuid, fixture.label || ' archive immediately removes active identity');
    RETURN NEXT pg_temp.s4_expect_rows(format('SELECT id FROM public.peer_debts WHERE id=%L', debt_id),
      ARRAY[]::uuid[], fixture.label || ' archived account loses debt');
    RETURN NEXT pg_temp.s4_expect_rows(format('SELECT id FROM public.peer_payments WHERE id=%L', payment_id),
      ARRAY[]::uuid[], fixture.label || ' archived account loses payment');
    RETURN NEXT pg_temp.s4_expect_rows(format('SELECT id FROM public.user_payment_images WHERE id IN(%L,%L)', creditor_qr, debtor_qr),
      ARRAY[]::uuid[], fixture.label || ' archived account loses own and relationship QR');
    RESET ROLE;
  END LOOP;
END $$;
SELECT pg_temp.assert_peer_behavior();
SELECT * FROM finish();
ROLLBACK;
