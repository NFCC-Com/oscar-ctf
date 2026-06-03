import type { Challenge, Event } from '@/shared/types'
import { parseNxctlService } from '@/features/challenges/lib/nxctl-services'
import type {
  AdminNxctlStatusDetail,
  AdminServiceEndpoint,
  AdminServiceRow,
  AdminServicesFilters,
  AdminServicesSummaryCounts,
  AdminServiceStatus,
} from '../types'

const CHALLENGE_KEY_HEADER = 'X-NXCTL-Challenge-Key'

export function buildNxctlHeaders(serviceKey?: string, json = false, accessToken?: string | null) {
  const headers: Record<string, string> = {}
  if (json) headers['Content-Type'] = 'application/json'
  if (serviceKey) headers[CHALLENGE_KEY_HEADER] = serviceKey
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  return headers
}

export function buildNxctlStatusHeaders(rows: AdminServiceRow[]): Record<string, string> {
  const keys = Array.from(new Set(
    rows
      .map((row) => row.service.key.trim())
      .filter(Boolean)
  ))

  if (keys.length === 0) return {}
  return { [CHALLENGE_KEY_HEADER]: keys.join(',') }
}

export function buildNxctlStatusUrl(rows: AdminServiceRow[]) {
  const params = new URLSearchParams({ action: 'status' })
  const names = Array.from(new Set(
    rows
      .map((row) => row.service.name.trim())
      .filter(Boolean)
  ))

  if (names.length > 0) params.set('filter', names.join(','))
  return `/api/nxctl?${params.toString()}`
}

export function buildServiceRows(challenges: Challenge[], events: Event[]): AdminServiceRow[] {
  const eventById = new Map(events.map((event) => [String(event.id), event]))

  return challenges.flatMap((challenge) => {
    const rawServices = Array.isArray(challenge.services) ? challenge.services : []

    return rawServices
      .map(parseNxctlService)
      .filter((service) => service.name.trim() !== '')
      .map((service, index) => ({
        id: `${challenge.id}:${service.name}:${index}`,
        service,
        challenge,
        event: challenge.event_id ? eventById.get(String(challenge.event_id)) ?? null : null,
        details: null,
        error: null,
        fetchedAt: null,
      }))
  })
}

function firstBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }
  }

  return null
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }

  return null
}

function getNxctlStatusName(item: any) {
  return String(item?.name || item?.challenge?.name || '').trim()
}

export function normalizeNxctlStatusDetail(item: any): AdminNxctlStatusDetail {
  const restart = item?.runtime?.restart || item?.restart || null
  const restartEnabled = firstBoolean(
    restart?.enabled,
    item?.runtime?.can_restart,
    item?.challenge?.can_restart,
    item?.can_restart
  )
  const restartCooldown = firstNumber(
    restart?.cooldown_remaining_seconds,
    item?.runtime?.restart_cooldown,
    item?.restart_cooldown
  )
  const remainingSeconds = firstNumber(
    item?.runtime?.remaining_seconds,
    item?.remaining_seconds
  )
  const extendCooldown = firstNumber(
    item?.runtime?.extend_cooldown,
    item?.extend_cooldown
  )

  return {
    challenge: {
      name: getNxctlStatusName(item),
      type: item?.type || item?.challenge?.type || null,
      can_restart: restartEnabled,
    },
    runtime: {
      status: String(item?.runtime?.status || item?.status || 'unknown'),
      container_id: item?.runtime?.container_id || item?.container_id || null,
      remaining_seconds: remainingSeconds,
      can_restart: restartEnabled,
      restart_cooldown: restartCooldown ?? 0,
      restart,
      extend_cooldown: extendCooldown ?? 0,
      extend: item?.runtime?.extend || item?.extend || null,
    },
    exports: Array.isArray(item?.exports) ? item.exports : [],
    raw: item,
  }
}

export function getNxctlStatusMap(data: unknown) {
  const statusByName = new Map<string, AdminNxctlStatusDetail>()
  if (!Array.isArray(data)) return statusByName

  data.forEach((item) => {
    const name = getNxctlStatusName(item)
    if (name) statusByName.set(name, normalizeNxctlStatusDetail(item))
  })

  return statusByName
}

function stringifyNxctlDetail(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return String(value)

  const detail = value as Record<string, unknown>
  const code = typeof detail.error === 'string' ? detail.error : ''
  const message = typeof detail.message === 'string' ? detail.message : ''

  if (code === 'challenge_not_found_or_not_authorized') {
    return 'Challenge not found, disabled, or missing/invalid challenge key.'
  }

  if (code === 'challenge_not_found') return 'Challenge not found in NXCTL.'
  if (code === 'invalid_or_missing_api_token') return 'NXCTL API token is missing or invalid.'
  if (code === 'invalid_or_missing_admin_secret') return 'NXCTL admin secret is missing or invalid.'
  if (code === 'api_admin_secret_not_configured') return 'NXCTL admin secret is not configured.'
  if (code === 'restart_disabled') return 'Restart is disabled for this challenge.'
  if (message) return message
  if (code) return code

  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

export function getNxctlErrorMessage(data: any) {
  return (
    stringifyNxctlDetail(data?.detail) ||
    stringifyNxctlDetail(data?.error) ||
    stringifyNxctlDetail(data?.message) ||
    'Unknown NXCTL error'
  )
}

export function getRemainingSeconds(row: AdminServiceRow, now = Date.now()) {
  const value = row.details?.runtime.remaining_seconds
  if (value === null || value === undefined || !row.fetchedAt) return null

  const elapsed = Math.max(0, (now - row.fetchedAt) / 1000)
  return Math.max(0, value - elapsed)
}

export function getServiceStatus(row: AdminServiceRow, now = Date.now()): AdminServiceStatus {
  if (row.error) return 'error'

  const runtimeStatus = row.details?.runtime.status?.toLowerCase()
  if (!runtimeStatus) return 'unknown'

  if (runtimeStatus === 'running') {
    const remaining = getRemainingSeconds(row, now)
    if (remaining !== null && remaining <= 0) return 'expired'
    return 'running'
  }

  if (['down', 'stopped', 'exited', 'created', 'not_running'].includes(runtimeStatus)) {
    return 'stopped'
  }

  if (['error', 'unhealthy', 'failed'].includes(runtimeStatus)) return 'error'
  return 'unknown'
}

export function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined) return '-'
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const h = Math.floor(safeSeconds / 3600)
  const m = Math.floor((safeSeconds % 3600) / 60)
  const sec = safeSeconds % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export function formatDateTime(value?: string | number | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getExportEndpoint(item: any) {
  return String(item?.endpoint || item?.url || '').trim()
}

function isHttpEndpoint(endpoint: string) {
  return /^https?:\/\//i.test(endpoint)
}

function parseTcpEndpoint(endpoint: string) {
  const match = endpoint.match(/^tcp:\/\/([^/:]+):(\d+)/i)
  if (match) return { host: match[1], port: match[2] }

  const fallbackMatch = endpoint.match(/^([^/:]+):(\d+)$/i)
  return fallbackMatch ? { host: fallbackMatch[1], port: fallbackMatch[2] } : null
}

function toTcpCommand(endpoint: string) {
  const parsed = parseTcpEndpoint(endpoint)
  return parsed ? `nc ${parsed.host} ${parsed.port}` : endpoint
}

function toSshCommand(endpoint: string, user?: string) {
  const parsed = parseTcpEndpoint(endpoint)
  if (!parsed) return endpoint

  return `ssh ${user?.trim() || 'username'}@${parsed.host} -p ${parsed.port}`
}

function toSshCopyCommand(endpoint: string, user?: string) {
  const command = toSshCommand(endpoint, user)
  return command.startsWith('ssh ')
    ? command.replace(/^ssh\s+/, 'ssh -o StrictHostKeyChecking=no ')
    : command
}

export function getServiceEndpoints(row: AdminServiceRow): AdminServiceEndpoint[] {
  const exports = row.details?.exports || []
  const serviceType = String(row.details?.challenge.type || '').toLowerCase()

  return exports
    .map((item: any, index) => {
      const endpoint = getExportEndpoint(item)
      if (!endpoint) return null

      const endpointType = String(item?.type || serviceType || '').toLowerCase()
      const isHttp = isHttpEndpoint(endpoint)
      const isReturnedTcp =
        endpointType === 'tcp' ||
        endpoint.toLowerCase().startsWith('tcp://') ||
        (!isHttp && parseTcpEndpoint(endpoint) !== null)
      const isSsh = isReturnedTcp && row.service.options.type === 'ssh'
      const label = isSsh
        ? toSshCommand(endpoint, row.service.options.user)
        : isReturnedTcp
          ? toTcpCommand(endpoint)
          : endpoint

      return {
        key: `${row.id}:${index}`,
        endpoint,
        label,
        copyText: isSsh ? toSshCopyCommand(endpoint, row.service.options.user) : label,
        type: endpointType || (isHttp ? 'http' : isReturnedTcp ? 'tcp' : 'unknown'),
        provider: item?.provider ? String(item.provider) : '',
        isHttp,
      }
    })
    .filter((item): item is AdminServiceEndpoint => Boolean(item))
}

export function getServiceType(row: AdminServiceRow) {
  if (row.service.options.type) return row.service.options.type
  const endpoints = getServiceEndpoints(row)
  const firstEndpointType = endpoints[0]?.type
  return firstEndpointType || row.details?.challenge.type || 'unknown'
}

export function getUniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(
    values
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b))
}

export function getFilteredServiceRows(rows: AdminServiceRow[], filters: AdminServicesFilters, now = Date.now()) {
  const keyword = filters.search.trim().toLowerCase()

  return rows.filter((row) => {
    const status = getServiceStatus(row, now)
    const serviceType = getServiceType(row).toLowerCase()
    const eventId = row.event?.id || 'main'

    if (filters.status !== 'all' && status !== filters.status) return false
    if (filters.eventId !== 'all' && eventId !== filters.eventId) return false
    if (filters.category !== 'all' && row.challenge.category !== filters.category) return false
    if (filters.difficulty !== 'all' && row.challenge.difficulty !== filters.difficulty) return false
    if (filters.type !== 'all' && serviceType !== filters.type.toLowerCase()) return false

    if (!keyword) return true

    return [
      row.service.name,
      row.challenge.title,
      row.event?.name || 'Main',
      row.challenge.category,
      row.challenge.difficulty,
      serviceType,
      row.details?.runtime.container_id || '',
    ].some((value) => value.toLowerCase().includes(keyword))
  })
}

export function getServicesSummary(rows: AdminServiceRow[], now = Date.now()): AdminServicesSummaryCounts {
  const challengesWithService = new Set(rows.map((row) => row.challenge.id)).size
  const counts = rows.reduce(
    (acc, row) => {
      const status = getServiceStatus(row, now)
      if (status === 'running') acc.running += 1
      if (status === 'stopped') acc.stopped += 1
      if (status === 'expired') acc.expired += 1
      if (status === 'error') acc.error += 1
      return acc
    },
    { running: 0, stopped: 0, expired: 0, error: 0 }
  )

  return {
    total: rows.length,
    running: counts.running,
    stopped: counts.stopped,
    expired: counts.expired,
    error: counts.error,
    challengesWithService,
  }
}
