import { useState, useRef, useEffect } from 'react'
import {
  buildNxctlStatusHeaders,
  buildNxctlStatusUrl,
  getNxctlErrorMessage,
  getNxctlStatusName,
  normalizeNxctlStatusDetail,
} from '../../lib/nxctl-service-utils'
import type { NxctlServiceEntry } from '../../lib/nxctl-services'

const STATUS_REFRESH_INTERVAL_MS = 5000

export function useServiceStatus(
  open: boolean,
  parsedServices: NxctlServiceEntry[],
  serviceListKey: string
) {
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({})
  const serviceDetailsRef = useRef(serviceDetails)
  serviceDetailsRef.current = serviceDetails

  const [serviceDetailsFetchTime, setServiceDetailsFetchTime] = useState<Record<string, number>>({})
  const [serviceDetailsLoading, setServiceDetailsLoading] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    parsedServices.forEach((service) => {
      initial[service.name] = true
    })
    return initial
  })
  const [serviceDetailsError, setServiceDetailsError] = useState<Record<string, string | null>>({})
  const [hiddenServices, setHiddenServices] = useState<Record<string, boolean>>({})
  const [nowTick, setNowTick] = useState<number>(() => Date.now())
  const [lastGlobalFetchTime, setLastGlobalFetchTime] = useState<number>(0)

  const inspectRunRef = useRef(0)
  const openPrevRef = useRef(false)
  const fetchCompletedRef = useRef(!open)

  // Synchronously detect open transitions to prevent stale loading state
  const justOpened = open && !openPrevRef.current
  openPrevRef.current = open
  if (justOpened) {
    fetchCompletedRef.current = false
  }

  // Handle service key list change reset states
  useEffect(() => {
    const activeNames = new Set(parsedServices.map((service) => service.name))

    setServiceDetails((prev) => {
      const next: Record<string, any> = {}
      Object.entries(prev).forEach(([name, details]) => {
        if (activeNames.has(name)) next[name] = details
      })
      return next
    })
    setServiceDetailsFetchTime((prev) => {
      const next: Record<string, number> = {}
      Object.entries(prev).forEach(([name, fetchTime]) => {
        if (activeNames.has(name)) next[name] = fetchTime
      })
      return next
    })
    setServiceDetailsLoading(() => {
      const next: Record<string, boolean> = {}
      parsedServices.forEach((service) => {
        next[service.name] = true
      })
      return next
    })
    setServiceDetailsError(() => {
      const next: Record<string, string | null> = {}
      parsedServices.forEach((service) => {
        next[service.name] = null
      })
      return next
    })
    setHiddenServices(() => {
      const next: Record<string, boolean> = {}
      parsedServices.forEach((service) => {
        next[service.name] = false
      })
      return next
    })
  }, [serviceListKey, parsedServices])

  // Poll status interval
  useEffect(() => {
    if (!open || parsedServices.length === 0) return

    const runId = inspectRunRef.current + 1
    inspectRunRef.current = runId
    const isCurrentRun = () => inspectRunRef.current === runId

    const loadStatus = async () => {
      const serviceNames = new Set(parsedServices.map((service) => service.name))
      setServiceDetailsLoading((prev) => {
        const next = { ...prev }
        let changed = false
        parsedServices.forEach((service) => {
          const hasData = serviceDetailsRef.current[service.name] !== undefined
          if (!hasData && !prev[service.name]) {
            next[service.name] = true
            changed = true
          } else if (hasData && prev[service.name]) {
            next[service.name] = false
            changed = true
          }
        })
        return changed ? next : prev
      })
      setServiceDetailsError((prev) => {
        const next = { ...prev }
        let changed = false
        parsedServices.forEach((service) => {
          if (!fetchCompletedRef.current && prev[service.name] !== null) {
            next[service.name] = null
            changed = true
          }
        })
        return changed ? next : prev
      })

      try {
        const res = await fetch(buildNxctlStatusUrl(parsedServices), {
          headers: buildNxctlStatusHeaders(parsedServices),
        })
        const data = await res.json()
        if (!isCurrentRun()) return

        if (!res.ok || !Array.isArray(data)) {
          const message = getNxctlErrorMessage(data)
          setServiceDetailsError((prev) => {
            const next = { ...prev }
            parsedServices.forEach((service) => {
              next[service.name] = message
            })
            return next
          })
          return
        }

        const statusByName = new Map<string, any>()
        data.forEach((item: any) => {
          const name = getNxctlStatusName(item)
          if (name) statusByName.set(name, normalizeNxctlStatusDetail(item))
        })

        const fetchedAt = Date.now()
        setLastGlobalFetchTime(fetchedAt)
        setServiceDetails((prev) => {
          const next = { ...prev }
          parsedServices.forEach((service) => {
            const detail = statusByName.get(service.name)
            if (detail) {
              next[service.name] = detail
            } else {
              delete next[service.name]
            }
          })
          return next
        })
        setServiceDetailsFetchTime((prev) => {
          const next = { ...prev }
          parsedServices.forEach((service) => {
            if (statusByName.has(service.name)) {
              next[service.name] = fetchedAt
            } else {
              delete next[service.name]
            }
          })
          return next
        })
        setServiceDetailsError((prev) => {
          const next = { ...prev }
          parsedServices.forEach((service) => {
            next[service.name] = statusByName.has(service.name)
              ? null
              : 'Service is not visible from NXCTL status. Check the service name or challenge key.'
          })
          return next
        })
        setHiddenServices((prev) => {
          const next = { ...prev }
          parsedServices.forEach((service) => {
            if (serviceNames.has(service.name)) next[service.name] = false
          })
          return next
        })
      } catch (error: any) {
        if (!isCurrentRun()) return
        console.error('Failed to fetch service status', error)
        setServiceDetailsError((prev) => {
          const next = { ...prev }
          parsedServices.forEach((service) => {
            next[service.name] = error.message || 'Failed to fetch service status'
          })
          return next
        })
      } finally {
        if (isCurrentRun()) {
          fetchCompletedRef.current = true
          setServiceDetailsLoading((prev) => {
            const next = { ...prev }
            let changed = false
            parsedServices.forEach((service) => {
              if (prev[service.name]) {
                next[service.name] = false
                changed = true
              }
            })
            return changed ? next : prev
          })
        }
      }
    }

    loadStatus()
    const intervalId = window.setInterval(loadStatus, STATUS_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      inspectRunRef.current += 1
    }
  }, [open, parsedServices])

  // global ticking state to re-render countdowns every second while panel is open
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [open])

  return {
    serviceDetails,
    setServiceDetails,
    serviceDetailsFetchTime,
    setServiceDetailsFetchTime,
    serviceDetailsLoading,
    setServiceDetailsLoading,
    serviceDetailsError,
    setServiceDetailsError,
    hiddenServices,
    setHiddenServices,
    nowTick,
    lastGlobalFetchTime,
    fetchCompleted: fetchCompletedRef.current,
  }
}
