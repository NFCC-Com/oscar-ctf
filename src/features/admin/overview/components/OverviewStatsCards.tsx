import React from 'react'
import { Card, CardContent } from '@/shared/ui'
import { ADMIN_CARD_PLAIN_CLASS } from '@/features/admin/ui'
import type { SiteInfo } from '../types'
import type { Challenge } from '@/shared/types'

interface OverviewStatsCardsProps {
  siteInfo: SiteInfo | null
  challenges: Challenge[]
}

const OverviewStatsCards: React.FC<OverviewStatsCardsProps> = ({ siteInfo, challenges }) => {
  const challengeCount = siteInfo?.total_challenges ?? challenges.length
  const activeChallengeCount = siteInfo?.active_challenges ?? challenges.filter((challenge) => challenge.is_active).length
  const difficultyCount = new Set(challenges.map((challenge) => challenge.difficulty).filter(Boolean)).size
  const categoryCount = new Set(challenges.map((challenge) => challenge.category).filter(Boolean)).size

  const stats = [
    { label: 'Total Users', value: siteInfo?.total_users ?? 0 },
    { label: 'Total Admins', value: siteInfo?.total_admins ?? 0 },
    { label: 'Unique Solvers', value: siteInfo?.unique_solvers ?? 0 },
    { label: 'Total Solves', value: siteInfo?.total_solves ?? 0 },
    { label: 'Total Challenges', value: challengeCount },
    { label: 'Active Challenges', value: activeChallengeCount },
    { label: 'Difficulties', value: difficultyCount },
    { label: 'Categories', value: categoryCount },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={ADMIN_CARD_PLAIN_CLASS}>
          <CardContent className="pt-4">
            <div className="mb-1 text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default OverviewStatsCards
