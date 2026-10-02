-- B2-M2B synthetic JWT/SQL acceptance only; signed-token runtime is a later gate.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT no_plan();
SELECT has_function('public','can_manage_room',ARRAY['uuid'],'room manager helper exists');
SELECT has_function('public','can_read_room',ARRAY['uuid'],'room detail helper exists');
SELECT has_function('public','can_read_join_request',ARRAY['uuid'],'request-scoped helper exists');

-- Pin both the complete policy surface and its actual role targets.
SELECT is(ARRAY(SELECT tablename || ':' || policyname || ':' || cmd
  FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname,cmd),
  ARRAY(SELECT table_name || ':' || policy_name || ':' || command FROM (VALUES
    ('users','users_read_own_lifecycle','SELECT'),
    ('rooms','rooms_read_authorized_active','SELECT'),
    ('room_memberships','room_memberships_read_authorized_active','SELECT'),
    ('meeting_sessions','meeting_sessions_read_authorized_active','SELECT'),
    ('attendance_records','attendance_records_read_authorized_active','SELECT'),
    ('fund_candidates','fund_candidates_read_authorized_active','SELECT'),
    ('join_requests','join_requests_read_own_or_manager','SELECT'),
    ('fund_contributions','fund_contributions_read_scoped','SELECT'),
    ('payments','payments_read_scoped_contribution','SELECT'),
    ('peer_debts','peer_debts_read_parties','SELECT'),
    ('peer_payments','peer_payments_read_debt_parties','SELECT'),
    ('user_payment_images','user_payment_images_read_own_or_party_creditor','SELECT'),
    ('app_notifications','app_notifications_read_own_active','SELECT'),
    ('app_notifications','app_notifications_update_own_read_state','UPDATE'),
    ('room_payment_images','room_payment_images_read_authorized_active','SELECT')
  ) approved(table_name,policy_name,command) ORDER BY table_name,policy_name,command),
  'only the approved B2 read policies and notification mutation exist');
SELECT is(roles,ARRAY['authenticated']::name[],policyname || ' targets authenticated only')
FROM pg_policies WHERE schemaname='public';

-- SQL executes under the actual caller. Baseline missing grants become TAP RED,
-- rather than aborting the transaction before the rest of the matrix can run.
CREATE FUNCTION pg_temp.expect_rows(query text, expected uuid[], label text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE actual uuid[];
BEGIN
  EXECUTE 'SELECT coalesce(array_agg(id ORDER BY id), ARRAY[]::uuid[]) FROM (' || query || ') AS actual_rows' INTO actual;
  RETURN is(actual, ARRAY(SELECT item FROM unnest(expected) item ORDER BY item), label);
EXCEPTION WHEN OTHERS THEN
  RETURN fail(label || ': unexpected SQLSTATE ' || SQLSTATE);
END $$;

CREATE FUNCTION pg_temp.assert_room_access() RETURNS SETOF text
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  owner_id uuid := gen_random_uuid(); member_id uuid := gen_random_uuid();
  outsider_id uuid := gen_random_uuid(); admin_id uuid := gen_random_uuid();
  removed_id uuid := gen_random_uuid(); left_id uuid := gen_random_uuid();
  archived_id uuid := gen_random_uuid(); db_admin_id uuid := gen_random_uuid();
  public_room uuid := gen_random_uuid(); private_room uuid := gen_random_uuid();
  channel_room uuid := gen_random_uuid(); archived_room uuid := gen_random_uuid();
  other_room uuid := gen_random_uuid(); session_id uuid := gen_random_uuid();
  archived_session uuid := gen_random_uuid(); attendance_id uuid := gen_random_uuid();
  candidate_id uuid := gen_random_uuid(); member_contribution uuid := gen_random_uuid();
  removed_contribution uuid := gen_random_uuid(); left_contribution uuid := gen_random_uuid();
  archived_contribution uuid := gen_random_uuid(); other_contribution uuid := gen_random_uuid();
  member_payment uuid := gen_random_uuid(); archived_payment uuid := gen_random_uuid();
  member_request uuid := gen_random_uuid(); outsider_request uuid := gen_random_uuid();
  archived_request uuid := gen_random_uuid(); archived_actor_request uuid := gen_random_uuid();
  notification_id uuid := gen_random_uuid(); other_notification uuid := gen_random_uuid();
  room_qr uuid := gen_random_uuid(); archived_qr uuid := gen_random_uuid();
  member_debt uuid := gen_random_uuid(); owner_debt uuid := gen_random_uuid();
  member_peer_payment uuid := gen_random_uuid(); owner_peer_payment uuid := gen_random_uuid();
  member_qr uuid := gen_random_uuid(); removed_qr uuid := gen_random_uuid(); owner_qr uuid := gen_random_uuid();
  membership_id uuid := gen_random_uuid(); removed_membership uuid := gen_random_uuid();
  left_membership uuid := gen_random_uuid(); archived_membership uuid := gen_random_uuid();
  channel_membership uuid := gen_random_uuid(); archived_user_membership uuid := gen_random_uuid();
  archived_notification uuid := gen_random_uuid();
  fixture record; helper record; function_record record; table_name text;
  fixture_ids uuid[]; expected uuid[]; claim jsonb;
  subject_prefix text := 'auth0|m2b-' || gen_random_uuid() || '-';
  business_tables text[] := ARRAY['users','rooms','room_memberships','join_requests',
    'meeting_sessions','attendance_records','fund_candidates','fund_contributions',
    'payments','room_payment_images','audit_logs','app_notifications',
    'peer_debts','peer_payments','user_payment_images'];
BEGIN
  FOR helper IN SELECT * FROM (VALUES ('can_manage_room'),('can_read_room'),
    ('can_read_join_request')) helpers(name) LOOP
    SELECT p.* INTO function_record FROM pg_proc p
      WHERE p.oid = to_regprocedure('public.' || helper.name || '(uuid)');
    RETURN NEXT is(function_record.prorettype::regtype::text, 'boolean', helper.name || ' returns boolean');
    RETURN NEXT is(function_record.provolatile::text, 's', helper.name || ' is STABLE');
    RETURN NEXT is(function_record.prosecdef, true, helper.name || ' uses bounded SECURITY DEFINER lookup');
    RETURN NEXT is(pg_get_userbyid(function_record.proowner), 'postgres', helper.name || ' owner is postgres');
    RETURN NEXT is(array_to_string(function_record.proconfig,';'), 'search_path=pg_catalog, pg_temp',
      helper.name || ' fixes search_path');
    IF function_record.oid IS NULL THEN
      RETURN NEXT fail(helper.name || ' missing for ACL and behavior');
      CONTINUE;
    END IF;
    RETURN NEXT ok(NOT EXISTS (SELECT FROM aclexplode(coalesce(function_record.proacl,
      acldefault('f',function_record.proowner))) acl WHERE acl.privilege_type='EXECUTE'
      AND (acl.grantee=0 OR acl.grantee NOT IN(function_record.proowner,
        'authenticated'::regrole::oid,'service_role'::regrole::oid)
        OR (acl.grantee<>function_record.proowner AND acl.is_grantable))),
      helper.name || ' exposes only narrow nondelegated EXECUTE');
    RETURN NEXT ok(NOT has_function_privilege('anon',function_record.oid,'EXECUTE'),helper.name || ' denies anon');
    RETURN NEXT ok(has_function_privilege('authenticated',function_record.oid,'EXECUTE'),helper.name || ' allows authenticated');
    RETURN NEXT ok(has_function_privilege('service_role',function_record.oid,'EXECUTE'),helper.name || ' allows service_role');
  END LOOP;

  INSERT INTO public.users(id,auth0_subject,email,display_name,role,status) VALUES
    (owner_id,subject_prefix||'owner','m2b-owner@test.invalid','M2B Owner','user','active'),
    (member_id,subject_prefix||'member','m2b-member@test.invalid','M2B Member','user','active'),
    (outsider_id,subject_prefix||'outsider','m2b-outsider@test.invalid','M2B Outsider','user','active'),
    (admin_id,subject_prefix||'admin','m2b-admin@test.invalid','M2B Admin','user','active'),
    (removed_id,subject_prefix||'removed','m2b-removed@test.invalid','M2B Removed','user','active'),
    (left_id,subject_prefix||'left','m2b-left@test.invalid','M2B Left','user','active'),
    (archived_id,subject_prefix||'archived','m2b-archived@test.invalid','M2B Archived','user','soft_deleted'),
    (db_admin_id,subject_prefix||'dbadmin','m2b-dbadmin@test.invalid','M2B DB Admin','admin','active');
  INSERT INTO public.rooms(id,name,owner_id,visibility,type,status) VALUES
    (public_room,'M2B Public',owner_id,'public','meeting','active'),
    (private_room,'M2B Private',owner_id,'private','meeting','active'),
    (channel_room,'M2B Channel',owner_id,'private','channel','active'),
    (archived_room,'M2B Archive',owner_id,'private','meeting','archived'),
    (other_room,'M2B Other',outsider_id,'private','meeting','active');
  INSERT INTO public.room_memberships(id,room_id,user_id,status) VALUES
    (membership_id,private_room,member_id,'active'),
    (removed_membership,private_room,removed_id,'removed'),
    (left_membership,private_room,left_id,'left'),
    (archived_membership,archived_room,member_id,'active');
  INSERT INTO public.room_memberships(id,room_id,user_id,status) VALUES
    (channel_membership,channel_room,member_id,'active'),(archived_user_membership,private_room,archived_id,'active');
  INSERT INTO public.meeting_sessions(id,room_id,title,starts_at,attendance_deadline,closes_at) VALUES
    (session_id,private_room,'M2B Active',now(),now(),now()),
    (archived_session,archived_room,'M2B Archived',now(),now(),now());
  INSERT INTO public.attendance_records(id,meeting_session_id,user_id,status,changed_by)
    VALUES(attendance_id,session_id,member_id,'present',owner_id);
  INSERT INTO public.fund_candidates(id,meeting_session_id,user_id,suggested_amount)
    VALUES(candidate_id,session_id,member_id,50000);
  INSERT INTO public.fund_contributions(id,room_id,contributor_id,amount,reason,created_by) VALUES
    (member_contribution,private_room,member_id,50000,'Đi trễ',owner_id),
    (removed_contribution,private_room,removed_id,50000,'Đi trễ',owner_id),
    (left_contribution,private_room,left_id,50000,'Đi trễ',owner_id),
    (archived_contribution,archived_room,member_id,50000,'Đi trễ',owner_id),
    (other_contribution,other_room,outsider_id,50000,'Đi trễ',outsider_id);
  INSERT INTO public.payments(id,contribution_id,amount,confirmed_by) VALUES
    (member_payment,member_contribution,50000,owner_id),
    (archived_payment,archived_contribution,50000,owner_id);
  INSERT INTO public.join_requests(id,room_id,requester_id) VALUES
    (member_request,private_room,member_id),(outsider_request,private_room,outsider_id),
    (archived_request,archived_room,member_id),(archived_actor_request,private_room,archived_id);
  INSERT INTO public.app_notifications(id,user_id,title,content) VALUES
    (notification_id,member_id,'M2B Own','Own content'),(other_notification,outsider_id,'M2B Other','Other content'),
    (archived_notification,archived_id,'M2B Archived','Archived content');
  INSERT INTO public.room_payment_images(id,room_id,storage_path,mime_type,file_size,uploaded_by) VALUES
    (room_qr,private_room,'m2b/private.png','image/png',1,owner_id),
    (archived_qr,archived_room,'m2b/archived.png','image/png',1,owner_id);
  INSERT INTO public.peer_debts(id,room_id,creditor_id,debtor_id,amount) VALUES
    (member_debt,channel_room,removed_id,member_id,50000),
    (owner_debt,channel_room,owner_id,left_id,50000);
  INSERT INTO public.peer_payments(id,peer_debt_id,amount,confirmed_by) VALUES
    (member_peer_payment,member_debt,50000,removed_id),(owner_peer_payment,owner_debt,50000,owner_id);
  INSERT INTO public.user_payment_images(id,user_id,storage_path,mime_type,file_size) VALUES
    (member_qr,member_id,'m2b/member.png','image/png',1),
    (removed_qr,removed_id,'m2b/removed.png','image/png',1),
    (owner_qr,owner_id,'m2b/owner.png','image/png',1);

  fixture_ids := ARRAY[owner_id,member_id,outsider_id,admin_id,removed_id,left_id,archived_id,db_admin_id,
    public_room,private_room,channel_room,archived_room,other_room,session_id,archived_session,
    attendance_id,candidate_id,member_contribution,removed_contribution,left_contribution,archived_contribution,
    other_contribution,member_payment,archived_payment,member_request,outsider_request,archived_request,
    archived_actor_request,notification_id,
    other_notification,room_qr,archived_qr,member_debt,owner_debt,member_peer_payment,owner_peer_payment,
    member_qr,removed_qr,owner_qr,membership_id,removed_membership,left_membership,archived_membership,
    channel_membership,archived_user_membership,archived_notification];
  PERFORM set_config('request.jwt.claim','',true);
  FOR fixture IN SELECT * FROM (VALUES
    ('owner',owner_id,false,jsonb_build_object('rooms',ARRAY[public_room,private_room,channel_room],
      'room_memberships',ARRAY[membership_id,removed_membership,left_membership,channel_membership,archived_user_membership],
      'meeting_sessions',ARRAY[session_id],'attendance_records',ARRAY[attendance_id],
      'fund_candidates',ARRAY[candidate_id],
      'fund_contributions',ARRAY[member_contribution,removed_contribution,left_contribution,archived_contribution],
      'payments',ARRAY[member_payment,archived_payment],'join_requests',ARRAY[member_request,outsider_request,archived_actor_request],
      'room_payment_images',ARRAY[room_qr],'peer_debts',ARRAY[owner_debt],
      'peer_payments',ARRAY[owner_peer_payment],'user_payment_images',ARRAY[owner_qr])),
    ('member',member_id,false,jsonb_build_object('rooms',ARRAY[private_room,channel_room],
      'room_memberships',ARRAY[membership_id,removed_membership,left_membership,channel_membership,archived_user_membership],
      'meeting_sessions',ARRAY[session_id],'attendance_records',ARRAY[attendance_id],
      'fund_candidates',ARRAY[candidate_id],'fund_contributions',ARRAY[member_contribution,removed_contribution,left_contribution,archived_contribution],
      'payments',ARRAY[member_payment,archived_payment],'join_requests',ARRAY[member_request],
      'room_payment_images',ARRAY[room_qr],'app_notifications',ARRAY[notification_id],
      'peer_debts',ARRAY[member_debt],'peer_payments',ARRAY[member_peer_payment],
      'user_payment_images',ARRAY[member_qr,removed_qr])),
    ('outsider',outsider_id,false,jsonb_build_object('rooms',ARRAY[other_room],
      'fund_contributions',ARRAY[other_contribution],'join_requests',ARRAY[outsider_request],
      'app_notifications',ARRAY[other_notification])),
    ('admin',admin_id,true,jsonb_build_object('rooms',ARRAY[public_room,private_room,channel_room,other_room],
      'room_memberships',ARRAY[membership_id,removed_membership,left_membership,channel_membership,archived_user_membership],
      'meeting_sessions',ARRAY[session_id],'attendance_records',ARRAY[attendance_id],
      'fund_candidates',ARRAY[candidate_id],
      'fund_contributions',ARRAY[member_contribution,removed_contribution,left_contribution,archived_contribution,other_contribution],
      'payments',ARRAY[member_payment,archived_payment],'join_requests',ARRAY[member_request,outsider_request,archived_actor_request],
      'room_payment_images',ARRAY[room_qr])),
    ('removed',removed_id,false,jsonb_build_object('fund_contributions',ARRAY[removed_contribution],
      'peer_debts',ARRAY[member_debt],'peer_payments',ARRAY[member_peer_payment],
      'user_payment_images',ARRAY[removed_qr])),
    ('left',left_id,false,jsonb_build_object('fund_contributions',ARRAY[left_contribution],
      'peer_debts',ARRAY[owner_debt],'peer_payments',ARRAY[owner_peer_payment],
      'user_payment_images',ARRAY[owner_qr])),
    ('archived',archived_id,true,'{}'::jsonb),
    ('dbadmin',db_admin_id,false,'{}'::jsonb)
  ) AS cases(label,actor_id,admin,expected_rows)
  LOOP
    claim := jsonb_build_object('sub',subject_prefix||fixture.label,'role','authenticated');
    IF fixture.admin THEN claim := claim || jsonb_build_object('https://diemdanh.cmdn/role','admin'); END IF;
    PERFORM set_config('request.jwt.claims',claim::text,true);
    SET LOCAL ROLE authenticated;
    RETURN NEXT is(current_user::text,'authenticated',fixture.label||' runs actual authenticated role');
    IF to_regprocedure('public.can_read_join_request(uuid)') IS NOT NULL THEN
      RETURN NEXT is(public.can_read_join_request(member_request),fixture.label IN('owner','member','admin'),
        fixture.label||' reads active request only as requester or manager');
      RETURN NEXT is(public.can_read_join_request(outsider_request),fixture.label IN('owner','outsider','admin'),
        fixture.label||' outsider own request does not require room detail access');
      RETURN NEXT is(public.can_read_join_request(archived_actor_request),fixture.label IN('owner','admin'),
        fixture.label||' archived requester has no request authority');
      RETURN NEXT is(public.can_read_join_request(archived_request),false,
        fixture.label||' archived room request denied even to requester or manager');
      RETURN NEXT is(public.can_read_join_request(NULL),false,fixture.label||' NULL request denied');
      RETURN NEXT is(public.can_read_join_request(gen_random_uuid()),false,fixture.label||' nonexistent request denied');
    END IF;
    FOREACH table_name IN ARRAY business_tables LOOP
      expected := ARRAY(SELECT value::uuid FROM jsonb_array_elements_text(coalesce(
        fixture.expected_rows -> table_name,'[]'::jsonb)));
      IF table_name='users' THEN expected:=ARRAY[fixture.actor_id]; END IF;
      -- audit_logs has no browser grant and is tested separately as denied.
      IF table_name='audit_logs' THEN
        RETURN NEXT throws_ok('SELECT * FROM public.audit_logs','42501',NULL,fixture.label||' cannot read audit logs');
      ELSE
        RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.%I WHERE id=ANY(%L::uuid[])',
          table_name,fixture_ids),expected,fixture.label||' sees exact scoped '||table_name);
      END IF;
      RETURN NEXT throws_ok(format('INSERT INTO public.%I DEFAULT VALUES',table_name),'42501',NULL,
        fixture.label||' cannot INSERT '||table_name);
      IF table_name<>'app_notifications' THEN
        RETURN NEXT throws_ok(format('UPDATE public.%I SET id=id WHERE id=ANY(%L::uuid[])',
          table_name,fixture_ids),'42501',NULL,fixture.label||' cannot UPDATE '||table_name);
      END IF;
      RETURN NEXT throws_ok(format('DELETE FROM public.%I WHERE id=ANY(%L::uuid[])',table_name,fixture_ids),
        '42501',NULL,fixture.label||' cannot DELETE '||table_name);
    END LOOP;
    IF to_regprocedure('public.can_read_room(uuid)') IS NOT NULL
      AND to_regprocedure('public.can_manage_room(uuid)') IS NOT NULL THEN
      RETURN NEXT is(public.can_read_room(private_room),fixture.label IN('owner','member','admin'),
        fixture.label||' detail helper private room');
      RETURN NEXT is(public.can_read_room(public_room),fixture.label IN('owner','admin'),
        fixture.label||' public visibility does not authorize detail');
      RETURN NEXT is(public.can_read_room(archived_room),false,fixture.label||' archived detail denied');
      RETURN NEXT is(public.can_manage_room(private_room),fixture.label IN('owner','admin'),
        fixture.label||' room management helper');
      RETURN NEXT is(public.can_manage_room(archived_room),fixture.label IN('owner','admin'),
        fixture.label||' archived manager only for narrow funds policies');
      RETURN NEXT is(public.can_read_room(NULL),false,fixture.label||' NULL room denied');
      RETURN NEXT is(public.can_manage_room(gen_random_uuid()),false,fixture.label||' nonexistent room denied');
    END IF;
    RETURN NEXT throws_ok(format('UPDATE public.app_notifications SET title=''changed'' WHERE id=%L',notification_id),
      '42501',NULL,fixture.label||' cannot update notification title');
    RETURN NEXT throws_ok(format('UPDATE public.app_notifications SET content=''changed'' WHERE id=%L',notification_id),
      '42501',NULL,fixture.label||' cannot update notification content');
    RETURN NEXT throws_ok(format('UPDATE public.app_notifications SET user_id=%L WHERE id=%L',fixture.actor_id,notification_id),
      '42501',NULL,fixture.label||' cannot retarget notification');
    IF fixture.label='member' THEN
      RETURN NEXT lives_ok(format('UPDATE public.app_notifications SET is_read=true WHERE id=%L',notification_id),
        'recipient can set own notification read state');
      RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.app_notifications WHERE id=%L AND is_read',notification_id),
        ARRAY[notification_id],'own notification read state actually persisted');
      RETURN NEXT lives_ok(format('UPDATE public.app_notifications SET is_read=true WHERE id=%L',other_notification),
        'foreign notification update affects no visible row');
    END IF;
    IF fixture.label='archived' THEN
      RETURN NEXT lives_ok(format('UPDATE public.app_notifications SET is_read=true WHERE id=%L',archived_notification),
        'archived recipient cannot match notification update policy');
    END IF;
    RESET ROLE;
  END LOOP;
  RETURN NEXT is((SELECT is_read FROM public.app_notifications WHERE id=archived_notification),false,
    'archived own-profile signal grants no notification mutation');
  RETURN NEXT is((SELECT is_read FROM public.app_notifications WHERE id=other_notification),false,
    'nonrecipient could not update the foreign notification');
  RETURN NEXT ok(NOT has_table_privilege('authenticated','public.app_notifications','UPDATE'),
    'notifications have no table-wide UPDATE grant');
  RETURN NEXT ok(has_column_privilege('authenticated','public.app_notifications','is_read','UPDATE'),
    'notifications grant is_read UPDATE');
  RETURN NEXT ok(NOT has_column_privilege('authenticated','public.app_notifications','user_id','UPDATE')
    AND NOT has_column_privilege('authenticated','public.app_notifications','title','UPDATE')
    AND NOT has_column_privilege('authenticated','public.app_notifications','content','UPDATE'),
    'notification recipient/content columns deny UPDATE');

  FOR fixture IN SELECT * FROM (VALUES
    ('missing','{}'::jsonb),('forged',jsonb_build_object('sub',owner_id::text,'https://diemdanh.cmdn/role','admin')),
    ('wrong type','{"sub":123,"https://diemdanh.cmdn/role":"admin"}'::jsonb),
    ('unknown subject',jsonb_build_object('sub',subject_prefix||'nonexistent','https://diemdanh.cmdn/role','admin')),
    ('blank','{"sub":" ","role":"authenticated"}'::jsonb)) cases(label,claims)
  LOOP
    PERFORM set_config('request.jwt.claims',fixture.claims::text,true);
    SET LOCAL ROLE authenticated;
    RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.users WHERE id=ANY(%L::uuid[])',fixture_ids),
      ARRAY[]::uuid[],fixture.label||' cannot obtain profile rows');
    RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.rooms WHERE id=ANY(%L::uuid[])',fixture_ids),
      ARRAY[]::uuid[],fixture.label||' cannot obtain rooms');
    IF to_regprocedure('public.can_read_room(uuid)') IS NOT NULL THEN
      RETURN NEXT is(public.can_read_room(private_room),false,fixture.label||' cannot read helper');
      RETURN NEXT is(public.can_manage_room(private_room),false,fixture.label||' cannot manage helper');
    END IF;
    RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.join_requests WHERE id=ANY(%L::uuid[])',fixture_ids),
      ARRAY[]::uuid[],fixture.label||' cannot obtain join requests');
    IF to_regprocedure('public.can_read_join_request(uuid)') IS NOT NULL THEN
      RETURN NEXT is(public.can_read_join_request(member_request),false,fixture.label||' cannot read request helper');
    END IF;
    RESET ROLE;
  END LOOP;
  -- Archive only the transaction-owned member fixture. Own status stays visible;
  -- all room, fund, peer and QR authority must disappear immediately.
  UPDATE public.users SET status='soft_deleted',deleted_at=now() WHERE id=member_id;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',subject_prefix||'member')::text,true);
  SET LOCAL ROLE authenticated;
  RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.users WHERE id=%L AND status=''soft_deleted''',member_id),
    ARRAY[member_id],'newly archived user keeps only subject-bound lifecycle signal');
  FOREACH table_name IN ARRAY ARRAY['rooms','room_memberships','join_requests','meeting_sessions','fund_contributions',
    'payments','peer_debts','peer_payments','room_payment_images','user_payment_images','app_notifications'] LOOP
    RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.%I WHERE id=ANY(%L::uuid[])',table_name,fixture_ids),
      ARRAY[]::uuid[],'newly archived user loses '||table_name);
  END LOOP;
  IF to_regprocedure('public.can_read_join_request(uuid)') IS NOT NULL THEN
    RETURN NEXT is(public.can_read_join_request(member_request),false,'archiving active requester immediately denies request helper');
  END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims','{malformed',true);
  SET LOCAL ROLE authenticated;
  IF to_regprocedure('public.can_read_room(uuid)') IS NOT NULL THEN
    RETURN NEXT throws_ok(format('SELECT public.can_read_room(%L)',private_room),'22P02',NULL,
      'malformed full JWT fails closed');
  END IF;
  IF to_regprocedure('public.can_read_join_request(uuid)') IS NOT NULL THEN
    RETURN NEXT throws_ok(format('SELECT public.can_read_join_request(%L)',member_request),'22P02',NULL,
      'malformed full JWT request lookup fails closed');
  END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claims','{}',true);
  SET LOCAL ROLE anon;
  FOREACH table_name IN ARRAY business_tables LOOP
    RETURN NEXT throws_ok(format('SELECT * FROM public.%I',table_name),'42501',NULL,'anon SELECT denied '||table_name);
  END LOOP;
  IF to_regprocedure('public.can_read_room(uuid)') IS NOT NULL THEN
    RETURN NEXT throws_ok(format('SELECT public.can_read_room(%L)',private_room),'42501',NULL,'anon helper EXECUTE denied');
    RETURN NEXT throws_ok(format('SELECT public.can_manage_room(%L)',private_room),'42501',NULL,'anon manager EXECUTE denied');
  END IF;
  IF to_regprocedure('public.can_read_join_request(uuid)') IS NOT NULL THEN
    RETURN NEXT throws_ok(format('SELECT public.can_read_join_request(%L)',member_request),'42501',NULL,'anon request helper EXECUTE denied');
  END IF;
  RESET ROLE;
  SET LOCAL ROLE service_role;
  RETURN NEXT pg_temp.expect_rows(format('SELECT id FROM public.rooms WHERE id=ANY(%L::uuid[])',fixture_ids),
    ARRAY[public_room,private_room,channel_room,archived_room,other_room],'service_role retains all scoped fixture rooms');
  RETURN NEXT lives_ok(format('UPDATE public.rooms SET name=''M2B server changed'' WHERE id=%L',public_room),
    'service_role retains business update');
  RESET ROLE;
END $$;
SELECT pg_temp.assert_room_access();
SELECT * FROM finish();
ROLLBACK;
