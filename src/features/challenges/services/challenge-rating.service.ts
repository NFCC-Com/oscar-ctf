import { supabase } from '@/lib/supabase/client'

// Use (supabase as any).rpc() because these RPC names are not yet
// registered in the auto-generated database.types.ts.
// This matches the pattern used in admin.service.ts.

export type SubmitRatingResult = { success: boolean; message: string }

export type UnratedChallenge = {
  challenge_id: string
  challenge_title: string
  category: string
}

/**
 * Submit or update a challenge rating (1-5 stars).
 * Requires the user to have solved the challenge first.
 */
export async function submitChallengeRating(
  challengeId: string,
  rating: number
): Promise<SubmitRatingResult> {
  const { data, error } = await (supabase as any).rpc('submit_challenge_rating', {
    p_challenge_id: challengeId,
    p_rating: rating,
  })

  if (error) {
    console.error('RPC submit_challenge_rating error:', error)
    return { success: false, message: error.message || 'Failed to submit rating' }
  }

  const result = data as Partial<SubmitRatingResult> | null
  return {
    success: Boolean(result?.success),
    message: String(result?.message || ''),
  }
}

/**
 * Get the current user's rating for a challenge.
 * Returns null if not yet rated.
 */
export async function getMyChallengeRating(
  challengeId: string
): Promise<number | null> {
  const { data, error } = await (supabase as any).rpc('get_my_challenge_rating', {
    p_challenge_id: challengeId,
  })

  if (error) {
    console.error('RPC get_my_challenge_rating error:', error)
    return null
  }

  return typeof data === 'number' ? data : null
}

/**
 * Get solved challenges that the current user has not yet rated.
 * Used for the rating reminder flow.
 */
export async function getUnratedSolvedChallenges(
  limit = 5
): Promise<UnratedChallenge[]> {
  const { data, error } = await (supabase as any).rpc('get_unrated_solved_challenges', {
    p_limit: limit,
  })

  if (error) {
    console.error('RPC get_unrated_solved_challenges error:', error)
    return []
  }

  return ((data as any[]) || []).map((row) => ({
    challenge_id: String(row.challenge_id),
    challenge_title: String(row.challenge_title),
    category: String(row.category),
  }))
}

export type RatedChallenge = {
  challenge_id: string
  rating: number
  updated_at: string
  challenge_title: string
  category: string
}

/**
 * Get all challenges that the current user has rated.
 */
export async function getMyRatedChallenges(): Promise<RatedChallenge[]> {
  const { data, error } = await (supabase as any).rpc('get_my_rated_challenges')

  if (error) {
    console.error('RPC get_my_rated_challenges error:', error)
    return []
  }

  return ((data as any[]) || []).map((row) => ({
    challenge_id: String(row.challenge_id),
    rating: Number(row.rating),
    updated_at: String(row.updated_at),
    challenge_title: String(row.challenge_title || ''),
    category: String(row.category || ''),
  }))
}
