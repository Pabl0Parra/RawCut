-- Add soft-delete flags to recommendations (if not already there)
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS sender_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS receiver_deleted BOOLEAN DEFAULT FALSE;

-- CLEAN SWEEP: Drop ALL existing policies on these tables regardless of their names
DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all for recommendations
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'recommendations' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY %I ON recommendations', pol.policyname);
    END LOOP;
    
    -- Drop all for recommendation_comments
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'recommendation_comments' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY %I ON recommendation_comments', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS just in case it was toggled
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_comments ENABLE ROW LEVEL SECURITY;

-- RECREATE POLICIES FROM SCRATCH

-- 1. Recommendations: SELECT (Only non-deleted for the current user)
CREATE POLICY "View own recommendations" ON recommendations
  FOR SELECT USING (
    (auth.uid() = sender_id AND NOT sender_deleted) OR
    (auth.uid() = receiver_id AND NOT receiver_deleted)
  );

-- 2. Recommendations: INSERT (Sender)
CREATE POLICY "Create recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. Recommendations: UPDATE (Both parties)
-- We use WITH CHECK (true) to ensure the update succeeds even if the resulting row is hidden
CREATE POLICY "Update own recommendations" ON recommendations
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (true);


-- 4. Comments: INSERT (If party of recommendation)
CREATE POLICY "Comment on recommendations" ON recommendation_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

-- 5. Comments: SELECT (If party of recommendation)
CREATE POLICY "View comments on recommendations" ON recommendation_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

-- 6. Comments: DELETE (Own only)
CREATE POLICY "Delete own comments" ON recommendation_comments
  FOR DELETE USING (auth.uid() = user_id);
