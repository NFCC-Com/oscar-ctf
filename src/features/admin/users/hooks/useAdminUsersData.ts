"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/features/auth'
import { useAuth } from '@/shared/contexts/AuthContext'
import { getAdminUsers } from '../services/admin-users.service'
import type { AdminUserRow } from '../types'

export function useAdminUsersData() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [accessReady, setAccessReady] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let mounted = true

    const initUsersData = async () => {
      if (authLoading) return

      if (!user) {
        setAccessReady(true)
        router.push('/challenges')
        return
      }

      const allowed = await AuthService.isGlobalAdmin()
      if (!mounted) return

      setIsAllowed(allowed)
      setAccessReady(true)
      if (!allowed) {
        router.push('/challenges')
        return
      }

      const userList = await getAdminUsers()
      if (!mounted) return

      setUsers(userList)
      setIsLoading(false)
    }

    void initUsersData()

    return () => {
      mounted = false
    }
  }, [authLoading, router, user])

  return {
    user,
    authLoading,
    accessReady,
    isAllowed,
    isLoading,
    users,
  }
}
