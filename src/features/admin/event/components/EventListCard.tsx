import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/shared/ui'
import { AdminPageSurface, AdminListSurface, AdminEmptyState } from '@/features/admin/ui'
import type { Event } from '../types'

interface EventListCardProps {
  events: Event[]
  onEdit: (evt: Event) => void
  onDelete: (evt: Event) => void
}

const EventListCard: React.FC<EventListCardProps> = ({ events, onEdit, onDelete }) => {
  return (
    <AdminPageSurface>
      {events.length === 0 ? (
        <div className="p-6">
          <AdminEmptyState
            title="No events yet"
            description="Create your first event to get started."
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AdminListSurface>
            {events.map((evt) => (
              <div
                key={evt.id}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-white/40 dark:hover:bg-gray-800/10 transition-colors duration-150"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {evt.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {evt.description || 'No description'}
                  </div>
                  <div className="text-xs text-gray-450 dark:text-gray-500 mt-1.5 font-medium flex items-center gap-1.5 flex-wrap">
                    <span>Start: {evt.start_time ? new Date(evt.start_time).toLocaleString() : '-'}</span>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <span>End: {evt.end_time ? new Date(evt.end_time).toLocaleString() : '-'}</span>
                    {evt.always_show_challenges && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-blue-500/80 dark:text-blue-400/80 font-bold">
                          Always show challenges
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => onEdit(evt)} className="rounded-xl">
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(evt)} className="rounded-xl">
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </AdminListSurface>
        </motion.div>
      )}
    </AdminPageSurface>
  )
}

export default EventListCard
