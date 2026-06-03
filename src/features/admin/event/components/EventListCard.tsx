import React from 'react'
import { motion } from 'framer-motion'
import { Inbox, CalendarDays } from 'lucide-react'
import { Button } from '@/shared/ui'
import { EmptyState } from '@/shared/components'
import { AdminPanel } from '@/features/admin/ui'
import type { Event } from '../types'

interface EventListCardProps {
  events: Event[]
  onAdd: () => void
  onEdit: (evt: Event) => void
  onDelete: (evt: Event) => void
}

const EventListCard: React.FC<EventListCardProps> = ({ events, onAdd, onEdit, onDelete }) => {
  const addEventAction = (
    <Button onClick={onAdd} size="sm" className="rounded-xl">
      + Add Event
    </Button>
  )

  return (
    <AdminPanel title="Event List" icon={CalendarDays} action={addEventAction}>
      {events.length === 0 ? (
        <div className="py-6 border border-dashed border-gray-200/80 dark:border-gray-800/80 rounded-2xl bg-white/20 dark:bg-black/5 flex items-center justify-center">
          <EmptyState
            icon={<Inbox className="w-full h-full text-gray-400 dark:text-gray-500" />}
            title="No events yet"
            description="Create your first event to get started."
            containerHeight="py-2"
          />
        </div>
      ) : (
        <motion.div
          className="divide-y divide-gray-150 dark:divide-gray-800/80 border border-gray-200/80 dark:border-gray-800/80 rounded-xl overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {events.map((evt) => (
            <div key={evt.id} className="px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/40 dark:bg-[#111622]/40 hover:bg-white/80 dark:hover:bg-[#111622]/80 transition-colors duration-150">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">{evt.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{evt.description || 'No description'}</div>
                <div className="text-xs text-gray-450 dark:text-gray-500 mt-1.5 font-medium flex items-center gap-1.5 flex-wrap">
                  <span>Start: {evt.start_time ? new Date(evt.start_time).toLocaleString() : '-'}</span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <span>End: {evt.end_time ? new Date(evt.end_time).toLocaleString() : '-'}</span>
                  {evt.always_show_challenges && (
                    <>
                      <span className="text-gray-300 dark:text-gray-700">•</span>
                      <span className="text-blue-500/80 dark:text-blue-400/80 font-bold">Always show challenges</span>
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
        </motion.div>
      )}
    </AdminPanel>
  )
}

export default EventListCard

