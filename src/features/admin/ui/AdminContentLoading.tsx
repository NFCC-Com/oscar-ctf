'use client'

import Loader from '@/shared/components/Loader'

type AdminContentLoadingProps = {
  variant?: 'overview' | 'challenges' | 'event' | 'solvers' | 'users' | 'admins' | 'services'
}

export default function AdminContentLoading(_props: AdminContentLoadingProps) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <Loader size={40} />
    </div>
  )
}
