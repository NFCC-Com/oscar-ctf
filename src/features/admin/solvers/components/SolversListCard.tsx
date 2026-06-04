import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui'
import { AdminPageSurface, AdminFilterBar, AdminListSurface, AdminEmptyState } from '../../ui'
import { formatRelativeDate } from '../lib'
import type { SolverRow } from '../types'

interface SolversListCardProps {
  solvers: SolverRow[]
  searchQuery: string
  searching: boolean
  loadingMore: boolean
  hasMore: boolean
  offset: number
  onSearchQueryChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
  onAskDelete: (id: string) => void
  onLoadMore: (offset: number) => void
}

const SolversListCard: React.FC<SolversListCardProps> = ({
  solvers,
  searchQuery,
  searching,
  loadingMore,
  hasMore,
  offset,
  onSearchQueryChange,
  onSearch,
  onReset,
  onAskDelete,
  onLoadMore,
}) => {
  return (
    <AdminPageSurface>
      <div className="sticky top-14 z-30 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2.5 border-b border-gray-200/60 dark:border-gray-800/60 mb-2">
        <AdminFilterBar className="pt-0 pb-0">
          <div className="flex items-center gap-2 w-full max-w-md">
            <input
              type="text"
              placeholder="Search by user or challenge..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch()
              }}
              className="flex-1 px-3.5 h-9 text-xs rounded-xl border border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 shadow-sm outline-none transition-all hover:border-blue-500/40 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/30"
            />

            <Button id="search-btn" variant="outline" size="sm" onClick={onSearch} className="h-9 px-4 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/40 shrink-0">
              {searching ? 'Searching...' : 'Search'}
            </Button>

            <Button variant="outline" size="sm" onClick={onReset} className="h-9 px-4 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/40 shrink-0">
              Reset
            </Button>
          </div>
        </AdminFilterBar>
      </div>
        {solvers.length === 0 ? (
          <div className="p-6">
            <AdminEmptyState
              title="No solves found"
              description="No one has solved this challenge yet or matches your search."
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AdminListSurface>
              {solvers.map((s) => (
                <div
                  key={s.solve_id}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/10"
                >
                  <div className="truncate text-sm font-medium">
                    <Link
                      href={`/user/${encodeURIComponent(s.username)}`}
                      className="text-blue-600 dark:text-blue-300 hover:underline"
                      title={s.username}
                    >
                      {s.username}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal"> solved </span>
                    <span className="text-xs text-gray-800 dark:text-gray-200 font-semibold">{s.challenge_title}</span>
                    <span className="ml-2.5 text-xs text-gray-450 dark:text-gray-500 font-mono font-normal">
                      {formatRelativeDate(s.solved_at)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAskDelete(s.solve_id)}
                    aria-label="Delete Solve"
                    title="Delete Solve"
                    className="text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 h-8 w-8 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </AdminListSurface>
          </motion.div>
        )}

        {hasMore && (
          <div className="flex justify-center p-4 border-t border-gray-100 dark:border-gray-800">
            <Button onClick={() => onLoadMore(offset)} disabled={loadingMore} className="rounded-xl">
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </AdminPageSurface>
  )
}

export default SolversListCard
