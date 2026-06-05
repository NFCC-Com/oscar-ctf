"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Copy, Eye, ShieldCheck } from 'lucide-react'
import { Loader } from '@/shared/components'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { DIALOG_CONTENT_CLASS_4XL } from '@/shared/styles/dialog'
import { cn } from '@/shared/lib/utils'
import { formatRelativeDate } from '@/shared/lib'
import { getAuditLogs, type AuditLogEntry } from '@/features/logs/lib/audit-service'
import {
  ADMIN_ROW_CLASS,
  AdminDataSurface,
  AdminEmptyState,
  AdminFilterInput,
  AdminFilterSelect,
  AdminFilterToolbar,
  AdminStatusBadge,
  AdminStickyToolbar,
  AdminTableSurface,
} from '../../ui'

interface AuditLogListProps {
  logs?: AuditLogEntry[]
  isLoading?: boolean
}

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'PUBLISH', label: 'Publish' },
  { value: 'UNPUBLISH', label: 'Unpublish' },
  { value: 'GRANT_ADMIN', label: 'Grant Admin' },
  { value: 'REVOKE_ADMIN', label: 'Revoke Admin' },
  { value: 'ADD_MEMBER', label: 'Add Member' },
  { value: 'REMOVE_MEMBER', label: 'Remove Member' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
]

const ENTITY_OPTIONS = [
  { value: 'all', label: 'All entities' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'event', label: 'Event' },
  { value: 'event_member', label: 'Event Member' },
  { value: 'event_join_request', label: 'Join Request' },
  { value: 'role', label: 'Role' },
  { value: 'solve', label: 'Solve' },
]

const LIMIT_OPTIONS = [25, 50, 100, 250]
const SENSITIVE_FIELD_PATTERN = /(password|token|session|secret|credential|flag|join_key|key)$/i
const SENSITIVE_FIELD_NAMES = new Set(['flag', 'flag_hash', 'join_key', 'services'])

function getActionStyle(action: string) {
  switch (action) {
    case 'CREATE': return { tone: 'success' as const, color: 'text-green-500', icon: '+' }
    case 'UPDATE': return { tone: 'info' as const, color: 'text-blue-500', icon: '~' }
    case 'DELETE': return { tone: 'danger' as const, color: 'text-red-500', icon: 'x' }
    case 'PUBLISH': return { tone: 'success' as const, color: 'text-emerald-500', icon: '^' }
    case 'UNPUBLISH': return { tone: 'warning' as const, color: 'text-yellow-500', icon: 'v' }
    case 'APPROVE': return { tone: 'success' as const, color: 'text-emerald-500', icon: 'ok' }
    case 'REJECT': return { tone: 'danger' as const, color: 'text-red-500', icon: '!' }
    default: return { tone: 'neutral' as const, color: 'text-gray-500', icon: '-' }
  }
}

function toIsoOrNull(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function getFieldValue(data: Record<string, unknown> | null, field: string) {
  if (!data || !(field in data)) return null
  return data[field]
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isSensitiveField(field: string) {
  const normalized = field.toLowerCase()
  return SENSITIVE_FIELD_NAMES.has(normalized) || SENSITIVE_FIELD_PATTERN.test(normalized)
}

function sanitizeRecord(data: Record<string, unknown> | null) {
  if (!data) return null
  return Object.fromEntries(Object.entries(data).filter(([key]) => !isSensitiveField(key)))
}

function formatPrimitive(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  return String(value)
}

function formatFieldLabel(field: string) {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatJakartaDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
    timeZoneName: 'short',
  }).format(date)
}

function shortenValue(value: string | null | undefined, start = 8, end = 5) {
  if (!value) return '-'
  if (value.length <= start + end + 3) return value
  return `${value.slice(0, start)}...${value.slice(-end)}`
}

function parseUserAgent(userAgent: string | null | undefined) {
  const ua = userAgent || ''
  if (!ua) return { browser: 'Unknown browser', os: 'Unknown OS' }

  const edge = ua.match(/Edg\/([\d.]+)/)
  const chrome = ua.match(/Chrome\/([\d.]+)/)
  const firefox = ua.match(/Firefox\/([\d.]+)/)
  const safari = ua.match(/Version\/([\d.]+).*Safari/)

  const browser = edge
    ? `Edge ${edge[1].split('.')[0]}`
    : chrome
      ? `Chrome ${chrome[1].split('.')[0]}`
      : firefox
        ? `Firefox ${firefox[1].split('.')[0]}`
        : safari
          ? `Safari ${safari[1].split('.')[0]}`
          : 'Unknown browser'

  const os = /Windows NT 10/.test(ua)
    ? 'Windows 10/11'
    : /Windows NT 6\.3/.test(ua)
      ? 'Windows 8.1'
      : /Windows NT 6\.1/.test(ua)
        ? 'Windows 7'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Android/.test(ua)
            ? 'Android'
            : /iPhone|iPad/.test(ua)
              ? 'iOS'
              : /Linux/.test(ua)
                ? 'Linux'
                : 'Unknown OS'

  return { browser, os }
}

function CopyableValue({ value, compact = true }: { value: string | null | undefined; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const display = compact ? shortenValue(value) : (value || '—')
  const canCopy = Boolean(value)

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 align-middle" title={value || undefined}>
      <span className="min-w-0 truncate font-mono text-xs font-semibold text-gray-700 dark:text-gray-200">
        {display}
      </span>
      {canCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-blue-500/10 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:text-blue-300"
          aria-label="Copy value"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </span>
  )
}

function AuditSummary({
  log,
  parsedUserAgent,
}: {
  log: AuditLogEntry
  parsedUserAgent: ReturnType<typeof parseUserAgent>
}) {
  const rows = [
    { label: 'Actor name', value: log.actor_snapshot },
    { label: 'Actor ID', value: <CopyableValue value={log.actor_user_id} /> },
    { label: 'Actor role', value: log.actor_role === 'global_admin' ? 'Global Admin' : 'Admin' },
    { label: 'Action', value: log.action },
    { label: 'Entity type', value: formatFieldLabel(log.entity_type) },
    { label: 'Entity ID', value: <CopyableValue value={log.entity_id} /> },
    { label: 'IP address', value: log.ip_address || '—' },
    { label: 'Created time', value: formatJakartaDate(log.created_at) },
    { label: 'Request ID', value: log.request_id ? <CopyableValue value={log.request_id} /> : '—' },
    { label: 'Browser', value: `${parsedUserAgent.browser} - ${parsedUserAgent.os}` },
  ]

  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white/70 p-4 shadow-sm dark:border-gray-800/70 dark:bg-[#0d121d]/70">
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Activity Summary</h3>
      <dl className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs font-semibold text-gray-500 dark:text-gray-400">{row.label}</dt>
            <dd className="mt-1 min-w-0 break-words text-sm font-semibold text-gray-800 dark:text-gray-100">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function AuditValue({ value, tone = 'neutral' }: { value: unknown; tone?: 'before' | 'after' | 'neutral' }) {
  const toneClass = tone === 'before'
    ? 'border-red-500/15 bg-red-500/5'
    : tone === 'after'
      ? 'border-emerald-500/15 bg-emerald-500/5'
      : 'border-gray-200/70 bg-gray-50/70 dark:border-gray-800 dark:bg-[#0d121d]/70'

  if (typeof value === 'boolean') {
    return (
      <AdminStatusBadge tone={value ? 'success' : 'muted'}>
        {value ? 'Yes' : 'No'}
      </AdminStatusBadge>
    )
  }

  if (Array.isArray(value) || isPlainRecord(value)) {
    return (
      <pre className={cn('whitespace-pre-wrap break-words rounded-xl border p-3 font-mono text-xs leading-relaxed text-gray-700 dark:text-gray-200', toneClass)}>
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return (
    <div className={cn('min-h-10 break-words rounded-xl border px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200', toneClass)}>
      {formatPrimitive(value)}
    </div>
  )
}

function ChangedFields({ log, fields }: { log: AuditLogEntry; fields: string[] }) {
  const visibleFields = fields.filter((field) => !isSensitiveField(field))

  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white/70 shadow-sm dark:border-gray-800/70 dark:bg-[#0d121d]/70">
      <div className="border-b border-gray-200/70 px-4 py-3 dark:border-gray-800/70">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Changed Fields</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Only fields that changed are shown.</p>
      </div>

      {visibleFields.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <div className="hidden grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 lg:grid">
            <span>Field</span>
            <span>Before</span>
            <span>After</span>
          </div>
          {visibleFields.map((field) => (
            <div key={field} className="grid gap-3 px-4 py-4 lg:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatFieldLabel(field)}</div>
                <div className="mt-1 font-mono text-[11px] text-gray-500">{field}</div>
              </div>
              <div className="min-w-0">
                <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 lg:hidden">Before</div>
                <AuditValue value={getFieldValue(log.before_data, field)} tone="before" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 lg:hidden">After</div>
                <AuditValue value={getFieldValue(log.after_data, field)} tone="after" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No changed fields were recorded.</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This action may only contain metadata.</p>
        </div>
      )}
    </section>
  )
}

function SnapshotViewer({ before, after }: { before: Record<string, unknown> | null; after: Record<string, unknown> | null }) {
  const [activeSnapshot, setActiveSnapshot] = useState<'before' | 'after'>('after')
  const data = activeSnapshot === 'before' ? sanitizeRecord(before) : sanitizeRecord(after)
  const entries = data ? Object.entries(data).filter(([key]) => !isSensitiveField(key)) : []

  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white/70 shadow-sm dark:border-gray-800/70 dark:bg-[#0d121d]/70">
      <div className="flex flex-col gap-3 border-b border-gray-200/70 px-4 py-3 dark:border-gray-800/70 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Full Snapshot</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sensitive fields are hidden from this view.</p>
        </div>
        <div className="inline-flex w-fit rounded-xl border border-gray-200 bg-white/70 p-1 dark:border-gray-800 dark:bg-gray-900/70">
          {(['before', 'after'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveSnapshot(item)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                activeSnapshot === item
                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {entries.length > 0 ? (
        <dl className="grid gap-x-6 gap-y-4 p-4 md:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="text-xs font-semibold text-gray-500 dark:text-gray-400">{formatFieldLabel(key)}</dt>
              <dd className="mt-1 min-w-0">
                <AuditValue value={value} />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No snapshot data available.</div>
      )}
    </section>
  )
}

function RequestDetails({
  log,
  parsedUserAgent,
}: {
  log: AuditLogEntry
  parsedUserAgent: ReturnType<typeof parseUserAgent>
}) {
  const metadata = sanitizeRecord(log.metadata)
  const metadataEntries = metadata ? Object.entries(metadata).filter(([key]) => !isSensitiveField(key)) : []

  return (
    <details className="rounded-2xl border border-gray-200/70 bg-white/70 shadow-sm dark:border-gray-800/70 dark:bg-[#0d121d]/70">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-gray-900 outline-none transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-gray-100 dark:hover:text-blue-300">
        Request Details and Metadata
      </summary>
      <div className="grid gap-4 border-t border-gray-200/70 p-4 dark:border-gray-800/70 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">IP Address</div>
            <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{log.ip_address || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Browser</div>
            <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{parsedUserAgent.browser}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Operating System</div>
            <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{parsedUserAgent.os}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Request ID</div>
            <div className="mt-1"><CopyableValue value={log.request_id} /></div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">User Agent</div>
            <div className="mt-1 break-words rounded-xl bg-gray-50/80 p-3 font-mono text-xs text-gray-700 dark:bg-gray-900/70 dark:text-gray-200">
              {log.user_agent || '—'}
            </div>
          </div>
          {metadataEntries.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Metadata</div>
              <dl className="mt-2 space-y-2">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="grid gap-1 sm:grid-cols-[140px_1fr]">
                    <dt className="text-xs font-bold text-gray-500 dark:text-gray-400">{formatFieldLabel(key)}</dt>
                    <dd className="break-words text-sm font-semibold text-gray-800 dark:text-gray-100">{formatPrimitive(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </details>
  )
}

function AuditLogDetailDialog({
  log,
  onOpenChange,
}: {
  log: AuditLogEntry | null
  onOpenChange: (open: boolean) => void
}) {
  const fields = log?.changed_fields ?? []
  const actionStyle = log ? getActionStyle(log.action) : getActionStyle('')
  const parsedUserAgent = parseUserAgent(log?.user_agent)

  return (
    <Dialog open={Boolean(log)} onOpenChange={onOpenChange}>
      <DialogContent className={`${DIALOG_CONTENT_CLASS_4XL} max-h-[90dvh] overflow-y-auto scroll-hidden`}>
        {log && (
          <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
            <DialogHeader className="pr-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge tone={actionStyle.tone}>{log.action}</AdminStatusBadge>
                    <AdminStatusBadge tone={log.actor_role === 'global_admin' ? 'info' : 'neutral'}>
                      {log.actor_role === 'global_admin' ? 'Global Admin' : 'Admin'}
                    </AdminStatusBadge>
                  </div>
                  <div>
                    <DialogTitle className="text-xl">Admin Log Detail</DialogTitle>
                    <DialogDescription className="mt-2">
                      {formatFieldLabel(log.entity_type)} - <span title={log.entity_id || undefined}>{shortenValue(log.entity_id)}</span>
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 text-left lg:text-right">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200" title={log.created_at}>
                    {formatJakartaDate(log.created_at)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit rounded-xl"
                    onClick={() => onOpenChange(false)}
                  >
                    Back to list
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <AuditSummary log={log} parsedUserAgent={parsedUserAgent} />
            <ChangedFields log={log} fields={fields} />
            <SnapshotViewer before={log.before_data} after={log.after_data} />
            <RequestDetails log={log} parsedUserAgent={parsedUserAgent} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

const AuditLogList: React.FC<AuditLogListProps> = ({ logs: propLogs, isLoading: propLoading }) => {
  const [internalLogs, setInternalLogs] = useState<AuditLogEntry[]>([])
  const [internalLoading, setInternalLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [limit, setLimit] = useState(50)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [action, setAction] = useState('all')
  const [entityType, setEntityType] = useState('all')
  const [actorSearch, setActorSearch] = useState('')
  const [entityId, setEntityId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const logs = propLogs || internalLogs
  const isLoading = propLoading ?? internalLoading
  const pageCount = Math.max(1, Math.ceil(totalCount / limit))
  const safePage = Math.min(page, pageCount)
  const offset = (safePage - 1) * limit

  useEffect(() => {
    if (propLogs) return

    const fetchLogs = async () => {
      setInternalLoading(true)
      try {
        const result = await getAuditLogs(limit, offset, {
          actorSearch: actorSearch.trim() || null,
          actions: action === 'all' ? null : [action],
          entityType: entityType === 'all' ? null : entityType,
          entityId: entityId.trim() || null,
          from: toIsoOrNull(fromDate),
          to: toIsoOrNull(toDate),
        })
        setInternalLogs(result.logs)
        setTotalCount(result.totalCount)
      } finally {
        setInternalLoading(false)
      }
    }

    fetchLogs()
  }, [action, actorSearch, entityId, entityType, fromDate, limit, offset, propLogs, toDate])

  useEffect(() => {
    setPage(1)
  }, [action, actorSearch, entityId, entityType, fromDate, limit, toDate])

  const resultLabel = useMemo(() => {
    if (totalCount === 0) return 'Showing 0 logs'
    const first = offset + 1
    const last = Math.min(offset + logs.length, totalCount)
    return `Showing ${first}-${last} of ${totalCount}`
  }, [logs.length, offset, totalCount])

  if (isLoading) return (
    <AdminDataSurface>
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    </AdminDataSurface>
  )

  return (
    <>
      <AdminDataSurface
        toolbar={(
          <AdminStickyToolbar
            filters={(
              <AdminFilterToolbar
                actions={(
                  <>
                    <AdminFilterSelect
                      value={action}
                      defaultValue="all"
                      onValueChange={setAction}
                      className="w-full sm:w-[150px]"
                      options={ACTION_OPTIONS}
                    />
                    <AdminFilterSelect
                      value={entityType}
                      defaultValue="all"
                      onValueChange={setEntityType}
                      className="w-full sm:w-[160px]"
                      options={ENTITY_OPTIONS}
                    />
                    <AdminFilterSelect
                      value={String(limit)}
                      defaultValue="50"
                      onValueChange={(value) => setLimit(Number(value))}
                      className="w-full sm:w-[110px]"
                      options={LIMIT_OPTIONS.map((value) => ({ value: String(value), label: `${value} rows` }))}
                    />
                  </>
                )}
              >
                <div className="grid w-full gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <AdminFilterInput
                    value={actorSearch}
                    defaultValue=""
                    onChange={setActorSearch}
                    placeholder="Admin name/email..."
                    wrapperClassName="max-w-none"
                    icon={<ShieldCheck className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                  />
                  <AdminFilterInput
                    value={entityId}
                    defaultValue=""
                    onChange={setEntityId}
                    placeholder="Entity ID..."
                    wrapperClassName="max-w-none"
                  />
                  <Input
                    type="datetime-local"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="h-9 rounded-xl text-xs font-semibold"
                  />
                  <Input
                    type="datetime-local"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="h-9 rounded-xl text-xs font-semibold"
                  />
                </div>
              </AdminFilterToolbar>
            )}
          />
        )}
        empty={logs.length === 0 ? (
          <AdminEmptyState
            title="No admin audit logs match the current filters"
            description="Try adjusting actor, action, entity, or date filters."
          />
        ) : null}
      >
        <AdminTableSurface>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200/80 hover:bg-transparent dark:border-gray-800">
                <TableHead className="px-5">Action</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Changes</TableHead>
                <TableHead className="text-right">Time</TableHead>
                <TableHead className="w-[86px] px-5 text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, idx) => {
                const style = getActionStyle(log.action)

                return (
                  <motion.tr
                    key={log.id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={ADMIN_ROW_CLASS}
                  >
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(style.color, 'font-black')}>{style.icon}</span>
                        <AdminStatusBadge tone={style.tone}>{log.action}</AdminStatusBadge>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="max-w-[220px] truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {log.actor_snapshot}
                      </div>
                      <AdminStatusBadge tone={log.actor_role === 'global_admin' ? 'info' : 'neutral'} className="mt-1">
                        {log.actor_role}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{log.entity_type}</div>
                      <div className="max-w-[220px] truncate font-mono text-[10px] text-gray-500">{log.entity_id || '-'}</div>
                    </TableCell>
                    <TableCell className="max-w-[320px] py-3">
                      <div className="truncate text-xs font-semibold text-gray-600 dark:text-gray-300">
                        {log.changed_fields.length > 0 ? log.changed_fields.join(', ') : 'No field diff'}
                      </div>
                      <div className="truncate font-mono text-[10px] text-gray-500">
                        {log.ip_address || 'unknown ip'} {log.request_id ? ` - ${log.request_id}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-[10px] text-gray-500">
                      {formatRelativeDate(log.created_at)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => setSelectedLog(log)}
                        aria-label="View audit log details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </AdminTableSurface>

        <div className="mx-5 my-4 flex flex-col gap-3 border-t border-gray-200/80 pt-4 text-sm text-muted-foreground dark:border-gray-800/80 sm:flex-row sm:items-center sm:justify-between">
          <span>{resultLabel}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={safePage <= 1}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="min-w-20 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
              {safePage} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
              disabled={safePage >= pageCount}
              className="rounded-xl"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AdminDataSurface>

      <AuditLogDetailDialog log={selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)} />
    </>
  )
}

export default AuditLogList
