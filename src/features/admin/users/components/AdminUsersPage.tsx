"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Users } from 'lucide-react'
import { SegmentedTabs } from '@/shared/components'
import { AdminContentLoading, AdminPageShell, AdminTabsBar } from '../../ui'
import { useAdminUsersData } from '../hooks/useAdminUsersData'
import UserRolesTab from './UserRolesTab'
import UsersTableCard from './UsersTableCard'

type AdminUsersTab = 'users' | 'roles'

const USER_TABS = [
  { value: 'users' as const, label: 'Users', icon: Users },
  { value: 'roles' as const, label: 'Roles', icon: ShieldCheck },
]

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<AdminUsersTab>(
    searchParams.get('tab') === 'roles' ? 'roles' : 'users',
  )
  const { user, authLoading, accessReady, isAllowed, isLoading, users } = useAdminUsersData()

  useEffect(() => {
    if (searchParams.get('tab') === 'roles') setActiveTab('roles')
  }, [searchParams])

  if (authLoading || !accessReady) return <AdminContentLoading variant="users" />
  if (!user || !isAllowed) return null

  if (isLoading) {
    return (
      <AdminPageShell>
        <AdminContentLoading variant="users" />
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell>
      <div className="sticky top-14 z-30 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2.5 border-b border-gray-200/60 dark:border-gray-800/60">
        <AdminTabsBar
          className="mb-0"
          tabs={
            <SegmentedTabs
              items={USER_TABS}
              value={activeTab}
              onChange={setActiveTab}
              variant="panel"
            />
          }
        />
      </div>

      <div className="space-y-0 mt-2">
        {activeTab === 'users' ? (
          <UsersTableCard users={users} />
        ) : (
          <UserRolesTab />
        )}
      </div>
    </AdminPageShell>
  )
}
