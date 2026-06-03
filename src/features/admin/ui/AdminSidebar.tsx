'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui'
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
    <aside className={cn('fixed bottom-0 left-0 top-14 z-30 hidden w-64 flex-col border-r border-gray-200/80 p-3 dark:border-gray-800/90 lg:flex', SURFACE_GLASS_BASE_CLASS)}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b border-gray-200/70 px-2 pb-3 dark:border-gray-800/80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">Admin</p>
            <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">Management</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-3 scroll-hidden">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Workspace
            </p>
            <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 px-1.5 py-0 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              Hub
            </Badge>
          </div>

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
                    'group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                    active
                      ? SURFACE_FILTER_ITEM_ACTIVE_CLASS
                      : 'text-gray-700 hover:bg-blue-500/10 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-blue-500')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{item.label}</span>
                    <span className={cn('block truncate text-xs font-medium', active ? 'text-white/75' : 'text-gray-500 dark:text-gray-400')}>
                      {item.description}
                    </span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-gray-200/70 px-2 pt-3 text-xs font-medium leading-5 text-gray-500 dark:border-gray-800/80 dark:text-gray-400">
          Admin-only workspace. Public pages are outside this shell.
        </div>
      </div>
    </aside>
  )
}
