'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  SURFACE_GLASS_BASE_CLASS,
  SURFACE_FILTER_ITEM_ACTIVE_CLASS,
} from '@/shared/styles'
import { ADMIN_NAV_ITEMS, isAdminNavItemActive } from './admin-navigation'

type AdminSidebarProps = {
  pathname: string
}

export default function AdminSidebar({ pathname }: AdminSidebarProps) {
  return (
    <aside className={cn('fixed bottom-0 left-0 top-14 z-30 hidden w-60 flex-col border-r border-gray-200/80 p-3 dark:border-gray-800/90 lg:flex', SURFACE_GLASS_BASE_CLASS)}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b border-gray-200/70 px-2 pb-3 dark:border-gray-800/80">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">Admin</p>
            <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">Dashboard</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-3 scroll-hidden">
          <nav className="space-y-1.5" aria-label="Admin navigation">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isAdminNavItemActive(pathname, item)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                    active
                      ? SURFACE_FILTER_ITEM_ACTIVE_CLASS
                      : 'text-gray-700 hover:bg-blue-500/10 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-blue-500')} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
