-- Allow users to delete recommendations they sent OR received
CREATE POLICY "Delete own recommendations" ON recommendations
  FOR DELETE USING (auth.uid() IN (sender_id, receiver_id));

-- Allow users to delete their own comments
CREATE POLICY "Delete own comments" ON recommendation_comments
  FOR DELETE USING (auth.uid() = user_id);
