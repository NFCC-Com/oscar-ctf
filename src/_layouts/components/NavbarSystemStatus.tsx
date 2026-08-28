'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Activity,
  Check,
  Database,
  Globe,
  Key,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Server,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSystemHealth } from '@/shared/hooks/useSystemHealth'
import {
  getCustomNxctlConfig,
  setCustomNxctlConfig,
  type CustomNxctlConfig,
} from '@/shared/lib/nxctl-node-config'
import { cn } from '@/shared/lib/utils'

export default function NavbarSystemStatus() {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const { database, nxctl, overall, isChecking, checkHealth } = useSystemHealth()

  // Custom node state form
  const [nodeConfig, setNodeConfig] = useState<CustomNxctlConfig>(getCustomNxctlConfig)
  const [testingPing, setTestingPing] = useState(false)
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      setNodeConfig(getCustomNxctlConfig())
      setPingResult(null)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleToggleCustom = (enabled: boolean) => {
    const updated = setCustomNxctlConfig({ enabled })
    setNodeConfig(updated)
    toast.success(enabled ? 'Switched to Custom NXCTL Relay' : 'Switched to Default NXCTL Node')
  }

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUrl = nodeConfig.url.trim().replace(/\/$/, '')
    if (nodeConfig.enabled && !trimmedUrl) {
      toast.error('Please enter a valid NXCTL Node URL')
      return
    }

    const updated = setCustomNxctlConfig({
      url: trimmedUrl,
      secret: nodeConfig.secret.trim(),
    })
    setNodeConfig(updated)
    toast.success('Custom NXCTL node saved!')
    void checkHealth()
  }

  const handleResetDefault = () => {
    const reset = setCustomNxctlConfig({
      enabled: false,
      url: '',
      secret: '',
    })
    setNodeConfig(reset)
    setPingResult(null)
    toast.success('Reset to Default Server Node')
    void checkHealth()
  }

  const handleTestConnection = async () => {
    const targetUrl = nodeConfig.url.trim().replace(/\/$/, '')
    if (!targetUrl) {
      toast.error('Please provide a node URL to test')
      return
    }

    setTestingPing(true)
    setPingResult(null)
    const headers: Record<string, string> = {
      'X-Custom-NXCTL-Url': targetUrl,
    }
    if (nodeConfig.secret.trim()) {
      headers['X-Custom-NXCTL-Secret'] = nodeConfig.secret.trim()
    }

    try {
      const start = Date.now()
      const res = await fetch('/api/nxctl?action=ping', { headers, cache: 'no-store' })
      const latency = Date.now() - start
      const data = await res.json()

      if (data.ok) {
        setPingResult({
          ok: true,
          message: `Reachable! Latency: ${latency}ms`,
          latency,
        })
        toast.success(`Node reachable (${latency}ms)`)
      } else {
        setPingResult({
          ok: false,
          message: data.message || `Node returned status ${res.status}`,
          latency,
        })
        toast.error('Node ping failed')
      }
    } catch (err: any) {
      setPingResult({
        ok: false,
        message: err.message || 'Network error connecting to node',
      })
      toast.error('Failed to connect to node')
    } finally {
      setTestingPing(false)
    }
  }

  return (
    <div className="relative mr-2 hidden md:inline-block" data-tour="navbar-system-status">
      {/* Sleek icon trigger matching NotificationBell & Logs */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative rounded-full p-1 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800',
          open && 'bg-blue-100 dark:bg-blue-900/60'
        )}
        title="System Status & NXCTL Relay"
        aria-label="System Status"
      >
        <Activity size={22} className="text-blue-500" />

        {/* Live Status Ping Dot at top-right corner */}
        <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5">
          {overall === 'online' && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={cn(
              'relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0b0f19]',
              overall === 'online'
                ? 'bg-emerald-500'
                : overall === 'degraded'
                  ? 'bg-amber-500'
                  : overall === 'loading'
                    ? 'bg-blue-500'
                    : 'bg-red-500'
            )}
          />
        </span>
      </button>

      {/* Sleek Floating Dropdown Popover */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 w-[320px] rounded-xl border border-gray-200/90 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1017]/95 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200/80 p-3 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Activity size={13} />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                System Telemetry
              </span>
            </div>

            <button
              type="button"
              onClick={() => void checkHealth()}
              disabled={isChecking}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-[10px] font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 transition disabled:opacity-50"
              title="Ping servers"
            >
              <RefreshCcw size={10} className={cn(isChecking && 'animate-spin')} />
              <span>Ping</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-3 space-y-3">
            {/* Status Rows */}
            <div className="space-y-1.5">
              {/* Database */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200/80 bg-gray-50/40 p-2 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <Database size={13} className="text-blue-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                    Database (Supabase)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                  {database.latencyMs !== undefined && (
                    <span className="text-gray-500 font-bold">{database.latencyMs}ms</span>
                  )}
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.2 text-[9px] font-bold uppercase',
                      database.status === 'online'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    )}
                  >
                    {database.status}
                  </span>
                </div>
              </div>

              {/* NXCTL */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200/80 bg-gray-50/40 p-2 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 min-w-0">
                  <Server size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                    NXCTL Daemon
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                  {nxctl.latencyMs !== undefined && nxctl.status === 'online' && (
                    <span className="text-gray-500 font-bold">{nxctl.latencyMs}ms</span>
                  )}
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.2 text-[9px] font-bold uppercase',
                      nxctl.status === 'online'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : nxctl.status === 'unconfigured'
                          ? 'bg-gray-500/15 text-gray-500'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {nxctl.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Node Section */}
            <div className="rounded-lg border border-gray-200/80 bg-gray-50/40 p-2.5 dark:border-white/5 dark:bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                    NXCTL Custom Relay
                  </span>
                </div>

                <div className="flex items-center gap-0.5 rounded border border-gray-200 bg-white p-0.5 dark:border-gray-800 dark:bg-gray-900 text-[9px] font-mono font-semibold">
                  <button
                    type="button"
                    onClick={() => handleToggleCustom(false)}
                    className={cn(
                      'rounded px-1.5 py-0.2 transition',
                      !nodeConfig.enabled
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    )}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCustom(true)}
                    className={cn(
                      'rounded px-1.5 py-0.2 transition',
                      nodeConfig.enabled
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    )}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {nodeConfig.enabled && (
                <form onSubmit={handleSaveConfig} className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                      Relay Node URL
                    </label>
                    <div className="relative flex items-center">
                      <Globe size={11} className="absolute left-2 text-gray-400" />
                      <input
                        type="url"
                        placeholder="https://nxctl.internal.com"
                        value={nodeConfig.url}
                        onChange={(e) => setNodeConfig((prev) => ({ ...prev, url: e.target.value }))}
                        required
                        className="w-full rounded-md border border-gray-200 bg-white py-1 pl-6 pr-2 text-[11px] font-mono text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                      Secret / Key (Optional)
                    </label>
                    <div className="relative flex items-center">
                      <Key size={11} className="absolute left-2 text-gray-400" />
                      <input
                        type="password"
                        placeholder="Participant Challenge Key"
                        value={nodeConfig.secret}
                        onChange={(e) => setNodeConfig((prev) => ({ ...prev, secret: e.target.value }))}
                        className="w-full rounded-md border border-gray-200 bg-white py-1 pl-6 pr-2 text-[11px] font-mono text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {pingResult && (
                    <div
                      className={cn(
                        'flex items-center gap-1 rounded p-1.5 text-[10px] font-mono border',
                        pingResult.ok
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                      )}
                    >
                      <Check size={10} className={cn(pingResult.ok ? 'text-emerald-500' : 'hidden')} />
                      <span>{pingResult.message}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingPing || !nodeConfig.url.trim()}
                      className="inline-flex h-6 items-center gap-1 rounded border border-gray-200 bg-white px-2 text-[10px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 transition"
                    >
                      {testingPing ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                      <span>Ping</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleResetDefault}
                        className="inline-flex h-6 items-center gap-0.5 rounded px-1.5 text-[10px] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                        title="Reset to default"
                      >
                        <RotateCcw size={10} />
                        <span>Reset</span>
                      </button>

                      <button
                        type="submit"
                        className="inline-flex h-6 items-center rounded bg-blue-600 px-2 text-[10px] font-bold text-white shadow-sm hover:bg-blue-500 transition"
                      >
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
