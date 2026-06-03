'use client'

import Link from 'next/link'
import { cn } from '@/shared/lib/utils'
import {
  SURFACE_FILTER_ITEM_ACTIVE_CLASS,
  SURFACE_FILTER_ITEM_CLASS,
  SURFACE_GLASS_BASE_CLASS,
} from '@/shared/styles'
import { ADMIN_NAV_ITEMS, getAdminNavItem, isAdminNavItemActive } from './admin-navigation'

type AdminHeaderProps = {
  pathname: string
  title?: string
  subtitle?: string
}

export default function AdminHeader({ pathname, title, subtitle }: AdminHeaderProps) {
  const currentItem = getAdminNavItem(pathname)
  const CurrentIcon = currentItem.icon

  return (
    <header className={cn('sticky top-14 z-20 border-b border-gray-200/80 dark:border-gray-800/90', SURFACE_GLASS_BASE_CLASS)}>
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
            <CurrentIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {title ?? currentItem.label}
            </h1>
            <p className="mt-0.5 truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
              {subtitle ?? currentItem.description}
            </p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto scroll-hidden lg:hidden" aria-label="Admin mobile navigation">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isAdminNavItemActive(pathname, item)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all',
                  active ? SURFACE_FILTER_ITEM_ACTIVE_CLASS : SURFACE_FILTER_ITEM_CLASS
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-white' : 'text-blue-500')} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
