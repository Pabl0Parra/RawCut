-- CortoCrudo Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(20) UNIQUE NOT NULL,
  display_name TEXT,
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

-- TV Show Progress
CREATE TABLE IF NOT EXISTS tv_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INT NOT NULL,
  season_number INT NOT NULL,
  episode_number INT NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, season_number, episode_number)
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  tmdb_id INT NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  message TEXT CHECK (LENGTH(message) <= 200),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sender_id != receiver_id)
);

-- Recommendation Comments
CREATE TABLE IF NOT EXISTS recommendation_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (LENGTH(text) <= 500),
  is_read BOOLEAN DEFAULT FALSE,
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
ALTER TABLE tv_progress ENABLE ROW LEVEL SECURITY;

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

-- Recommendations: Sender/receiver can read, sender creates, receiver marks as read
CREATE POLICY "View own recommendations" ON recommendations
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Create recommendations" ON recommendations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Update own recommendations" ON recommendations
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

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

-- Ratings: Receiver creates/updates, both can read
CREATE POLICY "Rate recommendations" ON ratings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recommendations
      WHERE id = recommendation_id AND receiver_id = auth.uid()
    )
  );

CREATE POLICY "Update ratings" ON ratings
  FOR UPDATE USING (
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

-- TV Progress: Users CRUD own
CREATE POLICY "Users can view their own tv progress" ON tv_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tv progress" ON tv_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tv progress" ON tv_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger function to update sender points on rating
CREATE OR REPLACE FUNCTION update_sender_points()
RETURNS TRIGGER AS $$
DECLARE
  sender UUID;
  old_points INT := 0;
  new_points INT := 0;
  diff INT := 0;
BEGIN
  -- Get the sender of the recommendation
  SELECT sender_id INTO sender
  FROM recommendations
  WHERE id = NEW.recommendation_id;

  -- Calculate new points: +1 for 4 stars, +2 for 5 stars
  IF NEW.rating >= 4 THEN new_points := 1; END IF;
  IF NEW.rating = 5 THEN new_points := 2; END IF;

  -- If update, calculate old points to get the diff
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.rating >= 4 THEN old_points := 1; END IF;
    IF OLD.rating = 5 THEN old_points := 2; END IF;
  END IF;

  diff := new_points - old_points;

  -- Update sender's points
  IF diff <> 0 THEN
    UPDATE profiles
    SET points = points + diff
    WHERE user_id = sender;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for points update
DROP TRIGGER IF EXISTS on_rating_changes ON ratings;
CREATE TRIGGER on_rating_changes
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_sender_points();

-- Optional: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SUBSTR(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name'), 1, 20),
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username'
    )
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
-- Function to get email by username (used for login)
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TABLE (email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.email::TEXT
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.user_id
  WHERE LOWER(p.username) = LOWER(p_username) 
     OR LOWER(p.display_name) = LOWER(p_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
