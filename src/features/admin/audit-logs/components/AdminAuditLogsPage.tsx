"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts'
import { AuthService } from '@/features/auth'
import { AdminContentLoading, AdminPageShell } from '../../ui'
import AuditLogList from './AuditLogList'

export default function AdminAuditLogsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [accessReady, setAccessReady] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let mounted = true
    const checkAccess = async () => {
      if (authLoading) return
      if (!user) {
        setAccessReady(true)
        router.push('/challenges')
        return
      }

      const adminCheck = await AuthService.isGlobalAdmin()
      if (!mounted) return
      setIsAllowed(adminCheck)
      setAccessReady(true)
      if (!adminCheck) {
        router.push('/challenges')
      }
    }
    checkAccess()
    return () => { mounted = false }
  }, [authLoading, user, router])

  if (authLoading || !accessReady) return <AdminContentLoading variant="challenges" />
  if (!user || !isAllowed) return null

  return (
    <AdminPageShell>
      <div className="space-y-5">
        <AuditLogList />
      </div>
    </AdminPageShell>
  )
}
