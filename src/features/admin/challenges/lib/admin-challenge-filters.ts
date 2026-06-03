import type {
  AdminChallengeEventId,
  AdminChallengeFilterState,
  AdminScope,
  Challenge,
} from '../types'

interface GetFilteredAdminChallengesParams {
  challenges: Challenge[]
  adminScope: AdminScope | null
  isGlobalAdmin: boolean
  eventId: AdminChallengeEventId
  filters: AdminChallengeFilterState
  categoryOrder: string[]
}

export function getFilteredAdminChallenges({
  challenges,
  adminScope,
  isGlobalAdmin,
  eventId,
  filters,
  categoryOrder,
}: GetFilteredAdminChallengesParams) {
  const allowedEventSet = new Set(adminScope?.event_ids ?? [])
  const manageable = isGlobalAdmin
    ? challenges
    : challenges.filter(challenge => challenge.event_id && allowedEventSet.has(String(challenge.event_id)))

  return manageable.filter(challenge => {
    // 1. Event filter
    if (eventId !== 'all') {
      const matchMain = eventId === null && !challenge.event_id
      const matchEvent = challenge.event_id === eventId
      if (!matchMain && !matchEvent) return false
    }

    // 2. Search filter (title and description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const titleMatch = challenge.title.toLowerCase().includes(searchLower)
      const descMatch = challenge.description?.toLowerCase().includes(searchLower)
      if (!titleMatch && !descMatch) return false
    }

    // 3. Category filter
    if (filters.category !== "all" && challenge.category !== filters.category) return false

    // 4. Difficulty filter
    if (filters.difficulty !== "all" && challenge.difficulty !== filters.difficulty) return false

    // 5. Scope filter ('all' | 'main' | 'private' | 'service')
    if (filters.scope !== 'all') {
      const hasEvent = challenge.event_id !== null && challenge.event_id !== undefined
      const hasServices = Array.isArray(challenge.services) && challenge.services.length > 0
      
      if (filters.scope === 'main' && hasEvent) return false
      if (filters.scope === 'private' && !hasEvent) return false
      if (filters.scope === 'service' && !hasServices) return false
    }

    // 6. Visibility filter ('all' | 'active' | 'inactive')
    if (filters.visibility !== 'all') {
      if (filters.visibility === 'active' && !challenge.is_active) return false
      if (filters.visibility === 'inactive' && challenge.is_active) return false
    }

    // 7. Service filter ('all' | 'has_service' | 'no_service')
    if (filters.service !== 'all') {
      const hasServices = Array.isArray(challenge.services) && challenge.services.length > 0
      if (filters.service === 'has_service' && !hasServices) return false
      if (filters.service === 'no_service' && hasServices) return false
    }

    return true
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const aIdx = categoryOrder.findIndex(category => category.toLowerCase() === (a.category || '').toLowerCase())
    const bIdx = categoryOrder.findIndex(category => category.toLowerCase() === (b.category || '').toLowerCase())
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    return (a.category || '').localeCompare(b.category || '')
  })
}
