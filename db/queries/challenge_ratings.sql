-- ==============================================
-- Queries: challenge_ratings
-- ==============================================

-- RPC: submit a challenge rating (1-5 stars)
CREATE OR REPLACE FUNCTION public.submit_challenge_rating(
  p_challenge_id UUID,
  p_rating SMALLINT
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID := auth.uid()::uuid;
  v_has_solved BOOLEAN;
BEGIN
  -- 1. Check feature enabled
  IF get_system_setting('enable_challenge_rating') <> 'true' THEN
    RETURN json_build_object('success', false, 'message', 'Challenge rating is currently disabled');
  END IF;

  -- 2. Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object('success', false, 'message', 'Rating must be between 1 and 5');
  END IF;

  -- 3. Check user has solved this challenge
  SELECT EXISTS(
    SELECT 1 FROM public.solves WHERE user_id = v_user_id AND challenge_id = p_challenge_id
  ) INTO v_has_solved;

  IF NOT v_has_solved THEN
    RETURN json_build_object('success', false, 'message', 'You must solve this challenge before rating it');
  END IF;

  -- 4. Upsert rating (insert or update if already rated)
  INSERT INTO public.challenge_ratings (user_id, challenge_id, rating)
  VALUES (v_user_id, p_challenge_id, p_rating)
  ON CONFLICT (user_id, challenge_id) DO UPDATE
  SET rating = p_rating, updated_at = now();

  RETURN json_build_object('success', true, 'message', 'Rating submitted');
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_challenge_rating(UUID, SMALLINT) TO authenticated;

-- RPC: get current user's rating for a challenge
CREATE OR REPLACE FUNCTION public.get_my_challenge_rating(p_challenge_id UUID)
RETURNS SMALLINT
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_rating SMALLINT;
BEGIN
  SELECT rating INTO v_rating
  FROM public.challenge_ratings
  WHERE user_id = auth.uid()::uuid AND challenge_id = p_challenge_id;
  RETURN v_rating;  -- NULL if not yet rated
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_challenge_rating(UUID) TO authenticated;

-- RPC: get solved challenges that the user has not yet rated (for reminder)
CREATE OR REPLACE FUNCTION public.get_unrated_solved_challenges(
  p_limit INT DEFAULT 5
)
RETURNS TABLE (challenge_id UUID, challenge_title TEXT, category TEXT)
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return empty if feature is disabled
  IF get_system_setting('enable_challenge_rating') <> 'true' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.challenge_id, c.title::TEXT, c.category::TEXT
  FROM public.solves s
  JOIN public.challenges c ON c.id = s.challenge_id
  WHERE s.user_id = auth.uid()::uuid
    AND c.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.challenge_ratings cr
      WHERE cr.user_id = s.user_id AND cr.challenge_id = s.challenge_id
    )
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unrated_solved_challenges(INT) TO authenticated;

-- RPC: get all challenges that the user has rated
CREATE OR REPLACE FUNCTION public.get_my_rated_challenges()
RETURNS TABLE (
  challenge_id UUID,
  rating SMALLINT,
  updated_at TIMESTAMP WITH TIME ZONE,
  challenge_title TEXT,
  category TEXT
)
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT cr.challenge_id, cr.rating, cr.updated_at, c.title::TEXT, c.category::TEXT
  FROM public.challenge_ratings cr
  JOIN public.challenges c ON c.id = cr.challenge_id
  WHERE cr.user_id = auth.uid()::uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_rated_challenges() TO authenticated;

-- Trigger: sync avg_rating & total_ratings to challenges table
-- (follows the same pattern as trg_solve_update_count)
CREATE OR REPLACE FUNCTION public.update_challenge_rating_aggregate()
RETURNS TRIGGER AS $$
DECLARE
  v_challenge_id UUID;
  v_avg NUMERIC(3,2);
  v_count INTEGER;
BEGIN
  v_challenge_id := COALESCE(NEW.challenge_id, OLD.challenge_id);

  SELECT
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)::integer
  INTO v_avg, v_count
  FROM public.challenge_ratings
  WHERE challenge_id = v_challenge_id;

  UPDATE public.challenges
  SET avg_rating = v_avg,
      total_ratings = COALESCE(v_count, 0)
  WHERE id = v_challenge_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rating_update_aggregate ON public.challenge_ratings;
CREATE TRIGGER trg_rating_update_aggregate
AFTER INSERT OR UPDATE OR DELETE ON public.challenge_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_challenge_rating_aggregate();

-- Sync function for bulk recalculation (maintenance)
CREATE OR REPLACE FUNCTION public.sync_challenge_ratings()
RETURNS void AS $$
BEGIN
  UPDATE public.challenges c
  SET avg_rating = sub.avg_r,
      total_ratings = sub.cnt
  FROM (
    SELECT
      challenge_id,
      ROUND(AVG(rating)::numeric, 2) AS avg_r,
      COUNT(*)::integer AS cnt
    FROM public.challenge_ratings
    GROUP BY challenge_id
  ) sub
  WHERE c.id = sub.challenge_id;

  -- Reset challenges with no ratings
  UPDATE public.challenges
  SET avg_rating = NULL, total_ratings = 0
  WHERE id NOT IN (SELECT DISTINCT challenge_id FROM public.challenge_ratings);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.sync_challenge_ratings() TO authenticated;

-- RLS/POLICY
ALTER TABLE public.challenge_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ratings select all" ON public.challenge_ratings;
DROP POLICY IF EXISTS "Ratings select own or admin" ON public.challenge_ratings;
CREATE POLICY "Ratings select own or admin"
  ON public.challenge_ratings
  FOR SELECT
  USING (
    user_id = auth.uid()::uuid
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Ratings insert own" ON public.challenge_ratings;
CREATE POLICY "Ratings insert own"
  ON public.challenge_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Ratings update own" ON public.challenge_ratings;
CREATE POLICY "Ratings update own"
  ON public.challenge_ratings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid);

GRANT SELECT ON public.challenge_ratings TO authenticated;
