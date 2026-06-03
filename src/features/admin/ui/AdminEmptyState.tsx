import React from 'react'
import { Inbox } from 'lucide-react'
import EmptyState from '@/shared/components/EmptyState'

interface AdminEmptyStateProps {
  title?: string
  description?: React.ReactNode
  action?: React.ReactNode
}

export default function AdminEmptyState({
  title = "No data found",
  description = "Try adjusting your filters or search terms.",
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="py-10 border border-dashed border-gray-200/80 dark:border-gray-800/80 rounded-2xl bg-white/20 dark:bg-black/5 flex items-center justify-center">
      <EmptyState
        icon={<Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />}
        title={title}
        description={description}
        containerHeight="py-2"
        action={action}
      />
    </div>
  )
}
