import type { Challenge, Event } from '@/shared/types'
import type { NxctlServiceEntry } from '@/features/challenges/lib/nxctl-services'

export type AdminServiceStatus = 'running' | 'stopped' | 'expired' | 'error' | 'unknown'

export type AdminServiceAction = 'up' | 'down' | 'restart' | 'extend'

export type AdminServiceEndpoint = {
  key: string
  endpoint: string
  label: string
  copyText: string
  type: string
  provider: string
  isHttp: boolean
}

export type AdminNxctlStatusDetail = {
  challenge: {
    name: string
    type: string | null
    can_restart: boolean | null
  }
  runtime: {
    status: string
    container_id: string | null
    remaining_seconds: number | null
    can_restart: boolean | null
    restart_cooldown: number
    restart: unknown
    extend_cooldown: number
    extend: unknown
  }
  exports: unknown[]
  raw: unknown
}

export type AdminServiceRow = {
  id: string
  service: NxctlServiceEntry
  challenge: Challenge
  event: Event | null
  details: AdminNxctlStatusDetail | null
  error: string | null
  fetchedAt: number | null
}

export type AdminServicesFilters = {
  search: string
  status: 'all' | AdminServiceStatus
  eventId: string
  category: string
  difficulty: string
  type: string
}

export type AdminServicesSummaryCounts = {
  total: number
  running: number
  stopped: number
  expired: number
  error: number
  challengesWithService: number
}
