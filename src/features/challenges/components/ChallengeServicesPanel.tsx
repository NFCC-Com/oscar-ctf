"use client"

import React, { useMemo } from 'react'
import { RefreshCcw, Server } from 'lucide-react'
import { parseNxctlService } from '../lib/nxctl-services'
import { useServiceStatus } from './challenge-services/useServiceStatus'
import { useServiceActions } from './challenge-services/useServiceActions'
import { useExtendReminder } from './challenge-services/useExtendReminder'
import ServiceCard from './challenge-services/ServiceCard'

const STATUS_REFRESH_INTERVAL_MS = 5000

interface ChallengeServicesPanelProps {
  open: boolean
  services?: string[]
}

const ChallengeServicesPanel: React.FC<ChallengeServicesPanelProps> = ({
  open,
  services = [],
}) => {
  const rawServicesKey = services.join('\u0000')
  const parsedServices = useMemo(
    () => (rawServicesKey ? rawServicesKey.split('\u0000') : [])
      .map(parseNxctlService)
      .filter((service) => service.name.trim() !== ''),
    [rawServicesKey]
  )
  const serviceListKey = useMemo(
    () => parsedServices.map((service) => `${service.name}:${service.key || ''}`).join('\u0000'),
    [parsedServices]
  )

  const {
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
    fetchCompleted,
  } = useServiceStatus(open, parsedServices, serviceListKey)

  const {
    serviceActionLoading,
    handleServiceAction,
    inspectService,
  } = useServiceActions(
    serviceDetails,
    setServiceDetails,
    setServiceDetailsFetchTime,
    setServiceDetailsLoading,
    setServiceDetailsError,
    setHiddenServices,
    parsedServices,
    serviceListKey,
    nowTick
  )

  const visibleServices = useMemo(
    () => parsedServices.filter((service) => !hiddenServices[service.name]),
    [parsedServices, hiddenServices]
  )

  // Expiration alarm & toast checks
  useExtendReminder(open, visibleServices, serviceDetails, serviceDetailsFetchTime, nowTick)

  if (visibleServices.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between select-none text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Server className="h-3 w-3" />
          </span>
          <span className="text-gray-700 dark:text-gray-300 font-bold">Dynamic Services / Instances</span>
        </div>

        {lastGlobalFetchTime > 0 && (() => {
          const elapsedMs = nowTick - lastGlobalFetchTime
          const remainingMs = Math.max(0, STATUS_REFRESH_INTERVAL_MS - elapsedMs)
          const remainingSec = Math.ceil(remainingMs / 1000)
          return (
            <span
              className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-gray-500 dark:bg-gray-800/80 dark:text-gray-400"
              title="Next sync check"
            >
              <RefreshCcw size={9} className={remainingSec <= 1 ? 'animate-spin' : ''} />
              <span>Sync {remainingSec}s</span>
            </span>
          )
        })()}
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {visibleServices.map((service, idx) => {
          const details = serviceDetails[service.name]
          const errorMessage = serviceDetailsError[service.name]
          const isLoading = ((serviceDetailsLoading[service.name] ?? (!details && open)) || (open && !fetchCompleted)) && !errorMessage
          const actionLoading = serviceActionLoading[service.name] ?? null
          const fetchTime = serviceDetailsFetchTime[service.name] ?? nowTick

          return (
            <ServiceCard
              key={`${service.name}-${idx}`}
              service={service}
              details={details}
              nowTick={nowTick}
              fetchTime={fetchTime}
              isLoading={isLoading}
              errorMessage={errorMessage}
              actionLoading={actionLoading}
              handleServiceAction={handleServiceAction}
              inspectService={inspectService}
            />
          )
        })}
      </div>
    </div>
  )
}

export default ChallengeServicesPanel
