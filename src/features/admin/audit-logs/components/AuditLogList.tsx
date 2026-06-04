"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { Loader } from '@/shared/components'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { formatRelativeDate } from '@/shared/lib'
import { getAuditLogs } from '@/features/logs/lib/audit-service'
import type { AuditLogEntry } from '@/features/logs/lib/audit-service'
import type { ActionType } from '../../overview/types'
import { EmailWithUsernameTooltip } from './AuditLog/EmailWithUsernameTooltip'
import { AdminPageSurface, AdminFilterBar, AdminListSurface } from '../../ui'

interface AuditLogListProps {
  logs?: AuditLogEntry[]
  isLoading?: boolean
}

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'user_signedup', label: 'Sign Up' },
  { value: 'user_deleted', label: 'Deleted' },
  { value: 'token_refreshed', label: 'Session Renewed' },
]

const getActionStyle = (action: string) => {
  switch (action) {
    case 'login': return { color: 'text-green-500', icon: '→' }
    case 'logout': return { color: 'text-yellow-500', icon: '←' }
    case 'user_signedup': return { color: 'text-blue-500', icon: '+' }
    case 'user_deleted': return { color: 'text-red-500', icon: '×' }
    case 'token_refreshed': return { color: 'text-purple-500', icon: '⟲' }
    default: return { color: 'text-gray-500', icon: '•' }
  }
}

const formatActionLabel = (action: string) => {
  if (action === 'token_refreshed') return 'Session Renewed'

  return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

const AuditLogList: React.FC<AuditLogListProps> = ({ logs: propLogs, isLoading: propLoading }) => {
  const [internalLogs, setInternalLogs] = useState<AuditLogEntry[]>([])
  const [internalLoading, setInternalLoading] = useState(false)
  const [limit, setLimit] = useState(50)
  const [selectedActions, setSelectedActions] = useState<ActionType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [usernameCache, setUsernameCache] = useState<Map<string, string | null>>(new Map())

  const logs = propLogs || internalLogs
  const isLoading = propLoading ?? internalLoading

  useEffect(() => {
    if (propLogs) return
    const fetchLogs = async () => {
      setInternalLoading(true)
      try {
        const data = await getAuditLogs(limit, selectedActions)
        setInternalLogs(data || [])
      } finally {
        setInternalLoading(false)
      }
    }
    fetchLogs()
  }, [limit, selectedActions, propLogs])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (log.payload.action === 'token_revoked') return false
      const email = log.payload.action === 'user_deleted' ? log.payload.traits?.user_email : log.payload.actor_username
      const matchesSearch = !searchQuery || email?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [logs, searchQuery])

  const handleUsernameLoaded = useCallback((email: string, username: string | null) => {
    setUsernameCache(prev => new Map(prev).set(email, username))
  }, [])

  const actionSelector = (
    <select
      value={limit}
      onChange={e => setLimit(Number(e.target.value))}
      className="w-[120px] h-9 text-xs rounded-xl bg-white/30 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500/40 outline-none px-2"
    >
      {[50, 100, 250, 500, 1000].map(v => <option key={v} value={v} className="dark:bg-[#111622]">Last {v}</option>)}
    </select>
  )

  if (isLoading) return (
    <AdminPageSurface className="flex justify-center py-12">
      <Loader />
    </AdminPageSurface>
  )

  return (
    <AdminPageSurface>
      <div className="sticky top-14 z-30 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2.5 border-b border-gray-200/60 dark:border-gray-800/60 mb-2">
        <AdminFilterBar className="pt-0 pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full pt-0.5">
            {/* Search Input on the Left */}
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter by actor email..."
                className="w-full px-3.5 h-9 text-xs rounded-xl border border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-gray-900/40 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 shadow-sm outline-none transition-all hover:border-blue-500/40 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Middle & Right options */}
            <div className="flex flex-wrap items-center gap-3 sm:justify-end text-xs flex-1">
              <div className="flex flex-wrap gap-1.5">
                {ACTION_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={selectedActions.includes(opt.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedActions(prev => prev.includes(opt.value) ? prev.filter(a => a !== opt.value) : [...prev, opt.value])}
                    className="h-8 text-[9px] uppercase font-bold tracking-widest rounded-lg px-2 border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/40"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {actionSelector}
            </div>
          </div>
        </AdminFilterBar>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm font-medium text-muted-foreground">
          No audit logs match the current filters.
        </div>
      ) : (
        <AdminListSurface>
          {filteredLogs.map((log, idx) => {
            const isUserDeleted = log.payload.action === 'user_deleted'
            const userEmail = isUserDeleted ? log.payload.traits?.user_email : log.payload.actor_username
            const style = getActionStyle(log.payload.action)

            return (
              <motion.div key={log.id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className={cn(style.color, "font-black text-lg")}>{style.icon}</span>
                    <span className={cn(style.color, "text-[10px] font-black uppercase tracking-widest")}>
                      {formatActionLabel(log.payload.action)}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    {userEmail ? (
                      <EmailWithUsernameTooltip
                        email={userEmail}
                        cachedUsername={usernameCache.get(userEmail)}
                        onUsernameLoaded={handleUsernameLoaded}
                      />
                    ) : <span className="text-gray-500 italic text-sm">Unknown</span>}
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {formatRelativeDate(log.created_at)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AdminListSurface>
      )}
    </AdminPageSurface>
  )
}

export default AuditLogList
