-- ==============================================
-- Migration: Challenge Ratings
-- Version: 0.9.0
-- Description: Add challenge_ratings table and
--              denormalized rating columns to challenges.
-- ==============================================

-- 1) Create challenge_ratings table
CREATE TABLE IF NOT EXISTS public.challenge_ratings (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_ratings_challenge
  ON public.challenge_ratings(challenge_id);

-- 2) Add denormalized rating columns to challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT NULL;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- 3) Add system settings for feature toggle and visibility
INSERT INTO public.system_settings (key, value, description)
VALUES
  ('enable_challenge_rating', 'false', 'Enable 1-5 star rating for solved challenges'),
  ('show_rating_to_participants', 'false', 'Allow participants to view challenge ratings')
ON CONFLICT (key) DO NOTHING;
