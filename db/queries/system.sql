-- ==============================================
-- Queries: system/common
-- Source: sql/chema.sql
-- ==============================================

REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

REVOKE UPDATE ON public.users FROM authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.events TO authenticated;
GRANT SELECT ON public.challenges TO authenticated;
GRANT SELECT ON public.solves TO authenticated;
GRANT SELECT ON public.event_admins TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_logs(INT, INT, UUID, TEXT) TO anon;
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT ON public.events TO anon;

CREATE OR REPLACE FUNCTION public.get_auth_audit_logs(
  p_limit int default 50,
  p_offset int default 0,
  p_action_filters text[] default null
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  ip_address text,
  payload jsonb,
  user_id uuid,
  username text,
  email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only global admin can view audit logs';
  END IF;

  RETURN QUERY
  WITH audit_rows AS (
    SELECT
      ale.id,
      ale.created_at,
      ale.ip_address::text AS ip_address,
      ale.payload::jsonb AS payload,
      NULLIF(COALESCE(
        ale.payload->>'actor_id',
        ale.payload->>'user_id',
        ale.payload->'traits'->>'user_id'
      ), '') AS payload_user_id,
      NULLIF(COALESCE(
        ale.payload->'traits'->>'user_email',
        ale.payload->>'actor_username',
        ale.payload->>'email'
      ), '') AS payload_email
    FROM auth.audit_log_entries ale
    WHERE (p_action_filters IS NULL OR ale.payload->>'action' = ANY(p_action_filters))
  )
  SELECT
    ar.id,
    ar.created_at,
    ar.ip_address,
    ar.payload,
    au.id,
    u.username::text,
    au.email::text
  FROM audit_rows ar
  LEFT JOIN auth.users au
    ON (
      ar.payload_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND au.id = ar.payload_user_id::uuid
    )
    OR (
      ar.payload_email IS NOT NULL
      AND lower(au.email) = lower(ar.payload_email)
    )
  LEFT JOIN public.users u ON u.id = au.id
  ORDER BY ar.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

grant execute on function public.get_auth_audit_logs(int, int, text[]) to authenticated;

CREATE OR REPLACE FUNCTION public.get_flag_placeholder(p_flag TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_result TEXT := '';
    v_char TEXT;
    i INT;
BEGIN
    IF p_flag IS NULL THEN RETURN NULL; END IF;

    FOR i IN 1..length(p_flag) LOOP
        v_char := substr(p_flag, i, 1);
        IF v_char ~ '[a-z]' THEN
            v_result := v_result || 'x';
        ELSIF v_char ~ '[A-Z]' THEN
            v_result := v_result || 'X';
        ELSIF v_char ~ '[0-9]' THEN
            v_result := v_result || '0';
        ELSIF v_char = '_' THEN
            v_result := v_result || '_';
        ELSIF v_char = '{' THEN
            v_result := v_result || '{';
        ELSIF v_char = '}' THEN
            v_result := v_result || '}';
        ELSE
            v_result := v_result || '?';
        END IF;
    END LOOP;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_flag_placeholder(TEXT) TO authenticated;
