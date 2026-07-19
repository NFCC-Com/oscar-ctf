import { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  getExtendState,
  getRestartState,
  getServiceDisplayName,
  isNxctlNotFoundError,
  type ServiceAction,
  type ServiceActionLoadingState,
} from '../../lib/challenge-service-panel-state'
import {
  buildNxctlServiceHeaders,
  getNxctlErrorMessage,
  normalizeNxctlStatusDetail,
} from '../../lib/nxctl-service-utils'
import type { NxctlServiceEntry } from '../../lib/nxctl-services'

export function useServiceActions(
  serviceDetails: Record<string, any>,
  setServiceDetails: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setServiceDetailsFetchTime: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  setServiceDetailsLoading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  setServiceDetailsError: React.Dispatch<React.SetStateAction<Record<string, string | null>>>,
  setHiddenServices: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  parsedServices: NxctlServiceEntry[],
  serviceListKey: string,
  nowTick: number
) {
  const [serviceActionLoading, setServiceActionLoading] = useState<Record<string, ServiceActionLoadingState>>({})
  const lastUpTimestampsRef = useRef<Record<string, number>>({})

  // Reset loading states when service list changes
  useEffect(() => {
    setServiceActionLoading(() => {
      const next: Record<string, ServiceActionLoadingState> = {}
      parsedServices.forEach((service) => {
        next[service.name] = null
      })
      return next
    })
  }, [serviceListKey, parsedServices])

  const inspectService = useCallback(async (service: NxctlServiceEntry) => {
    setServiceDetailsLoading((prev) => ({ ...prev, [service.name]: true }))
    setServiceDetailsError((prev) => ({ ...prev, [service.name]: null }))
    try {
      const resInspect = await fetch(`/api/nxctl?action=inspect&name=${encodeURIComponent(service.name)}`, {
        headers: buildNxctlServiceHeaders(service),
      })
      const dataInspect = await resInspect.json()
      if (resInspect.ok) {
        setServiceDetails((prev) => ({ ...prev, [service.name]: normalizeNxctlStatusDetail(dataInspect) }))
        setServiceDetailsFetchTime((prev) => ({ ...prev, [service.name]: Date.now() }))
        setServiceDetailsError((prev) => ({ ...prev, [service.name]: null }))
      } else {
        if (isNxctlNotFoundError(resInspect.status, dataInspect)) {
          setHiddenServices((prev) => ({ ...prev, [service.name]: true }))
        } else {
          setServiceDetailsError((prev) => ({ ...prev, [service.name]: getNxctlErrorMessage(dataInspect) }))
        }
      }
    } catch (error: any) {
      console.error(`Failed to refresh service details for ${service.name}`, error)
      setServiceDetailsError((prev) => ({ ...prev, [service.name]: error.message || 'Failed to inspect service status' }))
    } finally {
      setServiceDetailsLoading((prev) => ({ ...prev, [service.name]: false }))
    }
  }, [setServiceDetails, setServiceDetailsFetchTime, setServiceDetailsLoading, setServiceDetailsError, setHiddenServices])

  const handleServiceAction = async (service: NxctlServiceEntry, action: ServiceAction) => {
    const details = serviceDetails[service.name]
    const isRunning = details?.runtime?.status === 'running'

    if (action === 'up') {
      if (isRunning) {
        toast.error('Service is already running.')
        return
      }

      const lastUp = lastUpTimestampsRef.current[service.name]
      if (lastUp && Date.now() - lastUp < 10000) {
        toast.error('Service is still starting. Please wait a moment.')
        return
      }
      lastUpTimestampsRef.current[service.name] = Date.now()
    }

    if (action === 'restart') {
      const restartState = getRestartState(details)

      if (!restartState.enabled) {
        toast.error('Restart is disabled for this challenge.')
        return
      }

      if (!isRunning) {
        toast.error('Cannot restart: service is not running.')
        return
      }

      if (restartState.cooldownSeconds > 0) {
        toast.error(`Restart cooldown active. Wait ${restartState.cooldownSeconds}s.`)
        return
      }
    }

    setServiceActionLoading((prev) => ({ ...prev, [service.name]: action }))
    const serviceDisplayName = getServiceDisplayName(service.name)
    const toastId = toast.loading(`${action}ing ${serviceDisplayName}...`)

    try {
      const res = await fetch('/api/nxctl', {
        method: 'POST',
        headers: buildNxctlServiceHeaders(service, true),
        body: JSON.stringify({ action, name: service.name }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Successfully ${action}ed ${serviceDisplayName}`, { id: toastId })
        await new Promise((resolve) => setTimeout(resolve, 500))
        await inspectService(service)
      } else {
        toast.error(`Failed to ${action} ${serviceDisplayName}: ${getNxctlErrorMessage(data)}`, { id: toastId })
      }
    } catch (error) {
      console.error(`Failed to ${action} ${service.name}`, error)
      toast.error(`Error ${action}ing ${serviceDisplayName}`, { id: toastId })
    } finally {
      setServiceActionLoading((prev) => ({ ...prev, [service.name]: null }))
    }
  }

  return {
    serviceActionLoading,
    handleServiceAction,
    inspectService,
  }
}
