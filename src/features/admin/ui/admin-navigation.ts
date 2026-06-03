import type { LucideIcon } from 'lucide-react'
import { BarChart3, CalendarDays, Flag, LayoutDashboard, ShieldCheck } from 'lucide-react'

export type AdminNavItem = {
  href: string
  label: string
  description: string
  icon: LucideIcon
  exact?: boolean
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Challenges',
    description: 'Challenge catalog',
    icon: Flag,
    exact: true,
  },
  {
    href: '/admin/overview',
    label: 'Overview',
    description: 'Platform metrics',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/event',
    label: 'Events',
    description: 'Event management',
    icon: CalendarDays,
  },
  {
    href: '/admin/solvers',
    label: 'Solvers',
    description: 'Submission records',
    icon: BarChart3,
  },
  {
    href: '/admin/admins',
    label: 'Admins',
    description: 'Access roles',
    icon: ShieldCheck,
  },
]

export function getAdminNavItem(pathname: string) {
  return ADMIN_NAV_ITEMS.find((item) => isAdminNavItemActive(pathname, item)) ?? ADMIN_NAV_ITEMS[0]
}

export function isAdminNavItemActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
