"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/shared/contexts/AuthContext'
import { getAdminScope, type AdminScope } from '@/features/admin/services/admin.service'
import { getChallengesList } from '@/shared/lib'
import { getEvents } from '@/features/events/services/event.service'
import type { Event } from '@/shared/types'
import {
  buildNxctlHeaders,
  buildNxctlStatusHeaders,
  buildNxctlStatusUrl,
  buildServiceRows,
  getNxctlErrorMessage,
  getNxctlStatusMap,
} from '../lib/admin-services-utils'
import type { AdminServiceAction, AdminServiceRow } from '../types'

export function useAdminServicesData() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const statusRunRef = useRef(0)

  const [adminScope, setAdminScope] = useState<AdminScope | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [serviceRows, setServiceRows] = useState<AdminServiceRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [accessReady, setAccessReady] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, AdminServiceAction | null>>({})

  const isAllowed = Boolean(adminScope?.is_global_admin || adminScope?.event_ids.length)
  const isGlobalAdmin = Boolean(adminScope?.is_global_admin)

  const loadStatus = useCallback(async (rows: AdminServiceRow[]) => {
    if (rows.length === 0) {
      setServiceRows([])
      return
    }

    const runId = statusRunRef.current + 1
    statusRunRef.current = runId
    setStatusLoading(true)

    try {
      const res = await fetch(buildNxctlStatusUrl(rows), {
        headers: buildNxctlStatusHeaders(rows),
      })
      const data = await res.json()
      if (statusRunRef.current !== runId) return

      if (!res.ok || !Array.isArray(data)) {
        const message = getNxctlErrorMessage(data)
        setServiceRows(rows.map((row) => ({
          ...row,
          details: null,
          error: message,
          fetchedAt: Date.now(),
        })))
        return
      }

      const statusByName = getNxctlStatusMap(data)
      const fetchedAt = Date.now()

      setServiceRows(rows.map((row) => {
        const detail = statusByName.get(row.service.name)
        return {
          ...row,
          details: detail ?? null,
          error: detail ? null : 'Service is not visible from NXCTL status. Check service name or challenge key.',
          fetchedAt,
        }
      }))
    } catch (error: any) {
      if (statusRunRef.current !== runId) return
      console.error('Failed to fetch NXCTL services status', error)
      const message = error?.message || 'Failed to fetch NXCTL services status'
      setServiceRows(rows.map((row) => ({
        ...row,
        details: null,
        error: message,
        fetchedAt: Date.now(),
      })))
    } finally {
      if (statusRunRef.current === runId) setStatusLoading(false)
    }
  }, [])

  const initServicesData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const scope = await getAdminScope()
      setAdminScope(scope)
      setAccessReady(true)

      if (!scope.is_global_admin && scope.event_ids.length === 0) {
        router.push('/challenges')
        return
      }

      const [challengeList, eventList] = await Promise.all([
        getChallengesList(undefined, true, 'all'),
        getEvents(),
      ])

      const allowedSet = new Set(scope.event_ids || [])
      const visibleEvents = scope.is_global_admin
        ? eventList
        : eventList.filter((event) => allowedSet.has(String(event.id)))
      const visibleChallenges = scope.is_global_admin
        ? challengeList
        : challengeList.filter((challenge) => {
          if (!challenge.event_id) return false
          return allowedSet.has(String(challenge.event_id))
        })

      setEvents(visibleEvents)
      const rows = buildServiceRows(visibleChallenges, visibleEvents)
      setServiceRows(rows)
      setActionLoading(Object.fromEntries(rows.map((row) => [row.id, null])))
      await loadStatus(rows)
    } catch (error) {
      console.error('Failed to load admin services data:', error)
      toast.error('Failed to load Services dashboard')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [loadStatus, router])

  const refresh = useCallback(async () => {
    await initServicesData(true)
  }, [initServicesData])

  const runServiceAction = useCallback(async (row: AdminServiceRow, action: AdminServiceAction) => {
    if (action === 'down' && !window.confirm(`Stop NXCTL service "${row.service.name}"?`)) return

    setActionLoading((prev) => ({ ...prev, [row.id]: action }))
    const actionLabel = action === 'up' ? 'start' : action
    const toastId = toast.loading(`${actionLabel}ing ${row.service.name}...`)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const res = await fetch('/api/nxctl', {
        method: 'POST',
        headers: buildNxctlHeaders(row.service.key, true, accessToken),
        body: JSON.stringify({ action, name: row.service.name }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(`Failed to ${actionLabel} ${row.service.name}: ${getNxctlErrorMessage(data)}`, { id: toastId })
        return
      }

      toast.success(`NXCTL service ${actionLabel} request completed`, { id: toastId })
      await new Promise((resolve) => setTimeout(resolve, 500))
      await loadStatus(serviceRows)
    } catch (error) {
      console.error(`Failed to run NXCTL ${action} for ${row.service.name}`, error)
      toast.error(`Failed to ${actionLabel} ${row.service.name}`, { id: toastId })
    } finally {
      setActionLoading((prev) => ({ ...prev, [row.id]: null }))
    }
  }, [loadStatus, serviceRows])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setAccessReady(true)
      router.push('/challenges')
      return
    }

    void initServicesData()
  }, [authLoading, initServicesData, router, user])

  return {
    user,
    authLoading,
    accessReady,
    isAllowed,
    isGlobalAdmin,
    adminScope,
    events,
    serviceRows,
    isLoading,
    isRefreshing,
    statusLoading,
    actionLoading,
    refresh,
    runServiceAction,
  }
}
