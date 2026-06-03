import React from 'react'
import AdminChallengeScopeTabs from './AdminChallengeScopeTabs'
import AdminChallengeFilters from './AdminChallengeFilters'
import type { AdminChallengeEventId, AdminChallengeFilterState, Event } from '../types'

interface AdminChallengesToolbarProps {
  filters: AdminChallengeFilterState
  onFiltersChange: React.Dispatch<React.SetStateAction<AdminChallengeFilterState>>
  categories: string[]
  difficulties: string[]
  events: Event[]
  selectedEventId: AdminChallengeEventId
  onEventChange: (eventId: AdminChallengeEventId) => void
  isGlobalAdmin: boolean
  onClear: () => void
}

export default function AdminChallengesToolbar({
  filters,
  onFiltersChange,
  categories,
  difficulties,
  events,
  selectedEventId,
  onEventChange,
  isGlobalAdmin,
  onClear,
}: AdminChallengesToolbarProps) {
  return (
    <div className="flex flex-col gap-5 w-full bg-white/40 dark:bg-[#111622]/40 backdrop-blur-md border border-gray-200/80 dark:border-gray-800/60 p-4 rounded-2xl shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Row 1: Scope tabs */}
        <div className="flex items-center justify-between border-b border-gray-200/40 dark:border-gray-800/40 pb-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Filter Scope</span>
            <AdminChallengeScopeTabs
              value={filters.scope}
              onChange={(val) => onFiltersChange((prev) => ({ ...prev, scope: val }))}
            />
          </div>
        </div>

        {/* Row 2: Search and Select dropdowns */}
        <AdminChallengeFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          categories={categories}
          difficulties={difficulties}
          events={events}
          selectedEventId={selectedEventId}
          onEventChange={onEventChange}
          isGlobalAdmin={isGlobalAdmin}
          onClear={onClear}
        />
      </div>
    </div>
  )
}
