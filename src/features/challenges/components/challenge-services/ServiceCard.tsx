import React from 'react'
import { AlertTriangle, Clock, Loader2, Play, Power, PowerOff, RefreshCcw, Server } from 'lucide-react'
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
import { cn } from '@/shared/lib/utils'

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
  const serviceDisplayName = getServiceDisplayName(service.name)
  const isRunning = details?.runtime?.status === 'running'
  const hasPublishedPort =
    Boolean(details?.challenge?.port) ||
    (Array.isArray(details?.challenge?.ports) && details.challenge.ports.length > 0)
  const endpoints = getChallengeServiceEndpoints(service, details)

  // Countdown timer calculation
  const remainingSecFromApi = details?.runtime?.remaining_seconds ?? null
  const timeSinceFetch = Math.max(0, (nowTick - fetchTime) / 1000)
  const remainingSec =
    remainingSecFromApi !== null ? Math.max(0, remainingSecFromApi - timeSinceFetch) : null

  const extendState = getExtendState(details, remainingSec, timeSinceFetch)
  const thresholdSec = extendState.thresholdSeconds
  const canExtend = extendState.canExtend
  const restartState = getRestartState(details)
  const restartEnabled = restartState.enabled
  const restartCooldownSec = restartState.cooldownSeconds
  const restartCooldownLabel = formatShortDuration(restartCooldownSec)
  const restartDisabledLabel = !restartEnabled ? 'Off' : null
  const extendCooldownLabel =
    extendState.cooldownSeconds > 0 ? formatShortDuration(extendState.cooldownSeconds) : null
  const extendDelayLabel = !canExtend
    ? extendCooldownLabel || formatExtendWaitDuration(extendState.waitSeconds)
    : null
  const extendButtonAlertClass = getExtendButtonAlertClass(canExtend, isRunning, remainingSec)
  const timerClass = getTimerClass(remainingSec, thresholdSec)
  const isActionLoading = actionLoading !== null
  const isContainerOnly = isRunning && !hasPublishedPort && endpoints.length === 0

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border px-3 py-2.5 transition-all duration-200 backdrop-blur-md',
        isRunning
          ? 'border-emerald-500/25 bg-emerald-500/[0.02] shadow-[0_2px_12px_rgba(16,185,129,0.04)] dark:border-emerald-500/20 dark:bg-[#0c1219]/70'
          : 'border-gray-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-[#0e1320]/60'
      )}
    >
      {/* Header: Service Name & Status + Actions & Countdown Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Service Identity & Status Dot */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors',
              isRunning
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-gray-200 bg-gray-100 text-gray-500 dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-400'
            )}
          >
            <Server size={13} />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate">
              {serviceDisplayName}
            </span>
            {isRunning && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span>ONLINE</span>
              </span>
            )}
            {details && !isRunning && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-200/60 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <span>OFFLINE</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Controls & Timer */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Action Buttons */}
          {!isRunning ? (
            <button
              type="button"
              onClick={() => handleServiceAction(service, 'up')}
              disabled={isLoading || !!errorMessage || isActionLoading || isRunning}
              className="inline-flex h-6.5 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[11px] font-bold text-emerald-600 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400"
              title="Start dynamic service container"
            >
              {actionLoading === 'up' ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Play size={11} className="fill-current" />
              )}
              <span>Deploy</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Restart Button */}
              <button
                type="button"
                onClick={() => handleServiceAction(service, 'restart')}
                disabled={
                  isLoading ||
                  !!errorMessage ||
                  isActionLoading ||
                  !restartEnabled ||
                  !isRunning ||
                  !!(restartCooldownSec && restartCooldownSec > 0)
                }
                className="inline-flex h-6.5 items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 text-[11px] font-bold text-amber-600 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-400"
                title="Restart container instance"
              >
                {actionLoading === 'restart' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <RefreshCcw size={11} />
                )}
                <span>Restart</span>
                {restartCooldownLabel && (
                  <span className="rounded bg-amber-500/20 px-1 text-[9px] font-mono font-bold text-amber-600 dark:text-amber-300">
                    {restartCooldownLabel}
                  </span>
                )}
              </button>

              {/* Extend Button */}
              <button
                type="button"
                onClick={() => handleServiceAction(service, 'extend')}
                disabled={
                  isLoading ||
                  !!errorMessage ||
                  isActionLoading ||
                  !isRunning ||
                  remainingSec === null ||
                  !canExtend
                }
                className={cn(
                  'inline-flex h-6.5 items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 text-[11px] font-bold text-cyan-600 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-cyan-400',
                  extendButtonAlertClass
                )}
                title="Extend instance lifetime"
              >
                {actionLoading === 'extend' ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Clock size={11} />
                )}
                <span>Extend</span>
                {extendDelayLabel && (
                  <span className="rounded bg-cyan-500/20 px-1 text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-300">
                    {extendDelayLabel}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Countdown Clock Pill */}
          {isRunning && remainingSec !== null && (
            <span
              className={cn(
                'inline-flex h-6.5 select-none items-center gap-1 rounded-lg border px-2 font-mono text-[11px] font-bold tabular-nums',
                timerClass
              )}
              title="Time remaining until container shutdown"
            >
              <Clock size={11} className="opacity-80" />
              <span>{formatServiceSeconds(Math.floor(remainingSec))}</span>
            </span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !details && (
        <div className="flex items-center gap-1.5 rounded-lg bg-gray-100/60 p-1.5 text-xs font-mono text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
          <Loader2 size={11} className="animate-spin text-blue-500" />
          <span>Polling instance runtime state...</span>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-xs font-mono text-red-500 dark:text-red-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle size={12} className="shrink-0 text-red-500" />
            <span className="truncate">{errorMessage}</span>
          </div>
          {!errorMessage.includes('not visible') && (
            <button
              type="button"
              onClick={() => inspectService(service)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase transition hover:bg-red-500/30"
            >
              {isLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCcw size={10} />}
              Retry
            </button>
          )}
        </div>
      )}

      {/* Dynamic Endpoints Terminal Display */}
      {details && isRunning && (
        <ServiceEndpoints endpoints={endpoints} isContainerOnly={isContainerOnly} />
      )}

      {/* Stopped Guidance Note */}
      {details && !isRunning && !isLoading && (
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
          <PowerOff size={11} className="opacity-60" />
          <span>Instance offline. Click &ldquo;Deploy&rdquo; to start container.</span>
        </div>
      )}
    </div>
  )
}

export default ServiceCard
