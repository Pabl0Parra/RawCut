-- CortoCrudo Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE NOT NULL,
  avatar_url TEXT,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Content (Favorites + Watchlist combined)
CREATE TABLE IF NOT EXISTS user_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INT NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  list_type VARCHAR(20) NOT NULL CHECK (list_type IN ('favorite', 'watchlist')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, media_type, list_type)
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INT NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  message TEXT CHECK (LENGTH(message) <= 200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sender_id != receiver_id)
);

-- Recommendation Comments
CREATE TABLE IF NOT EXISTS recommendation_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (LENGTH(text) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recommendation_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Public read, users update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- User Content: Users CRUD own
CREATE POLICY "Users can view their own content" ON user_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content" ON user_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" ON user_content
  FOR DELETE USING (auth.uid() = user_id);

-- Recommendations: Sender/receiver can read, sender creates
CREATE POLICY "View own recommendations" ON recommendations
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Create recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Comments: Sender/receiver can comment and view
CREATE POLICY "Comment on recommendations" ON recommendation_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

CREATE POLICY "View comments" ON recommendation_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

-- Ratings: Receiver creates, both can read
CREATE POLICY "Rate recommendations" ON ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations
      WHERE id = recommendation_id AND receiver_id = auth.uid()
    )
  );

CREATE POLICY "View ratings" ON ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recommendations r
      WHERE r.id = recommendation_id
        AND auth.uid() IN (r.sender_id, r.receiver_id)
    )
  );

-- Trigger function to update sender points on rating
CREATE OR REPLACE FUNCTION update_sender_points()
RETURNS TRIGGER AS $$
DECLARE
  sender UUID;
  points_to_add INT := 0;
BEGIN
  -- Get the sender of the recommendation
  SELECT sender_id INTO sender
  FROM recommendations
  WHERE id = NEW.recommendation_id;

  -- Calculate points: +1 for 4 stars, +2 for 5 stars
  IF NEW.rating >= 4 THEN
    points_to_add := 1;
  END IF;
  IF NEW.rating = 5 THEN
    points_to_add := 2;
  END IF;

  -- Update sender's points
  IF points_to_add > 0 THEN
    UPDATE profiles
    SET points = points + points_to_add
    WHERE user_id = sender;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for points update
DROP TRIGGER IF EXISTS on_rating_insert ON ratings;
CREATE TRIGGER on_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_sender_points();

-- Optional: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE recommendation_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE ratings;
