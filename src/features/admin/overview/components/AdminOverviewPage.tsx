"use client"

import { cn } from '@/shared/lib/utils'
import OverviewStatsCards from './OverviewStatsCards'
import RecentSolvesCard from './RecentSolvesCard'
import StatsGraph from './StatsGraph'
import { useAdminOverviewData } from '../hooks/useAdminOverviewData'
import { AdminContentLoading, AdminPageShell, AdminPanel } from '../../ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'

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
      <AdminPageShell>
        <AdminContentLoading variant="overview" />
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell>
      <div className="space-y-5">
        <OverviewStatsCards siteInfo={siteInfo} challenges={challenges} />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <AdminPanel
            title="Solve Activity"
            action={
              <Select value={timeRange} onValueChange={refreshStats}>
                <SelectTrigger className="w-[130px] h-8 rounded-xl bg-white/70 dark:bg-[#111622]/80 border border-gray-200/80 dark:border-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all hover:border-blue-500/40">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-[#111622]/95 border border-gray-200/80 dark:border-gray-800/90 rounded-xl shadow-lg backdrop-blur-xl">
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <StatsGraph
              data={activityData}
              range={timeRange}
            />
          </AdminPanel>

          <RecentSolvesCard solves={recentSolves} />
        </div>
      </div>
    </AdminPageShell>
  )
}
