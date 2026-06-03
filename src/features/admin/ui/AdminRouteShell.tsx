'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import PageBackground from '@/shared/components/PageBackground'
import { THEME_PRIMARY_SELECTION_CLASS } from '@/shared/styles'
import AdminContent from './AdminContent'
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'
import { useAuth } from '@/shared/contexts/AuthContext'
import Loader from '@/shared/components/Loader'

type AdminRouteShellProps = {
  children: ReactNode
}

export default function AdminRouteShell({ children }: AdminRouteShellProps) {
  const pathname = usePathname()
  const { loading: authLoading } = useAuth()

  if (authLoading) {
    return <Loader fullscreen />
  }

  return (
    <PageBackground
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
      contentClassName="relative z-10 min-h-[calc(100lvh-3.5rem)] w-full"
    >
      <AdminSidebar pathname={pathname} />

      <div className="min-w-0 lg:pl-60">
        <div className="flex min-h-[calc(100lvh-3.5rem)] min-w-0 flex-col">
          <AdminHeader pathname={pathname} />
          <AdminContent>{children}</AdminContent>
        </div>
      </div>
    </PageBackground>
  )
}
