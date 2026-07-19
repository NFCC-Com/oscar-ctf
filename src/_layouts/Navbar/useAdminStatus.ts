import { useState, useEffect } from 'react'
import type { User } from '@/shared/types'

export function useAdminStatus(user: User | null) {
  const [adminStatus, setAdminStatus] = useState(false)
  const [globalAdminStatus, setGlobalAdminStatus] = useState(false)

  useEffect(() => {
    if (user) {
      let active = true

      import('@/features/admin/services/admin.service')
        .then(async ({ isAdmin, isGlobalAdmin }) => {
          const [admin, globalAdmin] = await Promise.all([
            isAdmin(),
            isGlobalAdmin(),
          ])

          if (!active) return
          setAdminStatus(admin)
          setGlobalAdminStatus(globalAdmin)
        })
        .catch(() => {
          if (!active) return
          setAdminStatus(false)
          setGlobalAdminStatus(false)
        })

      return () => {
        active = false
      }
    } else {
      setAdminStatus(false)
      setGlobalAdminStatus(false)
    }
  }, [user])

  return { adminStatus, globalAdminStatus, setAdminStatus, setGlobalAdminStatus }
}
export default useAdminStatus
