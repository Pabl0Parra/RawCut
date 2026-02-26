-- ============================================================
-- SOFT DELETE SYSTEM - COMPLETE RESET & SETUP
-- Run this entire script in Supabase SQL Editor.
-- It is fully idempotent - safe to run multiple times.
-- ============================================================

-- STEP 1: Add soft-delete columns (safe, idempotent)
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS sender_deleted   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS receiver_deleted  BOOLEAN NOT NULL DEFAULT FALSE;

-- STEP 2: Drop ALL existing policies on recommendations and comments (clean slate)
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN (
        SELECT policyname FROM pg_policies
        WHERE tablename = 'recommendations' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON recommendations', pol.policyname);
    END LOOP;

    FOR pol IN (
        SELECT policyname FROM pg_policies
        WHERE tablename = 'recommendation_comments' AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON recommendation_comments', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE recommendations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_comments ENABLE ROW LEVEL SECURITY;

-- STEP 3: Recreate RLS policies

-- Sender sees it unless they deleted it; receiver sees it unless they deleted it
CREATE POLICY "rls_rec_select" ON recommendations
  FOR SELECT USING (
    (auth.uid() = sender_id   AND sender_deleted   = FALSE) OR
    (auth.uid() = receiver_id AND receiver_deleted = FALSE)
  );

-- Only the sender can create
CREATE POLICY "rls_rec_insert" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Sender/receiver can update (e.g. mark as read).
-- Soft-delete uses the SECURITY DEFINER RPC below instead of this policy
-- to avoid the WITH CHECK conflict when the row becomes invisible post-update.
CREATE POLICY "rls_rec_update" ON recommendations
  FOR UPDATE
  USING  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Comments: insert if party of the recommendation
CREATE POLICY "rls_comment_insert" ON recommendation_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

-- Comments: select if party of the recommendation
CREATE POLICY "rls_comment_select" ON recommendation_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

-- Comments: delete own only
CREATE POLICY "rls_comment_delete" ON recommendation_comments
  FOR DELETE USING (auth.uid() = user_id);

-- STEP 4: Create / replace the soft-delete RPC (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION soft_delete_recommendation(p_recommendation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id   UUID;
  v_receiver_id UUID;
  v_caller      UUID := auth.uid();
BEGIN
  SELECT sender_id, receiver_id
  INTO   v_sender_id, v_receiver_id
  FROM   recommendations
  WHERE  id = p_recommendation_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF v_caller = v_sender_id THEN
    UPDATE recommendations SET sender_deleted   = TRUE WHERE id = p_recommendation_id;
    RETURN TRUE;
  ELSIF v_caller = v_receiver_id THEN
    UPDATE recommendations SET receiver_deleted = TRUE WHERE id = p_recommendation_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;  -- caller is neither sender nor receiver
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_recommendation(UUID) TO authenticated;

-- ============================================================
-- Done. Verify with:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'recommendations'
--   AND column_name IN ('sender_deleted', 'receiver_deleted');
--
--   SELECT policyname FROM pg_policies WHERE tablename = 'recommendations';
-- ============================================================
