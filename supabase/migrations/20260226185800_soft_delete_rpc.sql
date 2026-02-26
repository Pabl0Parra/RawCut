-- ============================================================
-- Soft-delete recommendation via SECURITY DEFINER RPC
-- This bypasses RLS entirely and handles auth checks in SQL,
-- which is the reliable way to do row updates that affect
-- the row's own visibility under the SELECT policy.
-- ============================================================

-- First, ensure the soft-delete columns exist (idempotent)
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS sender_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS receiver_deleted BOOLEAN DEFAULT FALSE;

-- Drop previous policies and replace with clean versions
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'recommendations' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY %I ON recommendations', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- SELECT: show to sender (unless sender_deleted) OR receiver (unless receiver_deleted)
CREATE POLICY "View own recommendations" ON recommendations
  FOR SELECT USING (
    (auth.uid() = sender_id AND sender_deleted = FALSE) OR
    (auth.uid() = receiver_id AND receiver_deleted = FALSE)
  );

-- INSERT: only the sender can create
CREATE POLICY "Create recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- UPDATE: allow sender/receiver to update (e.g. mark as read)
-- Note: WITH CHECK must match USING to avoid post-update visibility issues.
-- Soft-delete uses the RPC below (SECURITY DEFINER) to avoid this complexity.
CREATE POLICY "Update own recommendations" ON recommendations
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================================
-- RPC: soft_delete_recommendation
-- Called by the app to "delete" a recommendation for one side.
-- SECURITY DEFINER bypasses RLS so the update always succeeds
-- as long as the caller is the sender or receiver.
-- ============================================================
CREATE OR REPLACE FUNCTION soft_delete_recommendation(p_recommendation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_id UUID;
    v_receiver_id UUID;
    v_caller UUID := auth.uid();
BEGIN
    -- Fetch the recommendation
    SELECT sender_id, receiver_id
    INTO v_sender_id, v_receiver_id
    FROM recommendations
    WHERE id = p_recommendation_id;

    -- Not found
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Only sender or receiver may soft-delete
    IF v_caller = v_sender_id THEN
        UPDATE recommendations
        SET sender_deleted = TRUE
        WHERE id = p_recommendation_id;
        RETURN TRUE;
    ELSIF v_caller = v_receiver_id THEN
        UPDATE recommendations
        SET receiver_deleted = TRUE
        WHERE id = p_recommendation_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_recommendation(UUID) TO authenticated;
