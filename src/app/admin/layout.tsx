import type { ReactNode } from 'react'
import { AdminRouteShell } from '@/features/admin/ui'

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminRouteShell>{children}</AdminRouteShell>
}
