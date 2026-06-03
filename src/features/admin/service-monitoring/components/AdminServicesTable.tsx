import Link from 'next/link'
import { Copy, ExternalLink, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { AdminEmptyState, AdminPageSurface, AdminTableSurface } from '@/features/admin/ui'
import {
  formatDateTime,
  formatDuration,
  getRemainingSeconds,
  getServiceEndpoints,
  getServiceStatus,
  getServiceType,
} from '../lib/admin-services-utils'
import type { AdminServiceAction, AdminServiceRow } from '../types'
import AdminServiceActions from './AdminServiceActions'
import AdminServiceStatusBadge from './AdminServiceStatusBadge'

type AdminServicesTableProps = {
  rows: AdminServiceRow[]
  isGlobalAdmin: boolean
  actionLoading: Record<string, AdminServiceAction | null>
  onAction: (row: AdminServiceRow, action: AdminServiceAction) => void
  onView: (row: AdminServiceRow) => void
}

function copyEndpoint(text: string) {
  navigator.clipboard?.writeText(text)
  toast.success('Copied endpoint')
}

export default function AdminServicesTable({
  rows,
  isGlobalAdmin,
  actionLoading,
  onAction,
  onView,
}: AdminServicesTableProps) {
  if (rows.length === 0) {
    return (
      <AdminPageSurface>
        <div className="p-5">
          <AdminEmptyState
            title="No services found"
            description="Try adjusting filters, or add NXCTL services to challenges first."
          />
        </div>
      </AdminPageSurface>
    )
  }

  return (
    <AdminPageSurface>
      <AdminTableSurface>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200/80 hover:bg-transparent dark:border-gray-800">
              <TableHead className="pl-6">Service / Instance</TableHead>
              <TableHead>Challenge</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const status = getServiceStatus(row)
              const remaining = getRemainingSeconds(row)
              const endpoints = getServiceEndpoints(row)
              const primaryEndpoint = endpoints[0]
              const serviceType = getServiceType(row)

              return (
                <TableRow
                  key={row.id}
                  className="border-b border-gray-100/80 transition-colors duration-150 ease-in-out last:border-b-0 hover:bg-blue-50/40 dark:border-gray-800/70 dark:hover:bg-blue-900/10"
                >
                  <TableCell className="pl-6">
                    <div className="min-w-[210px] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-gray-900 dark:text-gray-100">
                          {row.service.name}
                        </span>
                        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300">
                          {serviceType}
                        </Badge>
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {row.details?.runtime.container_id || 'No container id'}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="min-w-[180px] space-y-1">
                      <Link
                        href={`/admin/challenges?search=${encodeURIComponent(row.challenge.title)}`}
                        className="block truncate font-semibold text-blue-600 hover:underline dark:text-blue-300"
                      >
                        {row.challenge.title}
                      </Link>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="border-gray-300/80 bg-gray-100/60 text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
                          {row.challenge.category || 'Uncategorized'}
                        </Badge>
                        <Badge variant="outline" className="border-gray-300/80 bg-gray-100/60 text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
                          {row.challenge.difficulty || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {row.event?.name || 'Main'}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <AdminServiceStatusBadge status={status} />
                      {row.error && (
                        <div className="max-w-[220px] truncate text-xs text-red-600 dark:text-red-300" title={row.error}>
                          {row.error}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {primaryEndpoint ? (
                      <div className="flex max-w-[260px] items-center gap-2">
                        <code className="min-w-0 truncate rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs text-blue-700 dark:text-blue-300">
                          {primaryEndpoint.label}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 rounded-lg"
                          onClick={() => copyEndpoint(primaryEndpoint.copyText)}
                          aria-label="Copy endpoint"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {primaryEndpoint.isHttp && (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg">
                            <a href={primaryEndpoint.endpoint} target="_blank" rel="noreferrer" aria-label="Open endpoint">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right text-xs font-semibold tabular-nums text-muted-foreground">
                    {formatDuration(remaining)}
                  </TableCell>

                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDateTime(row.fetchedAt)}
                  </TableCell>

                  <TableCell className="pr-6">
                    <div className="flex min-w-[360px] flex-wrap items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg px-2.5 text-xs"
                        onClick={() => onView(row)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <AdminServiceActions
                        row={row}
                        isGlobalAdmin={isGlobalAdmin}
                        loadingAction={actionLoading[row.id] ?? null}
                        onAction={onAction}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </AdminTableSurface>
    </AdminPageSurface>
  )
}
