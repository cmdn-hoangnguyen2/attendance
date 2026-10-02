-- M1 identity guarantees under the full current migration chain.
-- Synthetic claims exercise real SQL, not signed-token acceptance.
-- Run against the verified local development database; never reset or seed it.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT no_plan();

SELECT has_function('public', 'current_app_user_id', ARRAY[]::text[],
  'current_app_user_id has the parameterless identity contract');
SELECT has_function('public', 'is_app_admin', ARRAY[]::text[],
  'is_app_admin has the parameterless admin contract');

-- These catalog assertions still produce TAP failures when either helper is absent.
SELECT is((SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = helper.name), 1::bigint,
  helper.name || ' exposes only its zero-argument signature')
FROM (VALUES ('current_app_user_id'), ('is_app_admin')) AS helper(name);

CREATE FUNCTION pg_temp.assert_helper_metadata() RETURNS SETOF text
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE helper record; function_record record;
BEGIN
  FOR helper IN SELECT * FROM (VALUES
    ('current_app_user_id', 'uuid', true),
    ('is_app_admin', 'boolean', false)) AS contracts(name, return_type, security_definer)
  LOOP
    SELECT p.* INTO function_record FROM pg_proc p
      WHERE p.oid = to_regprocedure('public.' || helper.name || '()');
    RETURN NEXT is(function_record.prorettype::regtype::text, helper.return_type,
      helper.name || ' returns ' || helper.return_type);
    RETURN NEXT is(function_record.provolatile::text, 's', helper.name || ' is STABLE');
    RETURN NEXT is(function_record.prosecdef, helper.security_definer,
      helper.name || ' uses the approved security mode');
    RETURN NEXT is(pg_get_userbyid(function_record.proowner), 'postgres',
      helper.name || ' has the accepted postgres owner');
    RETURN NEXT is(array_to_string(function_record.proconfig, ';'),
      'search_path=pg_catalog, pg_temp', helper.name || ' fixes its search_path');
    IF function_record.oid IS NULL THEN
      RETURN NEXT fail(helper.name || ' ACL checks require the actual helper');
      CONTINUE;
    END IF;
    RETURN NEXT ok(NOT EXISTS (
      SELECT FROM aclexplode(coalesce(function_record.proacl,
        acldefault('f', function_record.proowner))) acl
      WHERE acl.privilege_type = 'EXECUTE' AND (
        acl.grantee = 0 OR acl.grantee NOT IN
          (function_record.proowner, 'authenticated'::regrole::oid, 'service_role'::regrole::oid)
        OR (acl.grantee <> function_record.proowner AND acl.is_grantable))),
      helper.name || ' grants no PUBLIC/anon/extra role or delegate EXECUTE');
    RETURN NEXT ok(NOT has_function_privilege('anon', function_record.oid, 'EXECUTE'),
      helper.name || ' denies anon effective EXECUTE');
    RETURN NEXT ok(has_function_privilege('authenticated', function_record.oid, 'EXECUTE'),
      helper.name || ' grants authenticated EXECUTE');
    RETURN NEXT ok(has_function_privilege('service_role', function_record.oid, 'EXECUTE'),
      helper.name || ' grants service_role EXECUTE');
  END LOOP;
END $$;
SELECT pg_temp.assert_helper_metadata();

-- B2 adds scoped SELECT and column-only notification read-state access.
-- M1 helpers must never confer service-role CRUD authority on their callers.
SELECT ok(c.relrowsecurity, c.relname || ' retains RLS')
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';
SELECT ok(NOT has_table_privilege('anon', 'public.' || c.relname, 'SELECT,INSERT,UPDATE,DELETE')
  AND NOT has_table_privilege('authenticated', 'public.' || c.relname, 'INSERT,UPDATE,DELETE'),
  c.relname || ' retains anon CRUD and authenticated privileged-write denial')
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';
SELECT is(has_table_privilege('authenticated', 'public.' || c.relname, 'SELECT'),
  c.relname <> 'audit_logs', c.relname || ' has the expected current SELECT grant')
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';
SELECT ok(has_column_privilege('authenticated','public.app_notifications','is_read','UPDATE')
  AND NOT EXISTS (SELECT FROM information_schema.columns
    WHERE table_schema='public' AND table_name='app_notifications' AND column_name<>'is_read'
      AND has_column_privilege('authenticated','public.app_notifications',column_name,'UPDATE')),
  'notification UPDATE grants only the approved is_read column');
SELECT ok(has_table_privilege('service_role', 'public.' || c.relname, 'SELECT')
  AND has_table_privilege('service_role', 'public.' || c.relname, 'INSERT')
  AND has_table_privilege('service_role', 'public.' || c.relname, 'UPDATE')
  AND has_table_privilege('service_role', 'public.' || c.relname, 'DELETE'),
  c.relname || ' retains server CRUD')
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';
SELECT is((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND cmd='SELECT'),
  14::bigint, 'current chain has the approved scoped business SELECT policies');
SELECT is((SELECT count(*) FROM pg_policies WHERE schemaname='public' AND cmd='UPDATE'
  AND tablename='app_notifications'),1::bigint,'only notifications have an UPDATE policy');
SELECT ok(NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public'
  AND (roles<>ARRAY['authenticated']::name[] OR cmd NOT IN('SELECT','UPDATE')
    OR (cmd='UPDATE' AND tablename<>'app_notifications'))),
  'business policies target authenticated without privileged mutation policies');
SELECT ok(NOT EXISTS (SELECT FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'),
  'M1 adds no Storage object policies');

CREATE FUNCTION pg_temp.assert_identity_behavior() RETURNS SETOF text
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  active_id uuid := gen_random_uuid();
  archived_id uuid := gen_random_uuid();
  db_admin_id uuid := gen_random_uuid();
  numeric_id uuid := gen_random_uuid();
  padded_id uuid := gen_random_uuid();
  uuid_subject_id uuid := gen_random_uuid();
  shadow_id uuid := gen_random_uuid();
  fixture_room_id uuid := gen_random_uuid();
  active_subject text := 'auth0|m1-' || active_id;
  archived_subject text := 'auth0|m1-' || archived_id;
  db_admin_subject text := 'auth0|m1-' || db_admin_id;
  padded_subject text := ' auth0|m1-' || padded_id || ' ';
  uuid_subject text := gen_random_uuid()::text;
  fixture record; whitespace_subject text; table_name text; scoped_count bigint;
  business_tables text[] := ARRAY['users','rooms','room_memberships','join_requests',
    'meeting_sessions','attendance_records','fund_candidates','fund_contributions',
    'payments','room_payment_images','audit_logs','app_notifications',
    'peer_debts','peer_payments','user_payment_images'];
BEGIN
  IF to_regprocedure('public.current_app_user_id()') IS NULL
    OR to_regprocedure('public.is_app_admin()') IS NULL THEN
    RETURN NEXT fail('identity/admin behavior requires both actual SQL helpers');
    RETURN;
  END IF;
  -- Never update a genuine profile if a reserved coercion fixture collides.
  IF EXISTS (SELECT FROM public.users WHERE auth0_subject = '123') THEN
    RETURN NEXT fail('numeric coercion fixture subject 123 must be unoccupied');
    RETURN;
  END IF;
  INSERT INTO public.users(id, auth0_subject, email, display_name, role, status) VALUES
    (active_id, active_subject, 'm1-active@test.invalid', 'M1 Active', 'user', 'active'),
    (archived_id, archived_subject, 'm1-archived@test.invalid', 'M1 Archived', 'user', 'soft_deleted'),
    (db_admin_id, db_admin_subject, 'm1-admin@test.invalid', 'M1 DB Admin', 'admin', 'active'),
    (numeric_id, '123', 'm1-number@test.invalid', 'M1 Number', 'user', 'active'),
    (padded_id, padded_subject, 'm1-padded@test.invalid', 'M1 Padded', 'user', 'active'),
    (uuid_subject_id, uuid_subject, 'm1-uuid@test.invalid', 'M1 UUID Subject', 'user', 'active');
  INSERT INTO public.rooms(id, name, owner_id)
    VALUES (fixture_room_id, 'M1 disposable room', active_id);
  -- A hostile temp relation must not redirect the definer lookup.
  CREATE TEMP TABLE users(id uuid, auth0_subject text, status text);
  INSERT INTO pg_temp.users VALUES (shadow_id, active_subject, 'active');
  -- Make blank subjects real lookup matches, so validation cannot pass by accident.
  FOREACH whitespace_subject IN ARRAY ARRAY['', E'\t', U&'\00A0', U&'\FEFF',
    U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF']
  LOOP
    IF EXISTS (SELECT FROM public.users WHERE auth0_subject = whitespace_subject) THEN
      RETURN NEXT fail('blank-subject fixture must be unoccupied');
      RETURN;
    END IF;
    INSERT INTO public.users(auth0_subject, email, display_name)
      VALUES(whitespace_subject, 'm1-blank@test.invalid', 'M1 Blank');
  END LOOP;

  PERFORM set_config('request.jwt.claim', '', true);
  SET LOCAL ROLE authenticated;
  RETURN NEXT is(current_user::text, 'authenticated', 'behavior executes as authenticated caller');
  FOR fixture IN SELECT * FROM (VALUES
    ('missing sub', '{}'::jsonb, NULL::uuid, false),
    ('null sub', '{"sub":null}'::jsonb, NULL::uuid, false),
    ('non-UUID active sub', jsonb_build_object('sub', active_subject), active_id, false),
    ('unknown sub', jsonb_build_object('sub', 'auth0|unknown-' || active_id), NULL::uuid, false),
    ('forged application UUID', jsonb_build_object('sub', active_id::text,
      'https://diemdanh.cmdn/role', 'admin'), NULL::uuid, false),
    ('archived profile', jsonb_build_object('sub', archived_subject,
      'https://diemdanh.cmdn/role', 'admin'), NULL::uuid, false),
    ('numeric 123 cannot coerce to real subject', '{"sub":123}'::jsonb, NULL::uuid, false),
    ('object sub', '{"sub":{"value":"123"}}'::jsonb, NULL::uuid, false),
    ('array sub', '{"sub":["123"]}'::jsonb, NULL::uuid, false),
    ('string 123 maps exact subject', '{"sub":"123"}'::jsonb, numeric_id, false),
    ('padded subject remains exact', jsonb_build_object('sub', padded_subject), padded_id, false),
    ('trimmed subject cannot match padded profile',
      jsonb_build_object('sub', btrim(padded_subject)), NULL::uuid, false),
    ('legitimate UUID-looking subject', jsonb_build_object('sub', uuid_subject), uuid_subject_id, false),
    ('DB admin and email confer no admin', jsonb_build_object('sub', db_admin_subject,
      'email', 'm1-admin@test.invalid'), db_admin_id, false),
    ('literal authenticated is not admin', jsonb_build_object('sub', active_subject,
      'role', 'authenticated'), active_id, false),
    ('untrusted claims are not admin', jsonb_build_object('sub', active_subject,
      'role', 'admin', 'roles', jsonb_build_array('admin'),
      'permissions', jsonb_build_array('admin'), 'userId', db_admin_id), active_id, false),
    ('trusted admin without identity', '{"https://diemdanh.cmdn/role":"admin"}'::jsonb, NULL::uuid, false),
    ('trusted scalar admin', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/role', 'admin'), active_id, true),
    ('trusted roles admin', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/roles', jsonb_build_array('user','admin')), active_id, true),
    ('trusted permissions admin', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/permissions', jsonb_build_array('admin')), active_id, true),
    ('mixed array retains exact top-level admin', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/roles', '[null,123,{"admin":true},"admin"]'::jsonb), active_id, true),
    ('invalid neighbor cannot override valid roles', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/role', 123, 'https://diemdanh.cmdn/roles', jsonb_build_array('admin'),
      'https://diemdanh.cmdn/permissions', '{"admin":true}'::jsonb), active_id, true),
    ('invalid roles cannot override valid permissions', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/roles', 'admin',
      'https://diemdanh.cmdn/permissions', jsonb_build_array('admin')), active_id, true),
    ('object keyed admin rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/roles', '{"admin":true}'::jsonb), active_id, false),
    ('permission object rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/permissions', '{"admin":true}'::jsonb), active_id, false),
    ('scalar roles rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/roles', 'admin'), active_id, false),
    ('array scalar role rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/role', jsonb_build_array('admin')), active_id, false),
    ('nested array admin rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/roles', '[["admin"]]'::jsonb), active_id, false),
    ('padded scalar rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/role', ' admin '), active_id, false),
    ('uppercase scalar rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/role', 'ADMIN'), active_id, false),
    ('padded or uppercase array entries rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/permissions', '[" admin ","ADMIN"]'::jsonb), active_id, false),
    ('null and numeric trusted claims rejected', jsonb_build_object('sub', active_subject,
      'https://diemdanh.cmdn/role', NULL, 'https://diemdanh.cmdn/roles', 123,
      'https://diemdanh.cmdn/permissions', false), active_id, false)
  ) AS cases(label, claims, expected_id, expected_admin)
  LOOP
    PERFORM set_config('request.jwt.claims', fixture.claims::text, true);
    RETURN NEXT is(public.current_app_user_id(), fixture.expected_id, fixture.label || ': identity');
    RETURN NEXT is(public.is_app_admin(), fixture.expected_admin, fixture.label || ': admin');
  END LOOP;
  FOREACH whitespace_subject IN ARRAY ARRAY['', E'\t', U&'\00A0', U&'\FEFF',
    U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF']
  LOOP
    PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', whitespace_subject,
      'https://diemdanh.cmdn/role', 'admin')::text, true);
    RETURN NEXT is(public.current_app_user_id(), NULL::uuid, 'blank subject cannot map an existing profile');
    RETURN NEXT is(public.is_app_admin(), false, 'blank subject cannot acquire admin');
  END LOOP;
  SET LOCAL search_path = pg_temp, public, extensions;
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', active_subject,
    'https://diemdanh.cmdn/role', 'admin')::text, true);
  RETURN NEXT is(public.current_app_user_id(), active_id, 'temp users shadow cannot replace public identity');
  RETURN NEXT is(public.is_app_admin(), true, 'trusted admin resolves while caller remains authenticated');
  FOREACH table_name IN ARRAY business_tables LOOP
    IF table_name='audit_logs' THEN
      RETURN NEXT throws_ok('SELECT * FROM public.audit_logs', '42501', NULL,
        'trusted authenticated admin cannot directly read audit evidence');
    ELSE
      EXECUTE format('SELECT count(*) FROM public.%I WHERE id=ANY(%L::uuid[])',table_name,
        ARRAY[active_id,archived_id,db_admin_id,numeric_id,padded_id,uuid_subject_id,fixture_room_id])
        INTO scoped_count;
      RETURN NEXT is(scoped_count,CASE WHEN table_name IN('users','rooms') THEN 1::bigint ELSE 0::bigint END,
        'trusted authenticated admin gets only the expected current fixture SELECT scope for ' || table_name);
    END IF;
    RETURN NEXT throws_ok(format('INSERT INTO public.%I DEFAULT VALUES', table_name), '42501', NULL,
      'trusted authenticated admin cannot directly INSERT ' || table_name);
    RETURN NEXT throws_ok(format('UPDATE public.%I SET id=id', table_name), '42501', NULL,
      'trusted authenticated admin cannot directly UPDATE ' || table_name);
    RETURN NEXT throws_ok(format('DELETE FROM public.%I', table_name), '42501', NULL,
      'trusted authenticated admin cannot directly DELETE ' || table_name);
  END LOOP;
  RESET ROLE;
  UPDATE public.users SET status = 'soft_deleted', deleted_at = now() WHERE id = active_id;
  SET LOCAL ROLE authenticated;
  RETURN NEXT is(public.current_app_user_id(), NULL::uuid, 'active-to-archived transition removes identity');
  RETURN NEXT is(public.is_app_admin(), false, 'active-to-archived transition removes trusted admin');
  RESET ROLE;
  SET LOCAL ROLE anon;
  RETURN NEXT is(current_user::text, 'anon', 'anonymous denial executes as anon');
  RETURN NEXT throws_ok('SELECT public.current_app_user_id()', '42501', NULL, 'anon identity invocation denied');
  RETURN NEXT throws_ok('SELECT public.is_app_admin()', '42501', NULL, 'anon admin invocation denied');
  RETURN NEXT throws_ok('SELECT * FROM public.users', '42501', NULL, 'anon cannot directly read profiles');
  RESET ROLE;
  SET LOCAL search_path = public, extensions;
END $$;
SELECT pg_temp.assert_identity_behavior();
SELECT * FROM finish();
ROLLBACK;
