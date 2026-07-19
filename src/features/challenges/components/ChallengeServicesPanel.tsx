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
    <div>
      <p className="select-none text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5 opacity-90">
        <Server className="h-3.5 w-3.5 text-indigo-500/70 shrink-0" />
        <span>NXCTL Services</span>
        {lastGlobalFetchTime > 0 && (() => {
          const elapsedMs = nowTick - lastGlobalFetchTime
          const remainingMs = Math.max(0, STATUS_REFRESH_INTERVAL_MS - elapsedMs)
          const remainingSec = Math.ceil(remainingMs / 1000)
          return (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-medium tabular-nums text-gray-500 dark:text-gray-600 opacity-80" title="Next refresh in">
              <RefreshCcw size={9} className={`shrink-0 ${remainingSec <= 1 ? 'animate-spin' : ''}`} />
              {remainingSec}s
            </span>
          )
        })()}
      </p>
      <div className="grid grid-cols-1 gap-2">
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
