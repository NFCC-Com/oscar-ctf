"use client"

import { Card, CardContent } from '@/shared/ui'
import AuditLogList from './AuditLogList'
import OverviewStatsCards from './OverviewStatsCards'
import RecentSolvesCard from './RecentSolvesCard'
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
    recentSolves,
    refreshStats,
  } = useAdminOverviewData()

  if (authLoading || !accessReady) return <AdminContentLoading variant="overview" />
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
        <OverviewStatsCards siteInfo={siteInfo} challenges={challenges} />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <Card className="pt-4">
            <CardContent>
              <StatsGraph
                data={activityData}
                range={timeRange}
                onRangeChange={refreshStats}
              />
            </CardContent>
          </Card>

          <RecentSolvesCard solves={recentSolves} />
        </div>

        <AuditLogList />
      </div>
    </AdminPageShell>
  )
}
