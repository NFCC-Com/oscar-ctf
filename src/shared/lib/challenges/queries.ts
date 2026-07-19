import { supabase } from '@/lib/supabase/client'
import { ChallengeWithSolve, Challenge, Attachment, GeoCoordinates } from '@/shared/types'
import {
  callChallengeRpc,
  challengesListInflight,
  buildChallengesListKey,
  applyEventFilter,
  addComputedFields
} from './common'
import { getLeaderboard } from './leaderboard'

type ChallengeListResult = (ChallengeWithSolve & {
  has_first_blood: boolean
  is_new: boolean
  has_questions: boolean
  has_geo_flag: boolean
  geo_prefix?: string
})[]

// Get user rank only (by username)
export async function getUserRank(username: string, eventId?: string | null | 'all'): Promise<number | null> {
  const leaderboard = await getLeaderboard(100, 0, eventId)
  if (!leaderboard) return null
  
  leaderboard.sort((a: any, b: any) => {
    const scoreA = a.progress.length > 0 ? a.progress[a.progress.length - 1].score : 0
    const scoreB = b.progress.length > 0 ? b.progress[b.progress.length - 1].score : 0
    return scoreB - scoreA
  })
  const idx = leaderboard.findIndex((entry: any) => entry.username === username)
  return idx !== -1 ? idx + 1 : null
}

/**
 * Get all challenges
 */
export async function getChallenges(
  userId?: string,
  showAll: boolean = false,
  eventId?: string | null | 'all'
): Promise<(ChallengeWithSolve & { has_first_blood: boolean; is_new: boolean })[]> {
  try {
    let query = supabase
      .from('challenges')
      .select('*')
      .order('points', { ascending: true })        // poin terendah dulu
      .order('total_solves', { ascending: false }) // jika poin sama, paling banyak solves dulu

    if (!showAll) query = query.eq('is_active', true)
    query = applyEventFilter(query, eventId)

    const solvesPromise = userId
      ? supabase
          .from('solves')
          .select('challenge_id')
          .eq('user_id', userId)
      : null

    const [{ data: challenges, error }, solvesResult] = await Promise.all([
      query,
      solvesPromise ?? Promise.resolve({ data: [] as any[] }),
    ])
    if (error) throw new Error(error.message)
    if (!challenges) return []

    const solvedIds = new Set((solvesResult?.data || []).map((s: any) => s.challenge_id) || [])

    return challenges.map((ch: any) => addComputedFields(ch, solvedIds))
  } catch (err) {
    console.error('Error fetching challenges:', err)
    return []
  }
}

/**
 * Get challenge list (lightweight)
 */
export async function getChallengesList(
  userId?: string,
  showAll: boolean = false,
  eventId?: string | null | 'all'
): Promise<ChallengeListResult> {
  const cacheKey = buildChallengesListKey(userId, showAll, eventId)
  const inflight = challengesListInflight.get(cacheKey)
  if (inflight) return inflight

  const run = (async () => {
    try {
      let query = supabase
        .from('challenges')
        .select(
          'id, event_id, title, category, points, max_points, difficulty, is_active, is_maintenance, is_dynamic, min_points, decay_per_solve, total_solves, created_at, updated_at, flag_placeholder, services'
        )
        .order('points', { ascending: true })
        .order('total_solves', { ascending: false })

      if (!showAll) query = query.eq('is_active', true)
      query = applyEventFilter(query, eventId)

      const solvesPromise = userId
        ? supabase
            .from('solves')
            .select('challenge_id')
            .eq('user_id', userId)
        : null

      const challengesPromise = query

      const [{ data: challenges, error }, solvesResult] = await Promise.all([
        challengesPromise,
        solvesPromise ?? Promise.resolve({ data: [] as any[] }),
      ])

      if (error) throw new Error(error.message)
      if (!challenges) return []

      const solvedIds = new Set((solvesResult?.data || []).map((s: any) => s.challenge_id) || [])
      const challengeIds = (challenges as any[]).map((ch) => String(ch.id)).filter(Boolean)
      const hasQuestionIds = new Set<string>()
      const geoFlagMap = new Map<string, string>()

      if (challengeIds.length > 0) {
        const [subChallengesResult, geoFlagsResult] = await Promise.all([
          callChallengeRpc('get_challenges_with_sub_challenges', { p_challenge_ids: challengeIds }),
          callChallengeRpc('get_challenges_with_geo_flag', { p_challenge_ids: challengeIds }),
        ])

        if (subChallengesResult.error) {
          console.error('Error fetching sub-challenges for challenge list:', subChallengesResult.error)
        } else {
          for (const row of (subChallengesResult.data || []) as any[]) {
            if (row?.challenge_id) hasQuestionIds.add(String(row.challenge_id))
          }
        }

        if (geoFlagsResult.error) {
          console.error('Error fetching geo flags for challenge list:', geoFlagsResult.error)
        } else {
          for (const row of (geoFlagsResult.data || []) as any[]) {
            if (row?.challenge_id) geoFlagMap.set(String(row.challenge_id), String(row.geo_prefix || ''))
          }
        }
      }

      return (challenges as any[]).map((ch) => ({
        ...addComputedFields(ch, solvedIds),
        has_questions: hasQuestionIds.has(String(ch.id)),
        has_geo_flag: geoFlagMap.has(String(ch.id)),
        geo_prefix: geoFlagMap.get(String(ch.id)),
        description: '',
        hint: null,
        attachments: [],
        flag: '',
      }))
    } catch (err) {
      console.error('Error fetching challenges (list):', err)
      return []
    }
  })().finally(() => {
    challengesListInflight.delete(cacheKey)
  })

  challengesListInflight.set(cacheKey, run)
  return run
}

/**
 * Get full challenge detail by ID (public view)
 */
export async function getChallengeDetail(challengeId: string): Promise<ChallengeWithSolve | null> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select(
        'id, event_id, title, description, category, points, max_points, hint, attachments, difficulty, is_active, is_maintenance, is_dynamic, min_points, decay_per_solve, total_solves, created_at, updated_at, flag_placeholder, services'
      )
      .eq('id', challengeId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) return null

    return {
      ...(data as any),
      flag: '',
    } as any
  } catch (error) {
    console.error('Error fetching challenge detail:', error)
    return null
  }
}

/**
 * Get challenge placeholder string
 */
export async function getChallengePlaceholder(challengeId: string): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('get_challenge_placeholder', {
      p_challenge_id: challengeId
    })
    if (error) throw new Error(error.message)
    return data
  } catch (err) {
    console.error('Error fetching challenge placeholder:', err)
    return null
  }
}

/**
 * Get NXCTL service names for a challenge
 */
export async function getChallengeServices(challengeId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('services')
      .eq('id', challengeId)
      .single()

    if (error) throw new Error(error.message)
    return (data?.services || []) as string[]
  } catch (err) {
    console.error('Error fetching challenge services:', err)
    return []
  }
}

/**
 * Get geo challenge target coordinates and radius
 */
export async function getGeoChallengeTarget(
  challengeId: string
): Promise<GeoCoordinates & { radius_km: number; flag?: string } | null> {
  const { data, error } = await callChallengeRpc('get_geo_challenge_target', {
    p_challenge_id: challengeId,
  })

  if (error) {
    console.error('getGeoChallengeTarget RPC error:', error)
    return null
  }

  const list = data as any[]
  if (!list || list.length === 0) return null
  const row = list[0]
  return {
    lat: Number(row.target_lat),
    lng: Number(row.target_lng),
    radius_km: Number(row.radius_km),
    flag: row.flag ? String(row.flag) : undefined,
  }
}

/**
 * Get flag submission stats for a challenge (for the current user)
 */
export async function getMyFlagSubmissionStats(challengeId: string): Promise<{
  incorrect_attempts: number
  window_attempts: number
  window_start_at: string
  remaining_attempts: number
  cooldown_seconds: number
} | null> {
  const { data, error } = await supabase.rpc('get_my_submission_status', {
    p_challenge_id: challengeId
  })

  if (error) {
    console.error('Error fetching my flag submission stats:', error)
    return null
  }

  return data?.[0] || null
}

/**
 * Get registered solvers for a challenge
 */
export async function getSolversByChallenge(challengeId: string) {
  try {
    const { data, error } = await callChallengeRpc('get_challenge_solvers', {
      p_challenge_id: challengeId,
    })

    if (error) throw error

    return ((data as any[]) || []).map(row => ({
      username: row.username,
      solvedAt: row.solved_at,
      picture: row.picture
    }))
  } catch (error) {
    console.error('Error fetching solvers:', error)
    return []
  }
}

/**
 * Get first blood challenge IDs for a user
 */
export async function getFirstBloodChallengeIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await callChallengeRpc('get_user_first_bloods', { p_user_id: userId })
    if (error) throw error
    return (data || []).map((r: any) => r.challenge_id)
  } catch (err) {
    console.error('Error fetching first bloods (rpc):', err)
    return []
  }
}
