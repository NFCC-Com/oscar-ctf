import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Copy, ExternalLink, Key, Power, Terminal } from 'lucide-react'
import { isHttpEndpoint } from '../../lib/nxctl-service-utils'

interface ServiceEndpointsProps {
  endpoints: any[]
  isContainerOnly: boolean
}

export const ServiceEndpoints: React.FC<ServiceEndpointsProps> = ({
  endpoints,
  isContainerOnly,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, message: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(message)
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr))
    }, 2000)
  }

  if (isContainerOnly) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-mono text-emerald-400">
        <Power size={12} className="shrink-0 text-emerald-400" />
        <span>Container running · Background worker (No external port published)</span>
      </div>
    )
  }

  if (endpoints.length === 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-mono text-amber-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
        <span>Allocating routing endpoint...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {endpoints.map((endpoint: any) => {
        const isHttp = isHttpEndpoint(endpoint.endpoint) && !endpoint.isTcp
        const copyKey = `cmd-${endpoint.key}`
        const pwCopyKey = `pw-${endpoint.key}`

        if (isHttp) {
          return (
            <div
              key={endpoint.key}
              className="flex items-center justify-between gap-2 rounded-lg border border-blue-500/20 bg-blue-500/[0.05] px-2.5 py-1.5 dark:border-blue-400/20 dark:bg-blue-950/30"
            >
              <div className="flex min-w-0 items-center gap-2 font-mono text-xs text-blue-600 dark:text-blue-300">
                <span className="flex h-4.5 items-center justify-center rounded bg-blue-500/10 px-1 text-[9px] font-bold uppercase text-blue-600 dark:text-blue-400">
                  WEB
                </span>
                <span className="truncate select-all">{endpoint.endpoint}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(endpoint.endpoint, 'Copied web URL', copyKey)}
                  className="inline-flex h-6 items-center gap-1 rounded-md border border-blue-500/20 bg-white/60 px-2 text-[10px] font-semibold text-blue-600 transition hover:bg-blue-500/10 dark:border-blue-400/20 dark:bg-blue-900/30 dark:text-blue-300"
                  title="Copy URL"
                >
                  {copiedKey === copyKey ? (
                    <Check size={11} className="text-emerald-500" />
                  ) : (
                    <Copy size={11} />
                  )}
                  <span>{copiedKey === copyKey ? 'Copied' : 'Copy'}</span>
                </button>

                <a
                  href={endpoint.endpoint}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-6 items-center gap-1 rounded-md bg-blue-600 px-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                  title="Open in new tab"
                >
                  <span>Open</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )
        }

        // TCP or SSH Terminal Endpoint
        return (
          <div
            key={endpoint.key}
            className="flex flex-col gap-1 rounded-lg border border-gray-200/80 bg-gray-900/5 px-2.5 py-1.5 dark:border-white/10 dark:bg-[#0b0e14]/80"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-4.5 items-center justify-center rounded px-1 text-[9px] font-bold uppercase ${
                    endpoint.isSsh
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {endpoint.isSsh ? 'SSH' : 'TCP'}
                </span>
                <code
                  className="min-w-0 truncate font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 select-all"
                  title="Select text or use copy button"
                >
                  {endpoint.command}
                </code>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {endpoint.isSsh && endpoint.password && (
                  <button
                    type="button"
                    onClick={() => handleCopy(endpoint.password, 'Copied SSH password', pwCopyKey)}
                    className="inline-flex h-6 items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-300 transition hover:bg-amber-500/20"
                    title="Click to copy password"
                  >
                    <Key size={10} className="text-amber-500" />
                    <span>pw: {endpoint.password}</span>
                    {copiedKey === pwCopyKey && <Check size={10} className="text-emerald-500" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopy(endpoint.copyText, endpoint.copyMessage, copyKey)}
                  className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition ${
                    endpoint.isSsh
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                  title={endpoint.isSsh ? 'Copy SSH command' : 'Copy netcat command'}
                >
                  {copiedKey === copyKey ? (
                    <Check size={11} className="text-emerald-500" />
                  ) : (
                    <Copy size={11} />
                  )}
                  <span>{copiedKey === copyKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
