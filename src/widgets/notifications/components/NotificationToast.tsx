'use client'

import React from 'react'
import { X, Bell, Megaphone, Server, Flag } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

function getToastIcon(level: string) {
  switch (level) {
    case 'info_challenges':
      return { Icon: Flag, bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/25', text: 'text-emerald-400' }
    case 'info_platform':
      return { Icon: Server, bg: 'bg-indigo-500/15', ring: 'ring-indigo-500/25', text: 'text-indigo-400' }
    case 'info':
      return { Icon: Megaphone, bg: 'bg-orange-500/15', ring: 'ring-orange-500/25', text: 'text-orange-400' }
    default:
      return { Icon: Bell, bg: 'bg-blue-500/15', ring: 'ring-blue-500/25', text: 'text-blue-400' }
  }
}

type NotificationToastProps = {
  solveNotif: { username: string; challenge: string } | null
  notifToasts: Array<{ id: string; title: string; message: string; level: string }>
  onDismissSolve: () => void
  onDismissToast: (id: string) => void
}

export default function NotificationToast({
  solveNotif,
  notifToasts,
  onDismissSolve,
  onDismissToast,
}: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[5000] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
      {/* Solve notification */}
      {solveNotif && (
        <div
          className="pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-blue-500/20 bg-[#0d1117]/95 px-3 py-2.5 shadow-2xl shadow-blue-500/10 backdrop-blur-xl animate-toast-in"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500/15 ring-1 ring-blue-500/25">
              <Bell size={12} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 text-[12px] font-bold text-gray-100 truncate">
              {solveNotif.username}
            </div>
            <button
              onClick={onDismissSolve}
              className="shrink-0 rounded p-1 text-gray-500 transition-all hover:bg-white/10 hover:text-gray-300"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
          <div className="text-[11px] text-gray-400 truncate">
            just solved <span className="font-semibold text-blue-400">{solveNotif.challenge}</span>
          </div>
        </div>
      )}

      {/* Stacked notification toasts */}
      {notifToasts.map((toast) => {
        const { Icon, bg, ring, text } = getToastIcon(toast.level)
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-gray-800/80 bg-[#0d1117]/95 px-3 py-2.5 shadow-2xl shadow-black/30 backdrop-blur-xl animate-toast-in"
          >
            {/* Row 1: Icon, Title, and X button */}
            <div className="flex items-center gap-2">
              <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded ring-1", bg, ring)}>
                <Icon size={12} className={text} />
              </div>
              <div className="flex-1 min-w-0 text-[12px] font-bold text-gray-100 truncate">
                {toast.title}
              </div>
              <button
                onClick={() => onDismissToast(toast.id)}
                className="shrink-0 rounded p-1 text-gray-500 transition-all hover:bg-white/10 hover:text-gray-300"
                aria-label="Dismiss notification"
              >
                <X size={12} />
              </button>
            </div>

            {/* Row 2: Description */}
            {toast.message && (
              <div className="text-[11px] leading-normal text-gray-400 line-clamp-3 break-words">
                {toast.message}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
