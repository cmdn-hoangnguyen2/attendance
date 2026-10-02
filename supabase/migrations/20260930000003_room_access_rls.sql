-- B2-M2B: bounded row access using the accepted active-identity helpers.
-- Synthetic SQL acceptance is separate from safe DTOs and issued-token runtime.
CREATE OR REPLACE FUNCTION public.can_manage_room(room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT public.current_app_user_id() IS NOT NULL
    AND EXISTS (
      SELECT FROM public.rooms AS room
      WHERE room.id = $1
        AND (room.owner_id = public.current_app_user_id() OR public.is_app_admin())
    );
$$;

CREATE OR REPLACE FUNCTION public.can_read_room(room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT public.current_app_user_id() IS NOT NULL
    AND EXISTS (
      SELECT FROM public.rooms AS room
      WHERE room.id = $1
        AND room.status = 'active'
        AND (
          public.can_manage_room(room.id)
          OR EXISTS (
            SELECT FROM public.room_memberships AS membership
            WHERE membership.room_id = room.id
              AND membership.user_id = public.current_app_user_id()
              AND membership.status = 'active'
          )
        )
    );
$$;

ALTER FUNCTION public.can_manage_room(uuid) OWNER TO postgres;
ALTER FUNCTION public.can_read_room(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_manage_room(uuid), public.can_read_room(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_room(uuid), public.can_read_room(uuid)
  TO authenticated, service_role;

-- Active room details and own lifecycle signal have separate read boundaries.
GRANT SELECT ON TABLE public.users, public.rooms, public.room_memberships,
  public.meeting_sessions, public.attendance_records, public.fund_candidates
  TO authenticated;

-- Own archived lifecycle remains observable; numeric/blank/coerced subjects do not.
CREATE POLICY users_read_own_lifecycle ON public.users
FOR SELECT TO authenticated
USING (
  jsonb_typeof(auth.jwt() -> 'sub') = 'string'
  AND btrim(auth.jwt() ->> 'sub',
    U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') <> ''
  AND auth0_subject = auth.jwt() ->> 'sub'
);

CREATE POLICY rooms_read_authorized_active ON public.rooms
FOR SELECT TO authenticated
USING (public.can_read_room(id));

CREATE POLICY room_memberships_read_authorized_active ON public.room_memberships
FOR SELECT TO authenticated
USING (public.can_read_room(room_id));

CREATE POLICY meeting_sessions_read_authorized_active ON public.meeting_sessions
FOR SELECT TO authenticated
USING (public.can_read_room(room_id));

CREATE POLICY attendance_records_read_authorized_active ON public.attendance_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT FROM public.meeting_sessions AS session
    WHERE session.id = attendance_records.meeting_session_id
      AND public.can_read_room(session.room_id)
  )
);

CREATE POLICY fund_candidates_read_authorized_active ON public.fund_candidates
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT FROM public.meeting_sessions AS session
    WHERE session.id = fund_candidates.meeting_session_id
      AND public.can_read_room(session.room_id)
  )
);

-- Request-specific predicate avoids exposing hidden room lifecycle to outsiders.
CREATE OR REPLACE FUNCTION public.can_read_join_request(request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT public.current_app_user_id() IS NOT NULL AND EXISTS (
    SELECT FROM public.join_requests AS request
    JOIN public.rooms AS room ON room.id = request.room_id
    WHERE request.id = $1 AND room.status = 'active'
      AND (request.requester_id = public.current_app_user_id()
        OR public.can_manage_room(room.id))
  );
$$;
ALTER FUNCTION public.can_read_join_request(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.can_read_join_request(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_join_request(uuid)
  TO authenticated, service_role;
GRANT SELECT ON TABLE public.join_requests TO authenticated;
CREATE POLICY join_requests_read_own_or_manager ON public.join_requests
FOR SELECT TO authenticated
USING (public.can_read_join_request(id));

-- Retained fund contribution/payment history uses financial SELECT only.
-- Room-detail/peer/QR DTO permissions are not implied by these fund rows.
GRANT SELECT ON TABLE public.fund_contributions, public.payments TO authenticated;

CREATE POLICY fund_contributions_read_scoped ON public.fund_contributions
FOR SELECT TO authenticated
USING (
  public.current_app_user_id() IS NOT NULL
  AND (
    contributor_id = public.current_app_user_id()
    OR public.can_manage_room(room_id)
    OR public.can_read_room(room_id)
  )
);

CREATE POLICY payments_read_scoped_contribution ON public.payments
FOR SELECT TO authenticated
USING (
  public.current_app_user_id() IS NOT NULL
  AND EXISTS (
    SELECT FROM public.fund_contributions AS contribution
    WHERE contribution.id = payments.contribution_id
  )
);

-- Personal debt/payment history is restricted to its actual parties.
-- Accepted 00002 binds current_app_user_id() to an active application user.
-- Financial-party history deliberately does not depend on room lifecycle/membership.
GRANT SELECT ON TABLE public.peer_debts, public.peer_payments,
  public.user_payment_images TO authenticated;

CREATE POLICY peer_debts_read_parties ON public.peer_debts
FOR SELECT TO authenticated
USING (
  (SELECT public.current_app_user_id()) IS NOT NULL
  AND (
    creditor_id = (SELECT public.current_app_user_id())
    OR debtor_id = (SELECT public.current_app_user_id())
  )
);

CREATE POLICY peer_payments_read_debt_parties ON public.peer_payments
FOR SELECT TO authenticated
USING (
  (SELECT public.current_app_user_id()) IS NOT NULL
  AND EXISTS (
    SELECT FROM public.peer_debts AS debt
    WHERE debt.id = peer_payments.peer_debt_id
      AND (
        debt.creditor_id = (SELECT public.current_app_user_id())
        OR debt.debtor_id = (SELECT public.current_app_user_id())
      )
  )
);

CREATE POLICY user_payment_images_read_own_or_party_creditor ON public.user_payment_images
FOR SELECT TO authenticated
USING (
  (SELECT public.current_app_user_id()) IS NOT NULL
  AND (
    user_id = (SELECT public.current_app_user_id())
    OR EXISTS (
      SELECT FROM public.peer_debts AS debt
      WHERE debt.creditor_id = user_payment_images.user_id
        AND (
          debt.creditor_id = (SELECT public.current_app_user_id())
          OR debt.debtor_id = (SELECT public.current_app_user_id())
        )
    )
  )
);

-- Active own notifications and active-room QR metadata have narrow read access.
GRANT SELECT ON TABLE public.app_notifications, public.room_payment_images TO authenticated;
GRANT UPDATE (is_read) ON TABLE public.app_notifications TO authenticated;

CREATE POLICY app_notifications_read_own_active ON public.app_notifications
FOR SELECT TO authenticated
USING (user_id = public.current_app_user_id());

CREATE POLICY app_notifications_update_own_read_state ON public.app_notifications
FOR UPDATE TO authenticated
USING (user_id = public.current_app_user_id())
WITH CHECK (user_id = public.current_app_user_id());

-- Raw archived QR metadata is deliberately deferred to a safe payment-info DTO.
CREATE POLICY room_payment_images_read_authorized_active ON public.room_payment_images
FOR SELECT TO authenticated
USING (public.can_read_room(room_id));
