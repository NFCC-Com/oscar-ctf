import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type AdminContentProps = {
  children: ReactNode
  className?: string
}

export default function AdminContent({ children, className }: AdminContentProps) {
  return (
    <main className={cn('min-w-0 flex-1 p-4 sm:p-6 lg:p-8', className)}>
      {children}
    </main>
  )
}
