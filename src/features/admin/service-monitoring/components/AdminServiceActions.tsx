import { Clock, Loader2, Play, PowerOff, RefreshCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/shared/ui'
import { getRemainingSeconds, getServiceStatus } from '../lib/admin-services-utils'
import type { AdminServiceAction, AdminServiceRow } from '../types'

type AdminServiceActionsProps = {
  row: AdminServiceRow
  isGlobalAdmin: boolean
  loadingAction: AdminServiceAction | null
  onAction: (row: AdminServiceRow, action: AdminServiceAction) => void
}

function getExtendState(row: AdminServiceRow) {
  const remaining = getRemainingSeconds(row)
  const runtime = row.details?.runtime
  const extend = runtime?.extend && typeof runtime.extend === 'object'
    ? runtime.extend as Record<string, unknown>
    : {}
  const thresholdSeconds = Number(extend.threshold_seconds || 300)
  const cooldownSeconds = Math.max(0, Number(runtime?.extend_cooldown || 0))
  const backendCanExtend = extend.can_extend === true

  return {
    remaining,
    canExtend: remaining !== null && (backendCanExtend || (remaining <= thresholdSeconds && cooldownSeconds === 0)),
  }
}

export default function AdminServiceActions({
  row,
  isGlobalAdmin,
  loadingAction,
  onAction,
}: AdminServiceActionsProps) {
  const status = getServiceStatus(row)
  const isRunning = status === 'running'
  const isBusy = loadingAction !== null
  const restartCooldown = Math.max(0, Number(row.details?.runtime.restart_cooldown || 0))
  const restartEnabled = row.details?.runtime.can_restart !== false
  const extendState = getExtendState(row)
  const actionButtonClass = 'h-8 rounded-lg px-2.5 text-xs'

  const renderIcon = (action: AdminServiceAction, fallback: ReactNode) => (
    loadingAction === action ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : fallback
  )

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={actionButtonClass}
        onClick={() => onAction(row, 'up')}
        disabled={isBusy || isRunning || Boolean(row.error)}
        title={isRunning ? 'Service is already running' : 'Start service'}
      >
        {renderIcon('up', <Play className="h-3.5 w-3.5" />)}
        Start
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={actionButtonClass}
        onClick={() => onAction(row, 'restart')}
        disabled={isBusy || !isRunning || !restartEnabled || restartCooldown > 0 || Boolean(row.error)}
        title={!restartEnabled ? 'Restart disabled for this service' : 'Restart service'}
      >
        {renderIcon('restart', <RefreshCcw className="h-3.5 w-3.5" />)}
        Restart
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={actionButtonClass}
        onClick={() => onAction(row, 'extend')}
        disabled={isBusy || !isRunning || !extendState.canExtend || Boolean(row.error)}
        title={extendState.remaining === null ? 'No expiration data available' : 'Extend service time'}
      >
        {renderIcon('extend', <Clock className="h-3.5 w-3.5" />)}
        Extend
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={actionButtonClass}
        onClick={() => onAction(row, 'down')}
        disabled={isBusy || !isRunning || !isGlobalAdmin || Boolean(row.error)}
        title={isGlobalAdmin ? 'Stop service' : 'Only global admins can stop services'}
      >
        {renderIcon('down', <PowerOff className="h-3.5 w-3.5" />)}
        Stop
      </Button>
    </div>
  )
}
