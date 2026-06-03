import { Badge } from '@/shared/ui'
import type { AdminServiceStatus } from '../types'

const STATUS_LABEL: Record<AdminServiceStatus, string> = {
  running: 'Running',
  stopped: 'Stopped',
  expired: 'Expired',
  error: 'Error',
  unknown: 'Unknown',
}

const STATUS_CLASS: Record<AdminServiceStatus, string> = {
  running: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  stopped: 'border-gray-300/80 bg-gray-100/60 text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300',
  expired: 'border-yellow-500/25 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  error: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
  unknown: 'border-gray-300/80 bg-gray-100/60 text-gray-500 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400',
}

type AdminServiceStatusBadgeProps = {
  status: AdminServiceStatus
}

export default function AdminServiceStatusBadge({ status }: AdminServiceStatusBadgeProps) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
