'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import PageBackground from '@/shared/components/PageBackground'
import { cn } from '@/shared/lib/utils'
import { THEME_PRIMARY_SELECTION_CLASS } from '@/shared/styles'
import AdminContent from './AdminContent'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'

interface AdminPageShellProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  mainClassName?: string
  backButtonClassName?: string
}

const AdminPageShell = ({
  children,
  title,
  subtitle,
  mainClassName = '',
  backButtonClassName = '',
}: AdminPageShellProps) => {
  const pathname = usePathname()

  return (
    <PageBackground
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
      contentClassName={cn(
        'relative z-10 min-h-[calc(100lvh-3.5rem)] w-full',
        backButtonClassName
      )}
    >
      <AdminSidebar pathname={pathname} />

      <div className="min-w-0 lg:pl-64">
        <div className="flex min-h-[calc(100lvh-3.5rem)] min-w-0 flex-col">
          <AdminHeader pathname={pathname} title={title} subtitle={subtitle} />
          <AdminContent className={mainClassName}>
            {children}
          </AdminContent>
        </div>
      </div>
    </PageBackground>
  )
}

export default AdminPageShell
