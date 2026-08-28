'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCustomNxctlConfig } from '@/shared/lib/nxctl-node-config'

export interface ServiceHealth {
  name: string
  status: 'online' | 'degraded' | 'offline' | 'unconfigured' | 'loading'
  latencyMs?: number
  message?: string
  isCustom?: boolean
}

export interface SystemHealthState {
  database: ServiceHealth
  nxctl: ServiceHealth
  overall: 'online' | 'degraded' | 'offline' | 'loading'
  lastChecked: number | null
  isChecking: boolean
  checkHealth: () => Promise<void>
}

export function useSystemHealth(autoRefreshIntervalMs = 25000): SystemHealthState {
  const [database, setDatabase] = useState<ServiceHealth>({
    name: 'Database (Supabase)',
    status: 'loading',
  })

  const [nxctl, setNxctl] = useState<ServiceHealth>({
    name: 'NXCTL Orchestrator',
    status: 'loading',
  })

  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<number | null>(null)
  const checkingRef = useRef(false)

  const checkHealth = useCallback(async () => {
    if (checkingRef.current) return
    checkingRef.current = true
    setIsChecking(true)

    // 1. Check Supabase DB
    const dbPromise = (async (): Promise<ServiceHealth> => {
      const start = Date.now()
      try {
        const { error } = await supabase
          .from('system_settings')
          .select('key')
          .limit(1)

        const latency = Date.now() - start
        if (error) {
          return {
            name: 'Database (Supabase)',
            status: 'offline',
            latencyMs: latency,
            message: error.message || 'Database error',
          }
        }

        return {
          name: 'Database (Supabase)',
          status: 'online',
          latencyMs: latency,
          message: 'Operational',
        }
      } catch (err: any) {
        return {
          name: 'Database (Supabase)',
          status: 'offline',
          latencyMs: Date.now() - start,
          message: err.message || 'Database unreachable',
        }
      }
    })()

    // 2. Check NXCTL Daemon
    const nxctlPromise = (async (): Promise<ServiceHealth> => {
      const config = getCustomNxctlConfig()
      const headers: Record<string, string> = {}
      if (config.enabled && config.url) {
        headers['X-Custom-NXCTL-Url'] = config.url
        if (config.secret) {
          headers['X-Custom-NXCTL-Secret'] = config.secret
        }
      }

      try {
        const res = await fetch('/api/nxctl?action=ping', {
          headers,
          cache: 'no-store',
        })
        const data = await res.json()

        if (data.status === 'unconfigured') {
          return {
            name: 'NXCTL Orchestrator',
            status: 'unconfigured',
            latencyMs: 0,
            message: 'Not configured',
            isCustom: Boolean(data.isCustom),
          }
        }

        if (data.ok) {
          return {
            name: 'NXCTL Orchestrator',
            status: 'online',
            latencyMs: data.latencyMs ?? 0,
            message: config.enabled ? 'Custom Relay Node' : 'Default Node',
            isCustom: Boolean(data.isCustom),
          }
        }

        return {
          name: 'NXCTL Orchestrator',
          status: data.status === 'auth_required' ? 'degraded' : 'offline',
          latencyMs: data.latencyMs ?? 0,
          message: data.status === 'auth_required' ? 'Authentication Required' : 'Unreachable',
          isCustom: Boolean(data.isCustom),
        }
      } catch (err: any) {
        return {
          name: 'NXCTL Orchestrator',
          status: 'offline',
          latencyMs: 0,
          message: err.message || 'Connection failed',
          isCustom: config.enabled,
        }
      }
    })()

    try {
      const [dbResult, nxctlResult] = await Promise.all([dbPromise, nxctlPromise])
      setDatabase(dbResult)
      setNxctl(nxctlResult)
      setLastChecked(Date.now())
    } finally {
      setIsChecking(false)
      checkingRef.current = false
    }
  }, [])

  // Initial check & periodic timer
  useEffect(() => {
    void checkHealth()

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkHealth()
      }
    }, autoRefreshIntervalMs)

    const handleConfigChange = () => {
      void checkHealth()
    }

    window.addEventListener('nxctl-node-config-change', handleConfigChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('nxctl-node-config-change', handleConfigChange)
    }
  }, [checkHealth, autoRefreshIntervalMs])

  // Compute overall status
  const overall: 'online' | 'degraded' | 'offline' | 'loading' =
    database.status === 'loading'
      ? 'loading'
      : database.status === 'offline'
        ? 'offline'
        : database.status === 'degraded'
          ? 'degraded'
          : 'online'

  return {
    database,
    nxctl,
    overall,
    lastChecked,
    isChecking,
    checkHealth,
  }
}
