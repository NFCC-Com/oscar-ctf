"use client"

import { Loader } from '@/shared/components'
import { Card, CardContent } from '@/shared/ui'
import AuditLogList from './AuditLogList'
import OverviewStatsCards from './OverviewStatsCards'
import StatsGraph from './StatsGraph'
import { useAdminOverviewData } from '../hooks/useAdminOverviewData'
import { AdminContentLoading, AdminPageShell } from '../../ui'

export default function AdminOverviewPage() {
  const {
    user,
    authLoading,
    accessReady,
    isAllowed,
    isLoading,
    challenges,
    siteInfo,
    timeRange,
    activityData,
    refreshStats,
  } = useAdminOverviewData()

  if (authLoading || !accessReady) return <Loader fullscreen />
  if (!user || !isAllowed) return null

  if (isLoading) {
    return (
      <AdminPageShell
        title="Overview"
        subtitle="Review platform metrics, activity, and audit logs."
      >
        <AdminContentLoading variant="overview" />
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell
      title="Overview"
      subtitle="Review platform metrics, activity, and audit logs."
    >
      <div className="space-y-5">
        <OverviewStatsCards siteInfo={siteInfo} challengeCount={challenges.length} />

        <Card className="bg-white pt-4 dark:bg-gray-800">
          <CardContent>
            <StatsGraph
              data={activityData}
              range={timeRange}
              onRangeChange={refreshStats}
            />
          </CardContent>
        </Card>

        <AuditLogList />
      </div>
    </AdminPageShell>
  )
}
