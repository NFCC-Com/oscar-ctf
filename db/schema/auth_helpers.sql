-- ==============================================
-- Authorization helpers
-- Must be defined before schema policies use them.
-- ==============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_user_id UUID := auth.uid()::uuid;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_user_id;
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
