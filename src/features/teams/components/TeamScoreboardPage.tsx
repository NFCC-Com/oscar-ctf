'use client'

import { useEffect, useMemo, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Coins, Sparkles, Trophy, Rocket, Globe, Users } from 'lucide-react'

import { APP } from '@/config'
import Loader from '@/shared/components/Loader'
import EmptyState from '@/shared/components/EmptyState'
import PageLoader from '@/shared/components/PageLoader'
import PageBackground from '@/shared/components/PageBackground'
import EventSelect from '@/features/events/components/EventSelect'
import { getActiveUserTags } from '@/shared/lib'
import { AppTabs, Card, CardContent, FilterSelect, Button } from '@/shared/ui'
import {
  PAGE_MAIN_CONTAINER_6XL,
  SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS,
  THEME_PRIMARY_SELECTION_CLASS,
} from '@/shared/styles'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useTheme } from '@/shared/contexts/ThemeContext'
import { useEventContext } from '@/features/events/contexts/EventContext'

const TeamScoreboardChart = dynamic(() => import('./TeamScoreboardChart'), {
  ssr: false,
  loading: () => <div className="h-[350px] flex items-center justify-center text-gray-400">Loading chart...</div>
})
import TeamScoreboardTable from './TeamScoreboardTable'
import { useTeamScoreboard } from '../hooks/useTeamScoreboard'
import ScoreboardExportActions from '@/features/scoreboard/components/ScoreboardExportActions'
import ScoreboardScopeTabs from '@/features/scoreboard/components/ScoreboardScopeTabs'
import ScoreboardDateFilter from '@/features/scoreboard/components/ScoreboardDateFilter'
import { buildScoreboard, getOrderedProgressSeries } from '@/features/scoreboard/lib/build-scoreboard'
import {
  createDateRangeLabel,
  type ScoreboardExportSnapshot,
} from '@/features/scoreboard/lib/scoreboard-export-data'
import {
  getTeamScoreboard,
  getTopTeamProgressByNames,
  getTopTeamUniqueProgressByNames,
} from '../services/team.service'
import { getSolvedEventIds } from '@/features/events/services/event.service'
import type { TeamProgressSeries, TeamScoreboardEntry } from '../types'

import { cn } from '@/shared/lib/utils'

export default function TeamScoreboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  const { startedEvents, selectedEvent, setSelectedEvent } = useEventContext()
  const [solvedEventIds, setSolvedEventIds] = useState<string[] | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'All Categories' },
    ...activeTags.map((tag) => ({
      value: tag,
      label: tag,
      className: 'font-mono font-semibold'
    }))
  ], [activeTags])

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const showTotalScore = useMemo(() => {
    return searchParams.get('tab') === 'total'
  }, [searchParams])
  const setShowTotalScore = useCallback((value: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('tab', 'total')
    } else {
      params.set('tab', 'unique')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  const view: 'top' | 'all' = useMemo(() => {
    const value = searchParams.get('view')
    return value === 'all' ? 'all' : 'top'
  }, [searchParams])
  const setView = useCallback((tab: 'top' | 'all') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', tab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  const selectedTag = useMemo(() => {
    return searchParams.get('tag') || ''
  }, [searchParams])
  const setSelectedTag = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('tag', value)
    } else {
      params.delete('tag')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, pathname, router])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!authLoading && user && !APP.teams.enabled) {
      router.replace('/scoreboard')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    getSolvedEventIds().then(setSolvedEventIds)
    getActiveUserTags().then(setActiveTags)
  }, [])

  const filteredStartedEvents = useMemo(() => {
    if (solvedEventIds === null) return startedEvents
    const solved = startedEvents.filter((e) => solvedEventIds.includes(String(e.id)))
    const selectedInList = selectedEvent === 'all' || selectedEvent === 'main' || solved.some((e) => String(e.id) === String(selectedEvent))
    if (selectedInList) return solved
    const currentEvent = startedEvents.find((e) => String(e.id) === String(selectedEvent))
    if (currentEvent) return [...solved, currentEvent]
    return solved
  }, [startedEvents, solvedEventIds, selectedEvent])

  const { loading, entries, series, currentTeamName } = useTeamScoreboard(user, showTotalScore, selectedEvent, view, selectedTag)

  const isDateFiltered = Boolean(startDate || endDate)
  const currentEntries = useMemo(() => {
    if (!isDateFiltered) return entries
    const startIso = startDate ? new Date(startDate).toISOString() : null
    const endIso = endDate ? new Date(endDate).toISOString() : null

    return entries
      .map((entry) => {
        const teamSeries = series.find((s) => s.team_name === entry.team_name)
        const history = (teamSeries?.history || []).filter((p) => {
          if (endIso && p.date > endIso) return false
          if (startIso && p.date < startIso) return false
          return true
        })
        const recalculatedScore = history.length > 0 ? (history.at(-1)?.score ?? 0) : 0
        return {
          ...entry,
          [showTotalScore ? 'total_score' : 'unique_score']: recalculatedScore,
        }
      })
      .filter((entry) => (showTotalScore ? entry.total_score : entry.unique_score) > 0)
      .sort((a, b) => {
        const scoreA = showTotalScore ? a.total_score : a.unique_score
        const scoreB = showTotalScore ? b.total_score : b.unique_score
        return scoreB - scoreA
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }))
  }, [entries, series, startDate, endDate, isDateFiltered, showTotalScore])

  const currentSeries = useMemo(() => {
    if (!isDateFiltered) return series
    const startIso = startDate ? new Date(startDate).toISOString() : null
    const endIso = endDate ? new Date(endDate).toISOString() : null

    return series.map((s) => ({
      ...s,
      history: s.history.filter((p) => {
        if (endIso && p.date > endIso) return false
        if (startIso && p.date < startIso) return false
        return true
      }),
    }))
  }, [series, startDate, endDate, isDateFiltered])

  const isDark = theme === 'dark'
  const scoreLabel = showTotalScore ? 'Total Score' : 'Unique Score'
  const selectedScoreboardEvent = selectedEvent === 'all' || selectedEvent === 'main'
    ? undefined
    : startedEvents.find((event) => String(event.id) === String(selectedEvent))
  const exportEventLabel = selectedEvent === 'all'
    ? 'All Events'
    : selectedEvent === 'main'
      ? 'Main Scoreboard'
      : String(selectedScoreboardEvent?.name ?? 'Selected Event')
  const exportType = showTotalScore ? 'total_score' : 'unique_score'

  const fetchTeamExportSnapshot = useCallback(async ({
    fromRank,
    toRank,
    sourceUrl,
    startDate: customStart,
    endDate: customEnd,
  }: {
    fromRank: number
    toRank: number
    sourceUrl: string
    startDate?: string | null
    endDate?: string | null
  }): Promise<ScoreboardExportSnapshot> => {
    const effectiveStart = customStart ?? (startDate || null)
    const effectiveEnd = customEnd ?? (endDate || null)

    const p_event_id = (selectedEvent === 'all' || selectedEvent === 'main') ? null : String(selectedEvent)
    const p_event_mode = selectedEvent === 'all' ? 'any' : selectedEvent === 'main' ? 'main' : 'event'
    const safeFromRank = Math.max(1, Math.floor(fromRank))
    const safeToRank = Math.max(safeFromRank, Math.floor(toRank))
    const fetchLimit = Math.max(10, safeToRank)
    const scoreKey = showTotalScore ? 'total_score' : 'unique_score'
    const { entries: data } = await getTeamScoreboard(fetchLimit, 0, p_event_id, p_event_mode, selectedTag || null)

    const endIso = effectiveEnd ? new Date(effectiveEnd).toISOString() : null
    const startIso = effectiveStart ? new Date(effectiveStart).toISOString() : null
    const exportedAt = endIso || new Date().toISOString()
    const dateRangeLabel = createDateRangeLabel(effectiveStart, effectiveEnd)

    const rawNames = (data || []).map((item) => item.team_name).filter(Boolean)
    const rawProgressData = showTotalScore
      ? await getTopTeamProgressByNames(rawNames, p_event_id, p_event_mode)
      : await getTopTeamUniqueProgressByNames(rawNames, p_event_id, p_event_mode)

    const effectiveProgressData: typeof rawProgressData = {}
    if (endIso || startIso) {
      for (const [tname, tdata] of Object.entries(rawProgressData)) {
        const filteredHistory = (tdata.history || []).filter((p) => {
          if (endIso && p.date > endIso) return false
          if (startIso && p.date < startIso) return false
          return true
        })
        effectiveProgressData[tname] = {
          ...tdata,
          history: filteredHistory,
        }
      }
    } else {
      Object.assign(effectiveProgressData, rawProgressData)
    }

    const effectiveData = (endIso || startIso)
      ? (data || []).map((team) => {
        const history = effectiveProgressData[team.team_name]?.history || []
        const recalculatedScore = history.length > 0 ? (history.at(-1)?.score ?? 0) : 0
        return {
          ...team,
          [scoreKey]: recalculatedScore,
        }
      })
      : (data || [])

    const result = buildScoreboard(effectiveData, {
      nameKey: 'team_name',
      scoreKey,
      filterZero: true,
      limit: fetchLimit,
    })
    const teamEntries: TeamScoreboardEntry[] = result.entries.map((entry) => {
      const original = effectiveData.find((item) => item.team_name === entry.username)
      return {
        ...original,
        team_id: entry.id,
        team_name: entry.username,
        [scoreKey]: entry.score,
      } as TeamScoreboardEntry
    })

    return {
      tableEntries: teamEntries.slice(safeFromRank - 1, safeToRank),
      chartEntries: getOrderedProgressSeries(result.topNames, effectiveProgressData) as TeamProgressSeries[],
      exportedAt,
      mode: 'points',
      eventLabel: exportEventLabel,
      sourceUrl,
      scope: 'team',
      fileType: exportType,
      fromRank: safeFromRank,
      toRank: safeToRank,
      startDate: effectiveStart,
      endDate: effectiveEnd,
      dateRangeLabel,
    }
  }, [exportEventLabel, exportType, selectedEvent, showTotalScore, selectedTag, startDate, endDate])

  if (authLoading) {
    return <Loader fullscreen color="text-blue-500" />
  }

  if (!user || !APP.teams.enabled) return null

  return (
    <PageBackground
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
      contentClassName={cn(PAGE_MAIN_CONTAINER_6XL, "space-y-4 py-4 sm:py-6")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <ScoreboardScopeTabs
            view={view}
            onViewChange={setView}
          />

          <div className="w-full sm:w-auto">
            <EventSelect
              value={String(selectedEvent)}
              onChange={setSelectedEvent as any}
              events={filteredStartedEvents}
              className="w-full max-w-full sm:w-[180px]"
              defaultValue="all"
              clearable
              getEventLabel={(ev: any) => String(ev?.name ?? ev?.title ?? 'Untitled')}
            />
          </div>

          {activeTags.length > 0 && (
            <FilterSelect
              options={categoryOptions}
              value={selectedTag || 'all'}
              defaultValue="all"
              onChange={(val) => setSelectedTag(val === 'all' ? '' : val)}
              placeholder="All Categories"
              className="w-full sm:w-[160px]"
            />
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <ScoreboardDateFilter
            startDate={startDate}
            endDate={endDate}
            onApply={(start, end) => {
              setStartDate(start)
              setEndDate(end)
            }}
            onReset={() => {
              setStartDate('')
              setEndDate('')
            }}
          />

          {entries.length > 0 && (
            <ScoreboardExportActions
              selectedEvent={selectedEvent}
              eventLabel={exportEventLabel}
              mode="points"
              modeLabel={scoreLabel}
              startDate={startDate}
              endDate={endDate}
              fetchSnapshot={fetchTeamExportSnapshot}
              renderChart={(snapshot) => (
                <TeamScoreboardChart
                  series={snapshot.chartEntries as TeamProgressSeries[]}
                  isDark={isDark}
                  scoreLabel={scoreLabel}
                />
              )}
              renderTable={(snapshot) => (
                <TeamScoreboardTable
                  entries={snapshot.tableEntries as TeamScoreboardEntry[]}
                  showTotalScore={showTotalScore}
                  rankOffset={snapshot.fromRank - 1}
                />
              )}
            />
          )}
          <AppTabs
            items={[
              { value: 'unique', label: 'Unique Score', icon: Sparkles },
              ...(!APP.teams.hidescoreboardTotal
                ? [{ value: 'total' as const, label: 'Total Score', icon: Coins }]
                : []),
            ]}
            value={showTotalScore ? 'total' : 'unique'}
            onValueChange={(tab) => setShowTotalScore(tab === 'total')}
            variant="panel"
            size="sm"
            className="w-full sm:w-fit"
            stretch
            ariaLabel="Team scoreboard mode"
          />
        </div>
      </div>

      <div
        key={`${showTotalScore}-${selectedEvent}-${startDate}-${endDate}`}
        className="space-y-6"
      >
        {currentSeries.length > 0 && !showTotalScore && view !== 'all' && (
          <TeamScoreboardChart
            series={currentSeries}
            isDark={isDark}
            scoreLabel={scoreLabel}
          />
        )}

        {loading && currentEntries.length === 0 ? (
          <PageLoader />
        ) : currentEntries.length === 0 ? (
          <Card className={SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS}>
            <CardContent>
              <EmptyState
                icon={<Trophy className="w-full h-full text-blue-500" />}
                title={isDateFiltered ? 'No teams solved in this period.' : 'No teams on the board yet.'}
                description={
                  isDateFiltered ? (
                    <>Tidak ada submission tim yang ditemukan pada rentang tanggal yang dipilih.</>
                  ) : (
                    <>
                      No team submissions yet for this event. Start solving challenges with your team!
                      <Rocket size={14} className="inline-block ml-1 text-blue-400/70" />
                    </>
                  )
                }
                containerHeight="py-12"
                action={
                  isDateFiltered ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStartDate('')
                        setEndDate('')
                      }}
                      className="rounded-xl"
                    >
                      Reset Filter Tanggal
                    </Button>
                  ) : undefined
                }
              />
            </CardContent>
          </Card>
        ) : (
          <TeamScoreboardTable
            entries={currentEntries}
            showTotalScore={showTotalScore}
            currentTeamName={currentTeamName}
          />
        )}
      </div>
    </PageBackground>
  )
}
