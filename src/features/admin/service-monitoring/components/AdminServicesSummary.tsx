import { Activity, AlertTriangle, Clock, Power, Server, ShieldCheck } from 'lucide-react'
import { AdminStatCard } from '@/features/admin/ui'
import type { AdminServicesSummaryCounts } from '../types'

type AdminServicesSummaryProps = {
  summary: AdminServicesSummaryCounts
}

export default function AdminServicesSummary({ summary }: AdminServicesSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <AdminStatCard
        label="Total Services"
        value={summary.total}
        description="Configured NXCTL services"
        icon={Server}
      />
      <AdminStatCard
        label="Running"
        value={summary.running}
        description="Visible as active"
        icon={Activity}
        iconClassName="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
      />
      <AdminStatCard
        label="Stopped"
        value={summary.stopped}
        description="Down or inactive"
        icon={Power}
        iconClassName="bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300"
      />
      <AdminStatCard
        label="Expired"
        value={summary.expired}
        description="Timer reached zero"
        icon={Clock}
        iconClassName="bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
      />
      <AdminStatCard
        label="Error"
        value={summary.error}
        description="Unhealthy or unavailable"
        icon={AlertTriangle}
        iconClassName="bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300"
      />
      <AdminStatCard
        label="Challenges"
        value={summary.challengesWithService}
        description="With service config"
        icon={ShieldCheck}
      />
    </div>
  )
}
