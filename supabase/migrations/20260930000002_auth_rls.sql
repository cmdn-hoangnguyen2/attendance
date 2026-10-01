-- B2-M1: map trusted JWT identity without expanding business-table access.
-- Later milestones introduce room/read policies and privileged commands.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT application_user.id
  FROM public.users AS application_user
  CROSS JOIN (SELECT auth.jwt() AS jwt) AS claims
  WHERE jsonb_typeof(claims.jwt -> 'sub') = 'string'
    -- ECMAScript trim whitespace: validation only; the lookup keeps the exact sub.
    AND btrim(claims.jwt ->> 'sub',
      U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') <> ''
    AND application_user.auth0_subject = claims.jwt ->> 'sub'
    AND application_user.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT public.current_app_user_id() IS NOT NULL
    AND coalesce(
      claims.jwt -> 'https://diemdanh.cmdn/role' = '"admin"'::jsonb
      OR CASE
        WHEN jsonb_typeof(claims.jwt -> 'https://diemdanh.cmdn/roles') = 'array'
          THEN (claims.jwt -> 'https://diemdanh.cmdn/roles') ? 'admin'
        ELSE false
      END
      OR CASE
        WHEN jsonb_typeof(claims.jwt -> 'https://diemdanh.cmdn/permissions') = 'array'
          THEN (claims.jwt -> 'https://diemdanh.cmdn/permissions') ? 'admin'
        ELSE false
      END,
      false
    )
  FROM (SELECT auth.jwt() AS jwt) AS claims;
$$;

ALTER FUNCTION public.current_app_user_id() OWNER TO postgres;
ALTER FUNCTION public.is_app_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_app_user_id(), public.is_app_admin()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_app_user_id(), public.is_app_admin()
  TO authenticated, service_role;
