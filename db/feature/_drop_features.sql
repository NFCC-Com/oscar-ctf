-- ==============================================
-- Section: public_chat_messages (Community Chat)
-- ==============================================

-- 1. Remove table from replication publication first
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.public_chat_messages;

-- 2. Drop RPC functions
DROP FUNCTION IF EXISTS public.send_chat_message(TEXT);
DROP FUNCTION IF EXISTS public.delete_chat_message(UUID);

-- 3. Drop Table
DROP TABLE IF EXISTS public.public_chat_messages;
