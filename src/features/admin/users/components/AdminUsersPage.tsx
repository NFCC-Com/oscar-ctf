"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/shared/ui'
import {
  AdminContentLoading,
  AdminPageShell,
  AdminStickyToolbar,
  AdminTabs,
  AdminFilterInput,
  AdminFilterSelect,
  AdminFilterToolbar,
} from '../../ui'
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
  const adminUsersData = useAdminUsersData()
  const { user, authLoading, accessReady, isAllowed, isLoading } = adminUsersData

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
      <AdminStickyToolbar
        tabs={
          <AdminTabs
            items={USER_TABS}
            value={activeTab}
            onChange={setActiveTab}
          />
        }
        filters={
          activeTab === 'users' ? (
            <AdminFilterToolbar>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  adminUsersData.setSearchQuery(adminUsersData.query)
                  adminUsersData.setPage(1)
                }}
                className="flex items-center gap-2 flex-1 max-w-[320px]"
              >
                <AdminFilterInput
                  value={adminUsersData.query}
                  defaultValue=""
                  onChange={(value) => {
                    adminUsersData.setQuery(value)
                  }}
                  placeholder="Search username, ID, bio... [Enter]"
                  wrapperClassName="w-full"
                />

                {adminUsersData.searchQuery && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      adminUsersData.setQuery('')
                      adminUsersData.setSearchQuery('')
                      adminUsersData.setPage(1)
                    }}
                    className="h-9 shrink-0 rounded-xl px-3.5 text-xs font-bold text-gray-500 hover:text-red-600 dark:border-gray-800"
                  >
                    Clear
                  </Button>
                )}
              </form>

              <AdminFilterSelect
                value={adminUsersData.roleFilter}
                onValueChange={(value) => {
                  adminUsersData.setRoleFilter(value as 'all' | 'admin' | 'user')
                  adminUsersData.setPage(1)
                }}
                placeholder="Role"
                className="w-full sm:w-[130px]"
                options={[
                  { value: 'all', label: 'All roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'user', label: 'User' },
                ]}
              />

              <AdminFilterSelect
                value={adminUsersData.sortMode}
                defaultValue="newest"
                onValueChange={(value) => {
                  adminUsersData.setSortMode(value as 'newest' | 'oldest' | 'username_asc' | 'updated_desc' | 'role')
                  adminUsersData.setPage(1)
                }}
                placeholder="Sort"
                className="w-full sm:w-[150px]"
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'username_asc', label: 'Username' },
                  { value: 'updated_desc', label: 'Recently updated' },
                  { value: 'role', label: 'Role' },
                ]}
              />

              <AdminFilterSelect
                value={String(adminUsersData.pageSize)}
                defaultValue="100"
                onValueChange={(value) => {
                  adminUsersData.setPageSize(Number(value))
                  adminUsersData.setPage(1)
                }}
                placeholder="Rows"
                className="w-full sm:w-[120px]"
                options={[100, 500, 1000].map((option) => ({
                  value: String(option),
                  label: `${option} rows`,
                }))}
              />
            </AdminFilterToolbar>
          ) : null
        }
      />

      <div className="space-y-0 mt-2">
        {activeTab === 'users' ? (
          <UsersTableCard {...adminUsersData} />
        ) : (
          <UserRolesTab />
        )}
      </div>
    </AdminPageShell>
  )
}
