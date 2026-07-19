import { supabase } from '@/lib/supabase/client'
import { Challenge, Attachment } from '@/shared/types'
import { callChallengeRpc } from './common'

/**
 * Add a new challenge (Admin only)
 */
export async function addChallenge(challengeData: {
  title: string
  description: string
  category: string
  points: number
  max_points?: number
  flag: string
  hint?: string | string[] | null
  attachments?: Attachment[]
  difficulty: string
  is_dynamic?: boolean
  is_maintenance?: boolean
  min_points?: number
  decay_per_solve?: number
  event_id?: string | null
  flag_placeholder?: boolean
  services?: string[]
}): Promise<string | null> {
  try {
    let hintValue: any = null
    if (Array.isArray(challengeData.hint)) {
      hintValue = challengeData.hint.length > 0 ? JSON.stringify(challengeData.hint) : null
    } else if (typeof challengeData.hint === 'string' && challengeData.hint.trim() !== '') {
      hintValue = JSON.stringify([challengeData.hint])
    }
    const { data, error } = await callChallengeRpc('add_challenge', {
      p_title: challengeData.title,
      p_description: challengeData.description,
      p_category: challengeData.category,
      p_points: challengeData.points,
      p_max_points: challengeData.max_points ?? null,
      p_flag: challengeData.flag,
      p_difficulty: challengeData.difficulty,
      p_hint: hintValue,
      p_attachments: challengeData.attachments || [],
      p_is_dynamic: challengeData.is_dynamic ?? false,
      p_is_maintenance: challengeData.is_maintenance ?? false,
      p_min_points: challengeData.min_points ?? 0,
      p_decay_per_solve: challengeData.decay_per_solve ?? 0,
      p_event_id: challengeData.event_id ?? null,
      p_flag_placeholder: challengeData.flag_placeholder ?? false,
      p_services: challengeData.services || []
    })
    if (error) {
      throw new Error(error.message)
    }
    return data ? String(data) : null
  } catch (error) {
    console.error('Error adding challenge:', error)
    throw error
  }
}

/**
 * Update challenge (Admin only)
 */
export async function updateChallenge(challengeId: string, challengeData: {
  title: string
  description: string
  category: string
  points: number
  max_points?: number
  flag?: string
  hint?: string | string[] | null
  attachments?: Attachment[]
  difficulty: string
  is_active?: boolean
  is_maintenance?: boolean
  is_dynamic?: boolean
  min_points?: number
  decay_per_solve?: number
  event_id?: string | null
  flag_placeholder?: boolean
  services?: string[]
}): Promise<void> {
  try {
    let hintValue: any = null
    if (Array.isArray(challengeData.hint)) {
      hintValue = challengeData.hint.length > 0 ? JSON.stringify(challengeData.hint) : null
    } else if (typeof challengeData.hint === 'string' && challengeData.hint.trim() !== '') {
      hintValue = JSON.stringify([challengeData.hint])
    }
    const { error } = await callChallengeRpc('update_challenge', {
      p_challenge_id: challengeId,
      p_title: challengeData.title,
      p_description: challengeData.description,
      p_category: challengeData.category,
      p_points: challengeData.points,
      p_max_points: challengeData.max_points ?? null,
      p_difficulty: challengeData.difficulty,
      p_hint: hintValue,
      p_attachments: challengeData.attachments || [],
      p_is_active: challengeData.is_active,
      p_is_maintenance: challengeData.is_maintenance,
      p_flag: challengeData.flag || null,
      p_is_dynamic: challengeData.is_dynamic ?? false,
      p_min_points: challengeData.min_points ?? 0,
      p_decay_per_solve: challengeData.decay_per_solve ?? 0,
      p_event_id: challengeData.event_id ?? null,
      p_flag_placeholder: challengeData.flag_placeholder,
      p_services: challengeData.services
    })
    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error updating challenge:', error)
    throw error
  }
}

/**
 * Delete challenge (Admin only)
 */
export async function deleteChallenge(challengeId: string): Promise<void> {
  try {
    const { error } = await callChallengeRpc('delete_challenge', {
      p_challenge_id: challengeId
    })
    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error deleting challenge:', error)
    throw error
  }
}

/**
 * Get challenge by ID (Admin only - includes flag info)
 */
export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as any
  } catch (error) {
    console.error('Error fetching challenge:', error)
    return null
  }
}

/**
 * Get lightweight challenge list (admin bulk tools)
 */
export async function getChallengesLite(showAll: boolean = true) {
  try {
    let query = supabase
      .from('challenges')
      .select('id, title, description, category, difficulty, event_id, is_active, is_maintenance, points, services')
      .order('created_at', { ascending: false })

    if (!showAll) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error
    const rows = data || []
    const ids = rows.map((challenge) => challenge.id)
    let questionIds = new Set<string>()

    if (ids.length > 0) {
      const { data: subChallengeRows } = await supabase
        .rpc('get_challenges_with_sub_challenges', { p_challenge_ids: ids })

      questionIds = new Set((subChallengeRows || []).map((row: any) => String(row.challenge_id)))
    }

    return (data || []).map((challenge) => ({
      ...challenge,
      is_active: challenge.is_active ?? undefined,
      is_maintenance: challenge.is_maintenance ?? undefined,
      services: challenge.services ?? undefined,
      has_questions: questionIds.has(String(challenge.id)),
    }))
  } catch (err) {
    console.error('Error fetching challenges (lite):', err)
    return []
  }
}

/**
 * Get challenge flag (Admin only)
 */
export async function getFlag(challengeId: string): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('get_flag', {
      p_challenge_id: challengeId
    })

    if (error) {
      console.error('Error fetching flag:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Unexpected error fetching flag:', err)
    return null
  }
}

/**
 * Set challenge active / inactive (Admin only)
 */
export async function setChallengeActive(challengeId: string, isActive: boolean): Promise<boolean> {
  try {
    const { data, error } = await callChallengeRpc('set_challenge_active', {
      p_challenge_id: challengeId,
      p_active: isActive,
    })

    if (error) {
      console.error('Error setting challenge active state:', error)
      return false
    }

    return data?.success === true
  } catch (err) {
    console.error('Unexpected error setting challenge active state:', err)
    return false
  }
}

/**
 * Set challenge maintenance state (Admin only)
 */
export async function setChallengeMaintenance(challengeId: string, isMaintenance: boolean): Promise<boolean> {
  try {
    const { data, error } = await callChallengeRpc('set_challenge_maintenance', {
      p_challenge_id: challengeId,
      p_maintenance: isMaintenance,
    })

    if (error) {
      console.error('Error setting challenge maintenance state:', error)
      return false
    }

    return data?.success === true
  } catch (err) {
    console.error('Unexpected error setting challenge maintenance state:', err)
    return false
  }
}

/**
 * Get all solvers (Admin only) with pagination
 */
export async function getSolversAll(limit = 250, offset = 0) {
  const { data, error } = await callChallengeRpc('get_solvers_all', {
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    console.error('Error fetching solvers (paginated):', error)
    return []
  }

  return data || []
}

/**
 * Get solvers for a specific username
 */
export async function getSolversByUsername(username: string) {
  const { data, error } = await callChallengeRpc('get_solves_by_name', {
    p_username: username,
  })

  if (error) {
    console.error(`Error fetching solvers for ${username}:`, error)
    return []
  }

  return data || []
}

/**
 * Get solvers for a specific challenge title (exact match)
 */
export async function getSolversByChallengeTitle(challengeTitle: string) {
  const { data, error } = await callChallengeRpc('get_solves_by_challenge', {
    p_challenge_title: challengeTitle,
  })

  if (error) {
    console.error(`Error fetching solvers for challenge "${challengeTitle}":`, error)
    return []
  }

  return data || []
}

/** Delete a solver entry by solve ID (Admin only)
 */
export async function deleteSolver(solveId: string) {
  const { data, error } = await callChallengeRpc("delete_solver", {
    p_solve_id: solveId,
  })

  if (error) throw error
  return data
}

export async function getActiveUserTags(): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_active_user_tags')
    if (error) throw error
    return Array.isArray(data) ? data.map(String) : []
  } catch (err) {
    console.error('Error fetching active user tags:', err)
    return []
  }
}

// ==============================================
// Scheduled Jobs (Admin)
// ==============================================

export async function createScheduledJob(
  jobType: string,
  scheduledAt: string,
  targetId?: string | null,
  payload?: Record<string, unknown>
): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('create_scheduled_job', {
      p_job_type: jobType,
      p_scheduled_at: scheduledAt,
      p_target_id: targetId ?? null,
      p_payload: payload ?? {},
    })
    if (error) throw new Error(error.message)
    return data ? String(data) : null
  } catch (err) {
    console.error('Error creating scheduled job:', err)
    throw err
  }
}

export async function repostChallenge(
  challengeId: string,
  newDate: string
): Promise<{ success: boolean; message?: string; created_at?: string }> {
  try {
    const { data, error } = await callChallengeRpc('repost_challenge', {
      p_challenge_id: challengeId,
      p_new_date: newDate,
    })
    if (error) throw new Error(error.message)
    return data as { success: boolean; message?: string; created_at?: string }
  } catch (err) {
    console.error('Error reposting challenge:', err)
    throw err
  }
}

export async function getScheduledJobs(
  status?: string | null,
  limit?: number,
  offset?: number
): Promise<any[]> {
  try {
    const { data, error } = await callChallengeRpc('get_scheduled_jobs', {
      p_status: status ?? null,
      p_limit: limit ?? 50,
      p_offset: offset ?? 0,
    })
    if (error) throw error
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching scheduled jobs:', err)
    return []
  }
}

export async function deleteScheduledJob(jobId: string): Promise<boolean> {
  try {
    const { data, error } = await callChallengeRpc('delete_scheduled_job', {
      p_job_id: jobId,
    })
    if (error) throw error
    return !!data
  } catch (err) {
    console.error('Error deleting scheduled job:', err)
    return false
  }
}

export async function getChallengeFirstBlood(challengeId: string): Promise<string | null> {
  try {
    const { data, error } = await callChallengeRpc('get_challenge_first_blood', {
      p_challenge_id: challengeId,
    })
    if (error) throw error
    return data ? String(data) : null
  } catch (err) {
    console.error('Error fetching first blood:', err)
    return null
  }
}
