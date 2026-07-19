import React from 'react'
import { AlertTriangle, Clock, Loader2, Play, Power, PowerOff, RefreshCcw } from 'lucide-react'
import { ServiceEndpoints } from './ServiceEndpoints'
import {
  formatExtendWaitDuration,
  formatServiceSeconds,
  formatShortDuration,
  getChallengeServiceEndpoints,
  getExtendButtonAlertClass,
  getExtendState,
  getRestartState,
  getServiceDisplayName,
  getTimerClass,
} from '../../lib/challenge-service-panel-state'
import type { NxctlServiceEntry } from '../../lib/nxctl-services'

interface ServiceCardProps {
  service: NxctlServiceEntry
  details: any
  nowTick: number
  fetchTime: number
  isLoading: boolean
  errorMessage: string | null
  actionLoading: 'up' | 'restart' | 'extend' | null
  handleServiceAction: (service: NxctlServiceEntry, action: 'up' | 'restart' | 'extend') => void
  inspectService: (service: NxctlServiceEntry) => void
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  details,
  nowTick,
  fetchTime,
  isLoading,
  errorMessage,
  actionLoading,
  handleServiceAction,
  inspectService,
}) => {
  const startBtnClass =
    'inline-flex h-7 w-[76px] items-center justify-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200 shrink-0'

  const restartBtnClass =
    'inline-flex h-7 w-[104px] items-center justify-center gap-1 rounded-lg bg-amber-500/10 px-2.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200 shrink-0'

  const extendBtnClass =
    'inline-flex h-7 w-[104px] items-center justify-center gap-1 rounded-lg bg-cyan-500/10 px-2.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200 shrink-0'

  const serviceActionButtonIconClass = 'shrink-0'

  const serviceDisplayName = getServiceDisplayName(service.name)
  const isRunning = details?.runtime?.status === 'running'
  const hasPublishedPort = Boolean(details?.challenge?.port) || (Array.isArray(details?.challenge?.ports) && details.challenge.ports.length > 0)
  const endpoints = getChallengeServiceEndpoints(service, details)

  // Countdown timer calculation
  const remainingSecFromApi = details?.runtime?.remaining_seconds ?? null
  const timeSinceFetch = Math.max(0, (nowTick - fetchTime) / 1000)
  const remainingSec = remainingSecFromApi !== null ? Math.max(0, remainingSecFromApi - timeSinceFetch) : null

  const extendState = getExtendState(details, remainingSec, timeSinceFetch)
  const thresholdSec = extendState.thresholdSeconds
  const canExtend = extendState.canExtend
  const restartState = getRestartState(details)
  const restartEnabled = restartState.enabled
  const restartCooldownSec = restartState.cooldownSeconds
  const restartCooldownLabel = formatShortDuration(restartCooldownSec)
  const restartDisabledLabel = !restartEnabled ? 'Off' : null
  const extendCooldownLabel = extendState.cooldownSeconds > 0 ? formatShortDuration(extendState.cooldownSeconds) : null
  const extendDelayLabel = !canExtend ? extendCooldownLabel || formatExtendWaitDuration(extendState.waitSeconds) : null
  const extendButtonAlertClass = getExtendButtonAlertClass(canExtend, isRunning, remainingSec)
  const timerClass = getTimerClass(remainingSec, thresholdSec)
  const isActionLoading = actionLoading !== null
  const isContainerOnly = isRunning && !hasPublishedPort && endpoints.length === 0

  const statusLabel = !details
    ? 'Unknown'
    : isRunning
      ? isContainerOnly
        ? 'Container only'
        : 'Running'
      : 'Not running'

  const statusClass = !details
    ? 'border-gray-700/60 bg-gray-900/40 text-gray-500'
    : isRunning
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : 'border-gray-600/40 bg-gray-800/30 text-gray-400'

  return (
    <div className="group flex min-h-[74px] flex-col gap-2 px-3 py-2.5 rounded-xl border border-gray-200/50 bg-gray-50/30 hover:border-indigo-500/30 hover:shadow-[0_4px_20px_rgba(99,102,241,0.05)] dark:border-gray-800/60 dark:bg-[#0e1320]/30 transition-all duration-200">
      {/* Header: name + action buttons + timer */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 min-h-9">
        <div className="min-w-0 color-primary font-medium truncate">
          {serviceDisplayName}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className={startBtnClass}
            onClick={() => handleServiceAction(service, 'up')}
            title={(() => {
              if (isLoading) return 'Checking status...'
              if (errorMessage) return `Error: ${errorMessage}`
              if (isActionLoading) return 'Please wait...'
              if (isRunning) return 'Service is already running'
              return 'Start Service'
            })()}
            disabled={isLoading || !!errorMessage || isActionLoading || isRunning}
          >
            {actionLoading === 'up' ? <Loader2 size={12} className={`${serviceActionButtonIconClass} animate-spin`} /> : <Play size={12} className={serviceActionButtonIconClass} />}
            <span>Start</span>
          </button>
          
          <button
            type="button"
            className={restartBtnClass}
            onClick={() => handleServiceAction(service, 'restart')}
            title={(() => {
              if (isLoading) return 'Checking status...'
              if (errorMessage) return `Error: ${errorMessage}`
              if (isActionLoading) return 'Please wait...'
              if (!restartEnabled) return 'Restart is disabled for this challenge'
              if (!isRunning) return 'Cannot restart: service is not running'
              if (restartCooldownSec && restartCooldownSec > 0) return `Restart cooldown: ${formatServiceSeconds(restartCooldownSec)}`
              return 'Restart Service'
            })()}
            disabled={
              isLoading ||
              !!errorMessage ||
              isActionLoading ||
              !restartEnabled ||
              !isRunning ||
              !!(restartCooldownSec && restartCooldownSec > 0)
            }
          >
            {actionLoading === 'restart' ? <Loader2 size={12} className={`${serviceActionButtonIconClass} animate-spin`} /> : <RefreshCcw size={12} className={serviceActionButtonIconClass} />}
            <span>Restart</span>
            {restartCooldownLabel && (
              <span className="rounded bg-yellow-500/10 px-1 text-[9px] font-bold text-yellow-300">
                {restartCooldownLabel}
              </span>
            )}
            {restartDisabledLabel && (
              <span className="rounded bg-red-500/10 px-1 text-[9px] font-bold text-red-300">
                {restartDisabledLabel}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`${extendBtnClass} ${extendButtonAlertClass}`}
            onClick={() => handleServiceAction(service, 'extend')}
            title={(() => {
              if (isLoading) return 'Checking status...'
              if (errorMessage) return `Error: ${errorMessage}`
              if (isActionLoading) return 'Please wait...'
              if (!isRunning) return 'Cannot extend: service is not running'
              if (remainingSec === null) return 'No expiration available to extend'
              if (!canExtend) {
                if (extendCooldownLabel) return `Extend cooldown: ${formatServiceSeconds(extendState.cooldownSeconds)}`
                if (extendDelayLabel) return `Can extend in about ${extendDelayLabel}`
                return `Can extend when remaining <= ${formatServiceSeconds(thresholdSec)}`
              }
              return 'Extend service time'
            })()}
            disabled={
              isLoading ||
              !!errorMessage ||
              isActionLoading ||
              !isRunning ||
              remainingSec === null ||
              !canExtend
            }
          >
            {actionLoading === 'extend' ? <Loader2 size={12} className={`${serviceActionButtonIconClass} animate-spin`} /> : <Clock size={12} className={serviceActionButtonIconClass} />}
            <span>Extend</span>
            {extendDelayLabel && (
              <span className="rounded bg-cyan-500/10 px-1 text-[9px] font-bold text-cyan-300">
                {extendDelayLabel}
              </span>
            )}
          </button>
        </div>

        {isRunning && remainingSec !== null ? (
          <span
            className={`inline-flex h-7 w-[115px] select-none items-center justify-between gap-1 rounded-md border px-2 text-[10px] font-semibold tabular-nums ${timerClass}`}
            title="Time remaining"
          >
            <Clock size={11} className="shrink-0 opacity-80" />
            {formatServiceSeconds(Math.floor(remainingSec))}
          </span>
        ) : (
          <span
            className={`inline-flex h-7 w-[115px] select-none items-center justify-between gap-1 rounded-md border px-2 text-[10px] font-semibold tabular-nums ${statusClass}`}
            title="Runtime status"
          >
            {isRunning ? <Power size={11} className="shrink-0 opacity-80" /> : <Clock size={11} className="shrink-0 opacity-80" />}
            {statusLabel}
          </span>
        )}
      </div>

      {/* Per-service loading */}
      {isLoading && !details && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 select-none">
          <Loader2 size={10} className="animate-spin text-blue-500" />
          <span>Checking...</span>
        </div>
      )}

      {/* Per-service error */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] select-none">
          <AlertTriangle size={11} className="shrink-0 text-red-500/80" />
          <span className="text-red-400 truncate flex-1">{errorMessage}</span>
          {!errorMessage.includes('not visible') && (
            <button
              type="button"
              className="text-[11px] text-blue-500 hover:text-blue-400 hover:underline font-medium flex items-center gap-0.5 shrink-0 disabled:opacity-50"
              onClick={() => inspectService(service)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={9} className="animate-spin" />
              ) : (
                <RefreshCcw size={9} />
              )}
              Retry
            </button>
          )}
        </div>
      )}

      {/* Endpoints */}
      {details && isRunning && (
        <ServiceEndpoints endpoints={endpoints} isContainerOnly={isContainerOnly} />
      )}

      {/* Stopped state */}
      {details && !isRunning && (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 select-none">
          <PowerOff size={11} className="shrink-0 opacity-70" />
          Stopped
        </span>
      )}
    </div>
  )
}
export default ServiceCard
