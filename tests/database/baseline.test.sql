-- Run after the full current migration chain on a freshly rebuilt disposable,
-- no-seed database, before real login/profile provisioning. The empty-state
-- invariant belongs to A reset acceptance, not a populated developer database.
-- The transaction rolls back every test record, including append-only records.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT no_plan();

SELECT has_table('public', table_name, table_name || ' exists')
FROM unnest(ARRAY['users','rooms','room_memberships','join_requests',
  'meeting_sessions','attendance_records','fund_candidates','fund_contributions',
  'payments','room_payment_images','audit_logs','app_notifications',
  'peer_debts','peer_payments','user_payment_images']) AS table_name;

-- Incomplete schemas fail the table assertions above instead of aborting the suite.
CREATE FUNCTION pg_temp.assert_empty_business_tables() RETURNS SETOF text
LANGUAGE plpgsql AS $$
DECLARE table_name text; record_count bigint;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','rooms','room_memberships','join_requests',
    'meeting_sessions','attendance_records','fund_candidates','fund_contributions',
    'payments','room_payment_images','audit_logs','app_notifications',
    'peer_debts','peer_payments','user_payment_images'] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', table_name) INTO record_count;
      RETURN NEXT is(record_count, 0::bigint, table_name || ' has no baseline records');
      RETURN NEXT ok((SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.' || table_name)), table_name || ' has RLS');
      RETURN NEXT ok(NOT has_table_privilege('anon', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE'), table_name || ' denies anon grants');
      RETURN NEXT is(has_table_privilege('authenticated','public.' || table_name,'SELECT'),
        table_name<>'audit_logs',table_name || ' has the expected current scoped SELECT grant');
      RETURN NEXT ok(NOT has_table_privilege('authenticated', 'public.' || table_name, 'INSERT,UPDATE,DELETE'),
        table_name || ' denies authenticated table-wide privileged writes');
      RETURN NEXT ok(has_table_privilege('service_role', 'public.' || table_name, 'SELECT')
        AND has_table_privilege('service_role', 'public.' || table_name, 'INSERT')
        AND has_table_privilege('service_role', 'public.' || table_name, 'UPDATE')
        AND has_table_privilege('service_role', 'public.' || table_name, 'DELETE'), table_name || ' grants server CRUD');
    END IF;
  END LOOP;
END $$;
SELECT pg_temp.assert_empty_business_tables();
SELECT col_type_is('public', table_name, column_name, 'integer', table_name || '.' || column_name || ' stores integer VND')
FROM (VALUES ('fund_candidates','suggested_amount'), ('fund_contributions','amount'),
  ('payments','amount'), ('peer_debts','amount'), ('peer_payments','amount')) AS amounts(table_name,column_name)
WHERE to_regclass('public.' || table_name) IS NOT NULL;

SELECT is((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND cmd='SELECT'),
  14::bigint,'full chain has the approved business SELECT policies');
SELECT is((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND cmd='UPDATE'
  AND tablename='app_notifications'),1::bigint,'only notifications have an UPDATE policy');
SELECT ok(NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public'
  AND (roles<>ARRAY['authenticated']::name[] OR cmd NOT IN('SELECT','UPDATE')
    OR (cmd='UPDATE' AND tablename<>'app_notifications'))),
  'current business policies never grant anon or privileged browser mutations');
SELECT is(ARRAY(SELECT p.oid::regprocedure::text FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef ORDER BY p.oid::regprocedure::text),
  ARRAY(SELECT signature FROM (VALUES ('current_app_user_id()'),('can_manage_room(uuid)'),
    ('can_read_room(uuid)'),('can_read_join_request(uuid)')) approved(signature) ORDER BY signature),
  'only approved bounded SECURITY DEFINER helpers exist; no role shortcut');
-- Reproduce the old shortcut in a transaction-only helper. Its true result must
-- never confer table rights, even when its SECURITY DEFINER owner is postgres.
CREATE FUNCTION public._baseline_test_unsafe_role_helper() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$ SELECT current_user = 'postgres' $$;
ALTER FUNCTION public._baseline_test_unsafe_role_helper() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public._baseline_test_unsafe_role_helper() TO anon, authenticated;
SELECT ok((SELECT rolbypassrls FROM pg_roles WHERE rolname = 'service_role'), 'service role uses native RLS bypass');
SELECT is((SELECT count(*) FROM storage.buckets WHERE id = 'payment-images' AND NOT public
  AND file_size_limit = 5242880 AND allowed_mime_types @> ARRAY['image/jpeg','image/png','image/webp']
  AND cardinality(allowed_mime_types) = 3), 1::bigint, 'private restricted payment bucket');
SELECT is((SELECT count(*) FROM storage.objects WHERE bucket_id = 'payment-images'), 0::bigint, 'no payment Storage metadata after reset');
SELECT ok(NOT EXISTS (SELECT FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'),
  'bounded B2 row access adds no browser Storage object policies');
SELECT ok(EXISTS (SELECT FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public' AND tablename = table_name), table_name || ' published')
FROM unnest(ARRAY['attendance_records','meeting_sessions','fund_candidates','join_requests',
  'room_memberships','fund_contributions','payments','room_payment_images','rooms','app_notifications',
  'users','peer_debts','peer_payments','user_payment_images']) AS table_name;

-- Guard the behavior block so the intentionally incomplete RED schema can finish.
CREATE FUNCTION pg_temp.assert_business_behavior() RETURNS SETOF text
LANGUAGE plpgsql AS $$
DECLARE owner_id uuid := gen_random_uuid(); member_id uuid := gen_random_uuid();
  room_id uuid := gen_random_uuid(); session_id uuid := gen_random_uuid();
  contribution_id uuid := gen_random_uuid(); debt_id uuid := gen_random_uuid();
  table_name text; role_name text;
BEGIN
  IF EXISTS (SELECT FROM unnest(ARRAY['users','rooms','room_memberships','join_requests',
    'meeting_sessions','attendance_records','fund_candidates','fund_contributions',
    'payments','audit_logs','peer_debts','peer_payments','room_payment_images','user_payment_images']) AS name
    WHERE to_regclass('public.' || name) IS NULL) THEN RETURN; END IF;
  INSERT INTO users(id,auth0_subject,email,display_name) VALUES
    (owner_id,'test|' || owner_id,'owner@test.invalid','Owner'),
    (member_id,'test|' || member_id,'member@test.invalid','Member');
  INSERT INTO rooms(id,name,owner_id) VALUES(room_id,'Test',owner_id);
  RETURN NEXT throws_ok(format('UPDATE rooms SET type=''invalid'' WHERE id=%L',room_id), '23514', NULL, 'room type preserves meeting/channel constraint');
  RETURN NEXT lives_ok(format('UPDATE rooms SET type=''channel'' WHERE id=%L',room_id), 'channel room type remains supported');
  RETURN NEXT throws_ok(format('UPDATE users SET status=''invalid'' WHERE id=%L',owner_id), '23514', NULL, 'user lifecycle state is constrained');
  RETURN NEXT throws_ok(format('UPDATE rooms SET status=''invalid'' WHERE id=%L',room_id), '23514', NULL, 'room lifecycle state is constrained');
  INSERT INTO meeting_sessions(id,room_id,title,starts_at,attendance_deadline,closes_at)
    VALUES(session_id,room_id,'Test',now(),now(),now());
  INSERT INTO room_memberships(room_id,user_id) VALUES(room_id,member_id);
  RETURN NEXT throws_ok(format('INSERT INTO room_memberships(room_id,user_id) VALUES(%L,%L)',room_id,member_id), '23505', NULL, 'duplicate active membership rejected');
  RETURN NEXT lives_ok(format('INSERT INTO room_memberships(room_id,user_id,status) VALUES(%L,%L,''left'')',room_id,member_id), 'historical membership allowed');
  INSERT INTO join_requests(room_id,requester_id) VALUES(room_id,member_id);
  RETURN NEXT throws_ok(format('INSERT INTO join_requests(room_id,requester_id) VALUES(%L,%L)',room_id,member_id), '23505', NULL, 'duplicate pending request rejected');
  RETURN NEXT lives_ok(format('INSERT INTO join_requests(room_id,requester_id,status) VALUES(%L,%L,''rejected'')',room_id,member_id), 'historical request allowed');
  INSERT INTO attendance_records(meeting_session_id,user_id,status,changed_by) VALUES(session_id,member_id,'present',owner_id);
  RETURN NEXT throws_ok(format('INSERT INTO attendance_records(meeting_session_id,user_id,status,changed_by) VALUES(%L,%L,''absent'',%L)',session_id,member_id,owner_id), '23505', NULL, 'attendance is unique per session and user');
  INSERT INTO fund_candidates(meeting_session_id,user_id) VALUES(session_id,member_id);
  RETURN NEXT throws_ok(format('INSERT INTO fund_candidates(meeting_session_id,user_id) VALUES(%L,%L)',session_id,member_id), '23505', NULL, 'candidate is unique per session and user');
  RETURN NEXT throws_ok(format('UPDATE fund_candidates SET suggested_amount=0 WHERE meeting_session_id=%L',session_id), '23514', NULL, 'candidate amount must be positive');
  INSERT INTO fund_contributions(id,room_id,contributor_id,amount,reason,created_by) VALUES(contribution_id,room_id,member_id,50000,'Đi trễ',owner_id);
  RETURN NEXT throws_ok(format('UPDATE fund_contributions SET amount=0 WHERE id=%L',contribution_id), '23514', NULL, 'contribution amount must be positive');
  RETURN NEXT throws_ok(format('UPDATE fund_contributions SET amount=''1.5'' WHERE id=%L',contribution_id), '22P02', NULL, 'VND rejects fractional text');
  RETURN NEXT throws_ok(format('UPDATE fund_contributions SET reason=''Khác'', reason_details='' '' WHERE id=%L',contribution_id), '23514', NULL, 'other reason needs details');
  INSERT INTO peer_debts(id,room_id,creditor_id,debtor_id,amount) VALUES(debt_id,room_id,owner_id,member_id,50000);
  RETURN NEXT throws_ok(format('UPDATE peer_debts SET amount=-1 WHERE id=%L',debt_id), '23514', NULL, 'peer debt amount must be positive');
  RETURN NEXT throws_ok(format('INSERT INTO payments(contribution_id,amount,confirmed_by) VALUES(%L,0,%L)',contribution_id,owner_id), '23514', NULL, 'payment amount must be positive');
  RETURN NEXT throws_ok(format('INSERT INTO peer_payments(peer_debt_id,amount,confirmed_by) VALUES(%L,0,%L)',debt_id,owner_id), '23514', NULL, 'peer payment amount must be positive');
  INSERT INTO room_payment_images(room_id,storage_path,mime_type,file_size,uploaded_by) VALUES(room_id,'test/room.png','image/png',1,owner_id);
  RETURN NEXT throws_ok(format('INSERT INTO room_payment_images(room_id,storage_path,mime_type,file_size,uploaded_by) VALUES(%L,''test/duplicate.png'',''image/png'',1,%L)',room_id,owner_id), '23505', NULL, 'one QR metadata record per room');
  RETURN NEXT throws_ok(format('UPDATE room_payment_images SET file_size=5242881 WHERE room_id=%L',room_id), '23514', NULL, 'room QR size limited to 5 MiB');
  RETURN NEXT throws_ok(format('UPDATE room_payment_images SET mime_type=''image/svg+xml'' WHERE room_id=%L',room_id), '23514', NULL, 'room QR rejects SVG');
  INSERT INTO user_payment_images(user_id,storage_path,mime_type,file_size) VALUES(owner_id,'test/user.png','image/png',1);
  RETURN NEXT throws_ok(format('INSERT INTO user_payment_images(user_id,storage_path,mime_type,file_size) VALUES(%L,''test/duplicate.png'',''image/png'',1)',owner_id), '23505', NULL, 'one QR metadata record per user');
  RETURN NEXT throws_ok(format('UPDATE user_payment_images SET file_size=0 WHERE user_id=%L',owner_id), '23514', NULL, 'user QR size must be positive');
  RETURN NEXT throws_ok(format('UPDATE user_payment_images SET file_size=5242881 WHERE user_id=%L',owner_id), '23514', NULL, 'user QR size limited to 5 MiB');
  RETURN NEXT throws_ok(format('UPDATE user_payment_images SET mime_type=''image/svg+xml'' WHERE user_id=%L',owner_id), '23514', NULL, 'user QR rejects SVG');
  INSERT INTO payments(contribution_id,amount,confirmed_by) VALUES(contribution_id,50000,owner_id);
  INSERT INTO peer_payments(peer_debt_id,amount,confirmed_by) VALUES(debt_id,50000,owner_id);
  INSERT INTO audit_logs(actor_id,action,target_type,target_id) VALUES(owner_id,'test','room',room_id::text);
  FOREACH table_name IN ARRAY ARRAY['payments','peer_payments','audit_logs'] LOOP
    RETURN NEXT throws_ok(format('UPDATE %I SET id=id',table_name),'P0001',NULL,table_name || ' rejects update');
    RETURN NEXT throws_ok(format('DELETE FROM %I',table_name),'P0001',NULL,table_name || ' rejects delete');
  END LOOP;
  -- Existing rows ensure UPDATE/DELETE cannot appear secure merely by matching zero rows.
  PERFORM set_config('request.jwt.claim','',true);
  PERFORM set_config('request.jwt.claims','{}',true);
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    EXECUTE format('SET LOCAL ROLE %I',role_name);
    RETURN NEXT ok(public._baseline_test_unsafe_role_helper(), role_name || ' sees unsafe postgres-owned helper return true');
    FOREACH table_name IN ARRAY ARRAY['users','rooms','room_memberships','join_requests',
      'meeting_sessions','attendance_records','fund_candidates','fund_contributions',
      'payments','room_payment_images','audit_logs','app_notifications',
      'peer_debts','peer_payments','user_payment_images'] LOOP
      RETURN NEXT throws_ok(format('INSERT INTO public.%I DEFAULT VALUES',table_name),'42501',NULL,role_name || ' ' || table_name || ' direct insert denied');
      RETURN NEXT throws_ok(format('UPDATE public.%I SET id=id',table_name),'42501',NULL,role_name || ' ' || table_name || ' direct update denied');
      RETURN NEXT throws_ok(format('DELETE FROM public.%I',table_name),'42501',NULL,role_name || ' ' || table_name || ' direct delete denied');
      IF role_name='anon' OR table_name='audit_logs' THEN
        RETURN NEXT throws_ok(format('SELECT * FROM public.%I',table_name),'42501',NULL,
          role_name || ' ' || table_name || ' direct read denied');
      ELSE
        RETURN NEXT results_eq(format('SELECT id FROM public.%I',table_name),'SELECT NULL::uuid WHERE false',
          role_name || ' ' || table_name || ' unsafe definer return grants no rows');
      END IF;
    END LOOP;
    RESET ROLE;
  END LOOP;
  SET LOCAL ROLE service_role;
  RETURN NEXT lives_ok('INSERT INTO public.users(auth0_subject,email,display_name) VALUES(''test|service-role'',''server@test.invalid'',''Server'')', 'server can provision through native bypass');
  RETURN NEXT lives_ok('UPDATE public.users SET display_name=''Updated'' WHERE auth0_subject=''test|service-role''', 'server can update through native bypass');
  RETURN NEXT lives_ok('DELETE FROM public.users WHERE auth0_subject=''test|service-role''', 'server can delete disposable unreferenced profile');
  FOREACH table_name IN ARRAY ARRAY['payments','peer_payments','audit_logs'] LOOP
    RETURN NEXT throws_ok(format('UPDATE public.%I SET id=id',table_name),'P0001',NULL,'server cannot update ' || table_name || ' evidence');
    RETURN NEXT throws_ok(format('DELETE FROM public.%I',table_name),'P0001',NULL,'server cannot delete ' || table_name || ' evidence');
  END LOOP;
  RESET ROLE;
END $$;
SELECT pg_temp.assert_business_behavior();
SELECT * FROM finish();
ROLLBACK;
