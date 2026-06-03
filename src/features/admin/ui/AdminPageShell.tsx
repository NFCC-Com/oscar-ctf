import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { TYPO_PAGE_TITLE_CLASS, TYPO_METADATA_CLASS } from '@/shared/styles'

interface AdminPageShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  mainClassName?: string
  backButtonClassName?: string
}

export default function AdminPageShell({
  children,
  title,
  subtitle,
  mainClassName = '',
}: AdminPageShellProps) {
  return (
    <div className={cn('min-w-0 flex flex-col', mainClassName)}>
      {(title || subtitle) && (
        <header className="flex flex-col gap-1 border-b border-gray-200/50 pb-4 dark:border-gray-800/60 mb-5">
          {title && <h1 className={TYPO_PAGE_TITLE_CLASS}>{title}</h1>}
          {subtitle && (
            <div className={cn('flex items-center gap-1.5', TYPO_METADATA_CLASS)}>
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>{subtitle}</span>
            </div>
          )}
        </header>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

