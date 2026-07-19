import { supabase } from '@/lib/supabase/client'
import { getLogs } from '@/features/logs/lib/log-service'
import { callChallengeRpc } from './common'

/**
 * Get leaderboard with progress
 */
export async function getLeaderboard(limit = 100, offset = 0, eventId?: string | null | 'all', tag?: string | null) {
  // Map frontend eventId values to RPC parameters
  let p_event_mode: string = 'any'
  let p_event_id: string | null = null
  if (eventId === 'all') {
    p_event_mode = 'any'
    p_event_id = null
  } else if (eventId === null || eventId === 'main') {
    p_event_mode = 'is_null'
    p_event_id = null
  } else if (eventId === undefined) {
    p_event_mode = 'any'
    p_event_id = null
  } else {
    p_event_mode = 'equals'
    p_event_id = eventId
  }

  const { data, error } = await callChallengeRpc('get_leaderboard', {
    limit_rows: limit,
    offset_rows: offset,
    p_event_id,
    p_event_mode,
    p_tag: tag || null,
  })
  if (error) throw error
  return data
}

/**
 * Get lightweight leaderboard summary: username and final score (no progress history)
 */
export async function getLeaderboardSummary(limit = 100, offset = 0, eventId?: string | null | 'all', tag?: string | null) {
  const data = await getLeaderboard(limit, offset, eventId, tag)
  return (data || []).map((d: any) => ({
    id: d.id,
    username: d.username,
    score: typeof d.score === 'number' ? d.score : (d.progress?.at(-1)?.score ?? 0),
    rank: d.rank,
    last_solve: d.last_solve,
    picture: d.picture,
    tags: d.tags || [],
  }))
}

export async function getTopProgress(topUsers: string[], eventId?: string | null | 'all') {
  const batchSize = 1000
  let offset = 0
  let rows: any[] = []

  while (true) {
    let p_event_mode: string = 'any'
    let p_event_id: string | null = null
    if (eventId === 'all') {
      p_event_mode = 'any'
      p_event_id = null
    } else if (eventId === null || eventId === 'main') {
      p_event_mode = 'is_null'
      p_event_id = null
    } else if (eventId === undefined) {
      p_event_mode = 'any'
      p_event_id = null
    } else {
      p_event_mode = 'equals'
      p_event_id = eventId
    }

    const { data, error } = await callChallengeRpc('get_top_progress', {
      p_user_ids: topUsers,
      p_limit: batchSize,
      p_offset: offset,
      p_event_id,
      p_event_mode,
    })

    if (error) throw error

    const batch = (data as any[]) || []
    rows = rows.concat(batch)
    if (batch.length < batchSize) break
    offset += batchSize
  }

  const progress: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
  for (const row of rows) {
    const userId = row.user_id
    const username = row.username
    if (!userId || !username) continue
    if (!progress[userId]) {
      progress[userId] = { username, history: [] }
    }

    const prev = progress[userId].history.at(-1)?.score || 0
    progress[userId].history.push({
      date: row.created_at,
      score: prev + (row.points || 0)
    })
  }

  return progress
}

/**
 * Fetch progress curves for a list of usernames (convenience wrapper).
 */
export async function getTopProgressByUsernames(usernames: string[], eventId?: string | null | 'all') {
  if (!usernames || usernames.length === 0) return {}

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username')
    .in('username', usernames)

  if (usersError) throw usersError

  const idToUsername: Record<string, string> = {}
  const ids: string[] = (users || []).map((u: any) => {
    idToUsername[u.id] = u.username
    return u.id
  })

  if (ids.length === 0) return {}

  const progressById = await getTopProgress(ids, eventId)

  const result: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
  for (const id of Object.keys(progressById)) {
    const entry = progressById[id]
    const uname = idToUsername[id]
    if (!uname) continue
    result[uname] = {
      username: entry.username,
      history: entry.history,
    }
  }

  return result
}

/**
 * Build a leaderboard based on first-bloods.
 */
export async function getFirstBloodLeaderboard(limit = 100, offset = 0, eventId?: string | null | 'all') {
  try {
    const notifications = await getLogs(2000, 0)
    if (!notifications || notifications.length === 0) return []

    const fbNotifs = notifications.filter((n: any) => n.log_type === 'first_blood')
    if (fbNotifs.length === 0) return []

    let fbList = fbNotifs

    if (eventId !== undefined && eventId !== 'all') {
      const challengeIds = Array.from(new Set(fbNotifs.map((n: any) => n.log_challenge_id).filter(Boolean)))
      if (challengeIds.length === 0) return []

      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('id, event_id')
        .in('id', challengeIds)

      if (error) {
        console.error('Error fetching challenges for first-blood filter:', error)
        return []
      }

      const allowed = new Set<string>()
      for (const c of (challenges || [])) {
        if (eventId === null) {
          if (c.event_id == null) allowed.add(c.id)
        } else {
          if (c.event_id === eventId) allowed.add(c.id)
        }
      }

      fbList = fbNotifs.filter((n: any) => allowed.has(n.log_challenge_id))
      if (fbList.length === 0) return []
    }

    const countMap: Record<string, number> = {}
    const perUserDates: Record<string, string[]> = {}
    const userMetaByUsername: Record<string, { id?: string | null; username: string }> = {}

    for (const n of fbList) {
      const username = n.log_username || null
      const userId = n.log_user_id || null
      const created = n.log_created_at || null
      if (!username) continue
      countMap[username] = (countMap[username] || 0) + 1
      perUserDates[username] = perUserDates[username] || []
      if (created) perUserDates[username].push(created)
      userMetaByUsername[username] = { id: userId, username }
    }

    const usernames = Object.keys(countMap)
    const userIds = Array.from(new Set(Object.values(userMetaByUsername).map((u) => u.id).filter(Boolean) as string[]))

    const { data: profileRows, error: profileError } = userIds.length > 0
      ? await (supabase.rpc as any)('resolve_user_pictures', { p_user_ids: userIds })
      : { data: null, error: null }

    if (profileError) {
      console.error('Error fetching first-blood profile pictures:', profileError)
    }

    const pictureByUsername = new Map<string, string | null>()
    for (const row of ((profileRows || []) as any[])) {
      if (row.username) pictureByUsername.set(row.username, row.picture ?? null)
    }

    const result = Object.keys(countMap)
      .map((username) => {
        const count = countMap[username] || 0
        const dates = (perUserDates[username] || []).slice().sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        const achievedAt = dates.length >= count && count > 0 ? dates[count - 1] : dates[dates.length - 1] || null
        return { username, firstBloodCount: count, achievedAt }
      })
      .sort((a, b) => {
        const diff = (b.firstBloodCount || 0) - (a.firstBloodCount || 0)
        if (diff !== 0) return diff
        if (!a.achievedAt && !b.achievedAt) return 0
        if (!a.achievedAt) return 1
        if (!b.achievedAt) return -1
        return new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()
      })

    const progressMap: Record<string, { username: string; history: { date: string; score: number }[] }> = {}
    for (const username of Object.keys(perUserDates)) {
      const dates = perUserDates[username].slice().sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      let cum = 0
      progressMap[username] = { username, history: [] }
      for (const d of dates) {
        cum += 1
        progressMap[username].history.push({ date: d, score: cum })
      }
    }

    const leaderboard = result.slice(offset, offset + limit).map((r, i) => ({
      id: String(i + 1 + offset),
      username: r.username,
      rank: i + 1 + offset,
      score: r.firstBloodCount,
      picture: pictureByUsername.get(userMetaByUsername[r.username]?.id || r.username) ?? pictureByUsername.get(r.username) ?? null,
      progress: progressMap[r.username]?.history || [],
    }))

    return leaderboard
  } catch (err) {
    console.error('Error building first-blood leaderboard:', err)
    return []
  }
}
