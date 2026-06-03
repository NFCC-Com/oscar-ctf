import React, { type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface AdminPageSurfaceProps {
  children: ReactNode
  className?: string
}

export function AdminPageSurface({ children, className }: AdminPageSurfaceProps) {
  return (
    <div
      className={cn(
        "bg-white/70 dark:bg-[#111622]/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-700/80 rounded-2xl overflow-hidden shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

interface AdminPageToolbarProps {
  title?: ReactNode
  actions?: ReactNode
  className?: string
}

export function AdminPageToolbar({ title, actions, className }: AdminPageToolbarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/50 dark:border-gray-800/60 mb-5", className)}>
      <div className="space-y-1 min-w-0">
        {title}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

interface AdminTabsBarProps {
  tabs: ReactNode
  actions?: ReactNode
  className?: string
}

export function AdminTabsBar({ tabs, actions, className }: AdminTabsBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/50 dark:border-gray-800/60 mb-5", className)}>
      <div className="min-w-0 flex-1">
        {tabs}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
    </div>
  )
}

interface AdminListSurfaceProps {
  children: ReactNode
  className?: string
}

export function AdminListSurface({ children, className }: AdminListSurfaceProps) {
  return (
    <div className={cn("divide-y divide-gray-150 dark:divide-gray-850", className)}>
      {children}
    </div>
  )
}

interface AdminTableSurfaceProps {
  children: ReactNode
  className?: string
}

export function AdminTableSurface({ children, className }: AdminTableSurfaceProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      {children}
    </div>
  )
}

interface AdminSectionProps {
  title?: ReactNode
  description?: string
  children: ReactNode
  className?: string
}

export function AdminSection({ title, description, children, className }: AdminSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  )
}
