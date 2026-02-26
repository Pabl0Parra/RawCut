-- Drop existing policies to ensure a clean state
DROP POLICY IF EXISTS "View own recommendations" ON recommendations;
DROP POLICY IF EXISTS "Create recommendations" ON recommendations;
DROP POLICY IF EXISTS "Mark recommendations as read" ON recommendations;
DROP POLICY IF EXISTS "Delete own recommendations" ON recommendations;

-- Recreate Recommendations policies
CREATE POLICY "View own recommendations" ON recommendations
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Create recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Mark recommendations as read" ON recommendations
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Delete own recommendations" ON recommendations
  FOR DELETE USING (auth.uid() IN (sender_id, receiver_id));


-- Drop existing policies for recommendation_comments
DROP POLICY IF EXISTS "Comment on recommendations" ON recommendation_comments;
DROP POLICY IF EXISTS "View comments on recommendations" ON recommendation_comments;
DROP POLICY IF EXISTS "Delete own comments" ON recommendation_comments;

-- Recreate Recommendation Comments policies
CREATE POLICY "Comment on recommendations" ON recommendation_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

CREATE POLICY "View comments on recommendations" ON recommendation_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

CREATE POLICY "Delete own comments" ON recommendation_comments
  FOR DELETE USING (auth.uid() = user_id);
