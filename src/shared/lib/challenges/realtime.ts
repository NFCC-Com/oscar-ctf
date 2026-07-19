import { supabase } from '@/lib/supabase/client'
import { callChallengeRpc } from './common'

/**
 * Notifications (manual broadcast)
 */
export async function getNotifications(limit = 50, offset = 0) {
  const { data, error } = await callChallengeRpc('get_notifications', {
    p_limit: limit,
    p_offset: offset,
  })
  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data || []
}

export async function createNotification(title: string, message: string, level: 'info' | 'info_platform' | 'info_challenges' = 'info') {
  const { data, error } = await callChallengeRpc('create_notification', {
    p_title: title,
    p_message: message,
    p_level: level,
  })
  if (error) throw error
  return data
}

export async function deleteNotification(id: string) {
  const { data, error } = await callChallengeRpc('delete_notification', {
    p_id: id,
  })
  if (error) throw error
  return data
}

export function subscribeToNotifications(onNotif: (payload: { id: string; title: string; message: string; level: string; created_at: string }) => void) {
  const channel = supabase
    .channel('admin-notifications-insert')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
      const row: any = payload.new || {}
      onNotif({
        id: row.id || `realtime-${row.created_at || ''}-${row.title || ''}`,
        title: row.title || 'Notification',
        message: row.message || '',
        level: row.level || 'info',
        created_at: row.created_at || new Date().toISOString(),
      })
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to real-time solves (challenge solved events)
 * @param onSolve callback({ username, challenge }) dipanggil setiap ada solve baru
 * @returns unsubscribe function
 */
export function subscribeToSolves(onSolve: (payload: { username: string; challenge: string; isFirstBlood?: boolean }) => void) {
  console.log('[subscribeToSolves] Subscribing to solves-insert channel...')
  const channel = supabase
    .channel('solves-insert')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solves' }, async (payload) => {
      try {
        if (!payload || !payload.new) {
          console.warn('[subscribeToSolves] Invalid payload:', payload)
          return
        }
        let solve = payload.new
        console.log('[subscribeToSolves] Payload.new:', solve)

        // Ignore historical solves (e.g. restored solves when challenge is activated)
        if (solve.created_at) {
          const ageInMs = Date.now() - new Date(solve.created_at).getTime()
          if (ageInMs > 300000) { // 5 minutes
            console.log(`[subscribeToSolves] Ignoring historical solve (age: ${(ageInMs / 1000).toFixed(0)}s): challenge_id ${solve.challenge_id}`)
            return
          }
        }

        // Fallback: fetch latest solve if missing user_id or challenge_id
        if (!solve.user_id || !solve.challenge_id) {
          console.warn('[subscribeToSolves] Missing user_id or challenge_id:', solve)
          const { data: latestSolve, error: latestError } = await supabase
            .from('solves')
            .select('id, user_id, challenge_id, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (latestError || !latestSolve || !latestSolve.user_id || !latestSolve.challenge_id) {
            console.warn('[subscribeToSolves] Still cannot get user_id or challenge_id from latest solve:', latestError, latestSolve)
            onSolve({ username: 'Unknown', challenge: 'Unknown', isFirstBlood: false })
            return
          }
          solve = latestSolve

          // Re-check age on fallback data
          if (solve.created_at) {
            const ageInMs = Date.now() - new Date(solve.created_at).getTime()
            if (ageInMs > 300000) { // 5 minutes
              console.log(`[subscribeToSolves] Ignoring historical fallback solve (age: ${(ageInMs / 1000).toFixed(0)}s): challenge_id ${solve.challenge_id}`)
              return
            }
          }
        }

        // Check if this solve is the first solve (First Blood) for this challenge
        let isFirstBlood = false
        try {
          const { data: firstSolve } = await supabase
            .from('solves')
            .select('id')
            .eq('challenge_id', solve.challenge_id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (firstSolve && firstSolve.id === solve.id) {
            isFirstBlood = true
          }
        } catch (err) {
          console.warn('[subscribeToSolves] Error checking first blood:', err)
        }

        const { data, error } = await supabase
          .rpc('get_solve_info', {
            p_user_id: solve.user_id,
            p_challenge_id: solve.challenge_id
          })

        if (error) {
          console.warn('[subscribeToSolves] Error fetching solve info via RPC:', error)
          onSolve({ username: 'Unknown', challenge: 'Unknown', isFirstBlood })
          return
        }

        if (data && data.length > 0) {
          const username = typeof data[0].username === 'string' && data[0].username ? data[0].username : 'Unknown'
          const challenge = typeof data[0].challenge === 'string' && data[0].challenge ? data[0].challenge : 'Unknown'
          onSolve({ username, challenge, isFirstBlood })
          console.log(`[subscribeToSolves] Real-time solve: ${username} solved ${challenge} (First Blood: ${isFirstBlood})`)
        } else {
          onSolve({ username: 'Unknown', challenge: 'Unknown', isFirstBlood })
        }
      } catch (err) {
        console.error('[subscribeToSolves] Error handling solve event:', err)
      }
    })
    .subscribe()

  return () => {
    console.log('[subscribeToSolves] Unsubscribing from solves-insert channel...')
    supabase.removeChannel(channel)
  }
}
