import { supabase } from '@/lib/supabase/client'

export function callChallengeRpc<T = any>(name: string, args?: Record<string, unknown>) {
  return (supabase as any).rpc(name, args) as Promise<{ data: T | null; error: { message: string } | null }>
}

export const challengesListInflight = new Map<string, Promise<any>>()

export const normalizeEventKey = (eventId?: string | null | 'all') => {
  if (eventId === undefined) return 'any'
  if (eventId === null) return 'main'
  return String(eventId)
}

export const buildChallengesListKey = (userId?: string, showAll: boolean = false, eventId?: string | null | 'all') => {
  const uid = userId || 'anon'
  const visibility = showAll ? 'all' : 'active'
  return `${uid}|${visibility}|${normalizeEventKey(eventId)}`
}

export const applyEventFilter = (query: any, eventId?: string | null | 'all') => {
  if (eventId === 'all') return query
  if (eventId === null || eventId === 'main') return query.is('event_id', null)
  return query.eq('event_id', eventId)
}

export const addComputedFields = <T extends { id: string; created_at?: string; total_solves?: number; is_maintenance?: boolean }>(
  challenge: T,
  solvedIds: Set<string>
) => {
  const createdAt = challenge.created_at ? new Date(challenge.created_at) : null
  const isRecentlyCreated = createdAt ? Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000 : false
  const hasFirstBlood = (challenge.total_solves || 0) > 0

  return {
    ...challenge,
    is_solved: solvedIds.has(challenge.id),
    has_first_blood: hasFirstBlood,
    is_recently_created: isRecentlyCreated,
    is_new: isRecentlyCreated && !hasFirstBlood,
    total_solves: challenge.total_solves || 0,
    is_maintenance: challenge.is_maintenance ?? false,
  }
}
