import React from 'react'
import { motion } from 'framer-motion'
import { Power, PowerOff, ShieldAlert } from 'lucide-react'
import { Button } from '@/shared/ui'
import { EmptyState } from '@/shared/components'
import { AdminPanel } from '@/features/admin/ui'
import ChallengeFilterBar from '@/features/challenges/components/ChallengeFilterBar'
import ChallengeListItem from './ChallengeListItem'
import type { AdminChallengeEventId, AdminChallengeFilterState, Challenge, Event } from '../types'

interface ChallengeListPanelProps {
  challenges: Challenge[]
  filteredChallenges: Challenge[]
  events: Event[]
  filters: AdminChallengeFilterState
  selectedEventId: AdminChallengeEventId
  isRefreshing: boolean
  isGlobalAdmin: boolean
  onFiltersChange: React.Dispatch<React.SetStateAction<AdminChallengeFilterState>>
  onEventChange: (eventId: AdminChallengeEventId) => void
  onAdd: () => void
  nxctlGlobalAction?: 'up' | 'down' | null
  onNxctlGlobalAction?: (action: 'up' | 'down') => void
  onEdit: (challenge: Challenge) => void
  onDelete: (id: string) => void
  onViewFlag: (id: string) => void
  onToggleActive: (id: string, checked: boolean) => Promise<unknown>
  onToggleMaintenance: (id: string, checked: boolean) => Promise<unknown>
}

const ChallengeListPanel: React.FC<ChallengeListPanelProps> = ({
  challenges,
  filteredChallenges,
  events,
  filters,
  selectedEventId,
  isRefreshing,
  isGlobalAdmin,
  onFiltersChange,
  onEventChange,
  onAdd,
  nxctlGlobalAction,
  onNxctlGlobalAction,
  onEdit,
  onDelete,
  onViewFlag,
  onToggleActive,
  onToggleMaintenance,
}) => {
  const syncingIndicator = isRefreshing && (
    <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 animate-pulse">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
      SYNCING...
    </div>
  )

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {isGlobalAdmin && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNxctlGlobalAction?.('up')}
            disabled={!!nxctlGlobalAction}
            title="Start all NXCTL services"
            className="rounded-xl"
          >
            <Power size={14} />
            Up All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNxctlGlobalAction?.('down')}
            disabled={!!nxctlGlobalAction}
            title="Stop all NXCTL services"
            className="hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-300 rounded-xl"
          >
            <PowerOff size={14} />
            Down All
          </Button>
        </>
      )}
      <Button onClick={onAdd} size="sm" className="rounded-xl">+ Add Challenge</Button>
    </div>
  )

  return (
    <motion.div className="order-1 xl:col-span-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <AdminPanel
        title="Challenge List"
        action={headerActions}
        description={isRefreshing ? "Synchronizing services..." : undefined}
      >
        <div className="space-y-4">
          <ChallengeFilterBar
            filters={filters}
            categories={Array.from(new Set(challenges.map(c => c.category))).filter(Boolean).sort()}
            difficulties={Array.from(new Set(challenges.map(c => c.difficulty)))}
            onFilterChange={v => onFiltersChange({ ...filters, ...v })}
            onClear={() => onFiltersChange({ category: "all", difficulty: "all", search: "", feature: "N" })}
            events={events.map(e => ({ id: e.id, name: e.name, start_time: e.start_time, end_time: e.end_time }))}
            selectedEventId={selectedEventId}
            onEventChange={onEventChange}
            hideAllEventOption={!isGlobalAdmin}
            hideMainEventOption={!isGlobalAdmin}
            includeEndedEvents
            showEventState={false}
            eventNavigationMode="select"
            upcomingVisibilityWindowDays={null}
          />

          <div className="mt-4 space-y-2">
            {filteredChallenges.length === 0 ? (
              <div className="py-6 border border-dashed border-gray-200/80 dark:border-gray-800/80 rounded-2xl bg-white/20 dark:bg-black/5 flex items-center justify-center">
                <EmptyState
                  icon={<ShieldAlert className="w-full h-full text-gray-400 dark:text-gray-500" />}
                  title="No challenges found"
                  description="Try adjusting your filters or add a new challenge."
                  containerHeight="py-2"
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-150 dark:divide-gray-800/80 border border-gray-200/80 dark:border-gray-800/80 rounded-xl overflow-hidden">
                {filteredChallenges.map(challenge => (
                  <ChallengeListItem
                    key={challenge.id}
                    challenge={challenge}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onViewFlag={onViewFlag}
                    onToggleMaintenance={onToggleMaintenance}
                    onToggleActive={onToggleActive}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminPanel>
    </motion.div>
  )
}

export default ChallengeListPanel
