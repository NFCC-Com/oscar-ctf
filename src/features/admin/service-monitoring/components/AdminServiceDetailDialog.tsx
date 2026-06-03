import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import {
  formatDateTime,
  formatDuration,
  getRemainingSeconds,
  getServiceEndpoints,
  getServiceStatus,
} from '../lib/admin-services-utils'
import type { AdminServiceRow } from '../types'
import AdminServiceStatusBadge from './AdminServiceStatusBadge'

type AdminServiceDetailDialogProps = {
  row: AdminServiceRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200/70 bg-white/50 px-3 py-2.5 dark:border-gray-800/70 dark:bg-[#111622]/60">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </div>
    </div>
  )
}

export default function AdminServiceDetailDialog({
  row,
  open,
  onOpenChange,
}: AdminServiceDetailDialogProps) {
  if (!row) return null

  const status = getServiceStatus(row)
  const remaining = getRemainingSeconds(row)
  const endpoints = getServiceEndpoints(row)
  const raw = row.details?.raw || row.error || null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row.service.name}</DialogTitle>
          <DialogDescription>
            NXCTL service detail for {row.challenge.title}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem label="Status" value={<AdminServiceStatusBadge status={status} />} />
            <DetailItem label="Remaining" value={formatDuration(remaining)} />
            <DetailItem label="Challenge" value={row.challenge.title} />
            <DetailItem label="Event" value={row.event?.name || 'Main / no event'} />
            <DetailItem label="Container" value={row.details?.runtime.container_id || '-'} />
            <DetailItem label="Fetched" value={formatDateTime(row.fetchedAt)} />
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white/50 p-4 dark:border-gray-800/80 dark:bg-[#111622]/60">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Endpoints
            </div>
            {endpoints.length > 0 ? (
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <div
                    key={endpoint.key}
                    className="flex flex-col gap-2 rounded-lg border border-gray-200/70 bg-white/50 px-3 py-2 dark:border-gray-800/70 dark:bg-[#0d121d]/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <code className="min-w-0 truncate text-xs text-blue-700 dark:text-blue-300">
                      {endpoint.label}
                    </code>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => navigator.clipboard?.writeText(endpoint.copyText)}
                      >
                        Copy
                      </Button>
                      {endpoint.isHttp && (
                        <Button asChild variant="outline" size="sm" className="rounded-lg">
                          <a href={endpoint.endpoint} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No endpoint returned by NXCTL for this service.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200/80 bg-white/50 p-4 dark:border-gray-800/80 dark:bg-[#111622]/60">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Raw Status
            </div>
            <pre className="max-h-72 overflow-auto rounded-lg border border-gray-200/70 bg-gray-950 p-3 text-xs text-gray-100 dark:border-gray-800/70">
              {raw ? JSON.stringify(raw, null, 2) : 'No raw NXCTL status payload available.'}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
