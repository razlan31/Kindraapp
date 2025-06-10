-- Add points column to users table
ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;

-- Add points column to badges table
ALTER TABLE badges ADD COLUMN points INTEGER DEFAULT 10;

-- Add points_awarded column to user_badges table
ALTER TABLE user_badges ADD COLUMN points_awarded INTEGER DEFAULT 0;

-- Create notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  badge_id INTEGER,
  points_awarded INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update existing badges with proper point values based on difficulty
UPDATE badges SET points = CASE
  WHEN category = 'Getting Started' THEN 5
  WHEN category = 'Relationship Progress' THEN 15
  WHEN category = 'Activity Tracking' THEN 10
  WHEN category = 'Positivity' THEN 10
  WHEN category = 'Conflict Resolution' THEN 20
  WHEN category = 'Intimacy' THEN 25
  WHEN category = 'Self Growth' THEN 15
  WHEN category = 'Meta Achievements' THEN 30
  WHEN category = 'Legendary' THEN 50
  ELSE 10
END;

-- Update points for specific repeatable badges to be lower
UPDATE badges SET points = 5 WHERE is_repeatable = true AND category IN ('Getting Started', 'Activity Tracking');
UPDATE badges SET points = 8 WHERE is_repeatable = true AND category IN ('Positivity', 'Relationship Progress');
UPDATE badges SET points = 12 WHERE is_repeatable = true AND category IN ('Intimacy', 'Self Growth');