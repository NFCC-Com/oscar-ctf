-- ==============================================
-- Table: public_chat_messages
-- ==============================================

CREATE TABLE IF NOT EXISTS public.public_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read messages (Select-only RLS)
DROP POLICY IF EXISTS "Allow public read access to chat messages" ON public.public_chat_messages;
CREATE POLICY "Allow public read access to chat messages"
  ON public.public_chat_messages
  FOR SELECT
  USING (true);

-- Drop other client-side write policies if they exist (we only use RPC functions for modifications)
DROP POLICY IF EXISTS "Allow authenticated insert of own chat messages" ON public.public_chat_messages;
DROP POLICY IF EXISTS "Allow users to delete their own chat messages" ON public.public_chat_messages;

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime DROP TABLE public.public_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_chat_messages;

-- Grant permissions to public roles (SELECT ONLY - no direct INSERT/UPDATE/DELETE)
GRANT SELECT ON public.public_chat_messages TO authenticated, anon;
GRANT ALL ON public.public_chat_messages TO service_role;


-- ==============================================
-- RPC Function: send_chat_message (SECURE INSERT)
-- ==============================================
DROP FUNCTION IF EXISTS public.send_chat_message(TEXT);

CREATE OR REPLACE FUNCTION public.send_chat_message(p_message TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_username VARCHAR(32);
  v_banned_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 1. Get current authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Silakan login terlebih dahulu';
  END IF;

  -- 2. Check if user profile exists and is active
  SELECT username, banned_until INTO v_username, v_banned_until
  FROM public.users
  WHERE id = v_user_id;

  IF v_username IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- 3. Check if user is banned
  IF v_banned_until IS NOT NULL AND v_banned_until > now() THEN
    RAISE EXCEPTION 'Akun Anda sedang ditangguhkan';
  END IF;

  -- 4. Enforce 3-minute rate limit per user (cooldown reduced to 3 minutes)
  IF EXISTS (
    SELECT 1 FROM public.public_chat_messages
    WHERE user_id = v_user_id
      AND created_at > (now() - INTERVAL '3 minutes')
  ) THEN
    RAISE EXCEPTION 'Rate limit: Anda hanya dapat mengirim pesan sekali setiap 3 menit';
  END IF;

  -- 5. Validate message
  IF p_message IS NULL OR trim(p_message) = '' THEN
    RAISE EXCEPTION 'Pesan tidak boleh kosong';
  END IF;

  IF length(p_message) > 500 THEN
    RAISE EXCEPTION 'Pesan terlalu panjang (maksimum 500 karakter)';
  END IF;

  -- Check for disallowed characters ({, }, $, %) to prevent flags leaks
  IF p_message ~ '[{}$%]' THEN
    RAISE EXCEPTION 'Karakter terlarang terdeteksi: {, }, $, %% tidak diperbolehkan';
  END IF;

  -- Check for URL links
  IF p_message ~* 'https?://|www\.|ftp://|\b[a-zA-Z0-9.-]+\.(com|net|org|io|gov|edu|xyz|co|id|me|info|biz)\b' THEN
    RAISE EXCEPTION 'Tautan URL atau link tidak diperbolehkan demi keamanan';
  END IF;

  -- 6. Insert securely (only user_id and message)
  INSERT INTO public.public_chat_messages (user_id, message)
  VALUES (v_user_id, trim(p_message));
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.send_chat_message(TEXT) TO authenticated;


-- ==============================================
-- RPC Function: delete_chat_message (SECURE DELETE)
-- ==============================================
DROP FUNCTION IF EXISTS public.delete_chat_message(UUID);

CREATE OR REPLACE FUNCTION public.delete_chat_message(p_message_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_message_owner_id UUID;
BEGIN
  -- 1. Get current authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Silakan login terlebih dahulu';
  END IF;

  -- 2. Fetch the owner of the message
  SELECT user_id INTO v_message_owner_id
  FROM public.public_chat_messages
  WHERE id = p_message_id;

  IF v_message_owner_id IS NULL THEN
    RAISE EXCEPTION 'Pesan tidak ditemukan';
  END IF;

  -- 3. Verify ownership or admin privileges (using is_admin() function)
  IF v_user_id = v_message_owner_id OR is_admin() THEN
    DELETE FROM public.public_chat_messages WHERE id = p_message_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: Anda tidak memiliki wewenang untuk menghapus pesan ini';
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_chat_message(UUID) TO authenticated;
