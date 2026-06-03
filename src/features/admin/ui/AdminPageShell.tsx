import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface AdminPageShellProps {
  children: ReactNode
  title?: string
  subtitle?: string
  mainClassName?: string
  backButtonClassName?: string
}

export default function AdminPageShell({ children, mainClassName = '' }: AdminPageShellProps) {
  return <div className={cn('min-w-0', mainClassName)}>{children}</div>
}
