import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Upload, Download } from 'lucide-react'
import { Button } from '@/shared/ui'
import { AdminDataSurface, AdminEmptyState, AdminListSurface, AdminStickyToolbar } from '@/features/admin/ui'
import AdminChallengesToolbar from './AdminChallengesToolbar'
import ChallengeListItem from './ChallengeListItem'
import type { AdminChallengeEventId, AdminChallengeFilterState, Challenge, Event } from '../types'
import APP from '@/config'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import { buildFuzzyOrderedList } from '@/features/challenges/lib/challenge-utils'

interface ChallengeListPanelProps {
  challenges: Challenge[]
  filteredChallenges: Challenge[]
  events: Event[]
  filters: AdminChallengeFilterState
  selectedEventId: AdminChallengeEventId
  isRefreshing: boolean
  isGlobalAdmin: boolean
  scheduledJobsMap?: Record<string, { scheduled_at: string; repost?: boolean; notify?: boolean }>
  onFiltersChange: React.Dispatch<React.SetStateAction<AdminChallengeFilterState>>
  onEventChange: (eventId: AdminChallengeEventId) => void
  onAdd: () => void
  onEdit: (challenge: Challenge) => void
  onDelete: (id: string) => void
  onViewFlag: (id: string) => void
  onToggleActive: (id: string, checked: boolean) => Promise<unknown>
  onToggleMaintenance: (id: string, checked: boolean) => Promise<unknown>
  onRepost?: (challenge: Challenge) => void
  onSchedule?: (challenge: Challenge) => void
  onExport?: () => void
  onImport?: () => void
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
  onEdit,
  onDelete,
  onViewFlag,
  onToggleActive,
  onToggleMaintenance,
  onRepost,
  onSchedule,
  onExport,
  onImport,
  scheduledJobsMap,
}) => {
  const headerActions = (
    <div className="flex items-center gap-1.5">
      {onImport && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onImport}
          className="rounded-xl text-xs gap-1.5 h-8 px-2.5 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
          title="Import challenges from JSON file or raw text"
        >
          <Upload size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Import</span>
        </Button>
      )}
      {onExport && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          className="rounded-xl text-xs gap-1.5 h-8 px-2.5 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
          title="Export challenges to JSON or clipboard"
        >
          <Download size={13} className="text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      )}
      <Button onClick={onAdd} size="sm" className="rounded-xl text-xs h-8 px-3">
        + Add Challenge
      </Button>
    </div>
  )

  const syncStatus = isRefreshing ? (
    <p className="inline-flex items-center gap-1.5 text-xs text-orange-500">
      <Loader2 className="h-3 w-3 animate-spin" />
      Synchronizing...
    </p>
  ) : null

  const { categories: dbCategories } = useCategories()
  const rawCategories = Array.from(new Set(challenges.map(c => (c.category || '').split('/')[0]))).filter(Boolean)
  const categoryOrder = dbCategories.map(c => c.name)
  const sortedCategories = buildFuzzyOrderedList(categoryOrder, rawCategories)

  const rawDifficulties = Array.from(new Set(challenges.map(c => c.difficulty))).filter(Boolean)
  const difficultyOrder = Object.keys(APP.difficultyStyles)
  const normalizedDiffOrder = difficultyOrder.map(d => d.toLowerCase())
  const sortedDifficulties = [...rawDifficulties].sort((a, b) => {
    const normA = a.trim().toLowerCase()
    const normB = b.trim().toLowerCase()
    let idxA = normalizedDiffOrder.indexOf(normA)
    let idxB = normalizedDiffOrder.indexOf(normB)
    if (idxA === -1) idxA = normalizedDiffOrder.length
    if (idxB === -1) idxB = normalizedDiffOrder.length
    if (idxA !== idxB) return idxA - idxB
    return a.localeCompare(b)
  })

  return (
    <motion.div className="order-1 xl:col-span-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="w-full">
        <AdminDataSurface
          toolbar={(
            <AdminStickyToolbar
              filters={(
                <AdminChallengesToolbar
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  categories={sortedCategories}
                  difficulties={sortedDifficulties}
                  actions={headerActions}
                  status={syncStatus}
                  events={events}
                  selectedEventId={selectedEventId}
                  isGlobalAdmin={isGlobalAdmin}
                  onEventChange={onEventChange}
                  onClear={() => onFiltersChange({
                    category: "all",
                    difficulty: "all",
                    search: "",
                    scope: "all",
                    visibility: "all",
                    service: "all",
                    sortBy: "points_desc",
                  })}
                />
              )}
            />
          )}
          empty={filteredChallenges.length === 0 ? (
            <AdminEmptyState
              title="No challenges found"
              description="Try adjusting your filters or add a new challenge."
            />
          ) : null}
        >
            <AdminListSurface>
              {filteredChallenges.map(challenge => (
                <ChallengeListItem
                  key={challenge.id}
                  challenge={challenge}
                  scheduledAt={scheduledJobsMap?.[challenge.id]?.scheduled_at}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewFlag={onViewFlag}
                  onToggleMaintenance={onToggleMaintenance}
                  onToggleActive={onToggleActive}
                  onRepost={onRepost}
                  onSchedule={onSchedule}
                />
              ))}
            </AdminListSurface>
        </AdminDataSurface>
      </div>
    </motion.div>
  )
}

export default ChallengeListPanel
