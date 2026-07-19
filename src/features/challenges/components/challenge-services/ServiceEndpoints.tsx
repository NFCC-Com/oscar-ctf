import React from 'react'
import toast from 'react-hot-toast'
import { Power } from 'lucide-react'
import { isHttpEndpoint } from '../../lib/nxctl-service-utils'

interface ServiceEndpointsProps {
  endpoints: any[]
  isContainerOnly: boolean
}

export const ServiceEndpoints: React.FC<ServiceEndpointsProps> = ({
  endpoints,
  isContainerOnly,
}) => {
  if (isContainerOnly) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 select-none">
        <Power size={11} className="shrink-0 opacity-70" />
        Running without published endpoint
      </span>
    )
  }

  if (endpoints.length === 0) {
    return <span className="text-[11px] text-yellow-500">Waiting for endpoint allocation...</span>
  }

  return (
    <div className="flex flex-col gap-1">
      {endpoints.map((endpoint: any) => (
        <div key={endpoint.key} className="flex min-w-0 flex-col gap-1">
          {endpoint.isTcp || !isHttpEndpoint(endpoint.endpoint) ? (
            <div className="flex min-w-0 flex-col gap-1">
              <div className={`grid items-center gap-2 min-w-0 ${endpoint.isSsh && endpoint.password ? 'grid-cols-[minmax(0,1fr)_minmax(70px,120px)_auto]' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
                <code className={`min-w-0 truncate rounded border px-2 py-1 font-mono text-[11px] ${endpoint.isSsh ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
                  {endpoint.command}
                </code>
                {endpoint.isSsh && endpoint.password && (
                  <code
                    className="min-w-0 truncate rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-mono text-[11px] text-amber-300"
                    title={`Password: ${endpoint.password}`}
                  >
                    <span className="select-none pr-1 text-[9px] font-bold uppercase tracking-wider text-amber-500/70">pw</span>
                    {endpoint.password}
                  </code>
                )}
                <button
                  className={`select-none shrink-0 rounded px-2 py-1 text-[10px] font-bold transition duration-200 ${endpoint.isSsh ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'}`}
                  onClick={() => {
                    navigator.clipboard.writeText(endpoint.copyText)
                    toast.success(endpoint.copyMessage)
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <a href={endpoint.endpoint} target="_blank" rel="noreferrer" className="col-span-2 block w-full truncate rounded border border-blue-500/15 bg-blue-500/5 px-2 py-1 text-[11px] font-medium text-blue-400 transition hover:text-blue-300 hover:underline">
              {endpoint.endpoint}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
