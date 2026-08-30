import {
  getFirstBloodLeaderboard,
  getLeaderboardSummary,
  getTopProgressByUsernames,
} from '@/shared/lib'
import type { LeaderboardEntry } from '@/shared/types'
import APP from '@/config'
import { buildScoreboard, getScoreboardEventParam } from './build-scoreboard'
import type { LeaderboardSummaryRow } from '../types'

export type ScoreboardExportMode = 'points' | 'first-blood'

export type ScoreboardExportSnapshot = {
  tableEntries: unknown[]
  chartEntries: unknown[]
  exportedAt: string
  mode: ScoreboardExportMode
  eventLabel: string
  sourceUrl: string
  scope: string
  fileType: string
  fromRank: number
  toRank: number
  startDate?: string | null
  endDate?: string | null
  dateRangeLabel?: string | null
}

export function formatExportSnapshotDate(value: string) {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(d)
  } catch {
    return value
  }
}

export function createDateRangeLabel(startDate?: string | null, endDate?: string | null): string | null {
  if (!startDate && !endDate) return null
  if (startDate && endDate) {
    return `${formatExportSnapshotDate(startDate)} s.d. ${formatExportSnapshotDate(endDate)} WIB`
  }
  if (endDate) {
    return `${formatExportSnapshotDate(endDate)} WIB`
  }
  if (startDate) {
    return `Sejak ${formatExportSnapshotDate(startDate)} WIB`
  }
  return null
}

export async function fetchScoreboardExportSnapshot({
  selectedEvent,
  eventLabel,
  sourceUrl,
  scope = 'individu',
  mode,
  fromRank,
  toRank,
  startDate,
  endDate,
}: {
  selectedEvent: string | number
  eventLabel: string
  sourceUrl: string
  scope?: string
  mode: ScoreboardExportMode
  fromRank: number
  toRank: number
  startDate?: string | null
  endDate?: string | null
}): Promise<ScoreboardExportSnapshot> {
  const eventParam = getScoreboardEventParam(selectedEvent)
  const safeFromRank = Math.max(1, Math.floor(fromRank))
  const safeToRank = Math.max(safeFromRank, Math.floor(toRank))
  const fetchLimit = Math.max(10, safeToRank)

  const endIso = endDate ? new Date(endDate).toISOString() : null
  const startIso = startDate ? new Date(startDate).toISOString() : null
  const exportedAt = endIso || new Date().toISOString()
  const dateRangeLabel = createDateRangeLabel(startDate, endDate)

  if (mode === 'first-blood') {
    const rawLeaderboard = await getFirstBloodLeaderboard(fetchLimit, 0, eventParam)
    let leaderboard = rawLeaderboard
    if (endIso || startIso) {
      leaderboard = rawLeaderboard.map((entry: any) => {
        const filteredProgress = (entry.progress || []).filter((p: any) => {
          if (endIso && p.date > endIso) return false
          if (startIso && p.date < startIso) return false
          return true
        })
        const score = filteredProgress.length
        return {
          ...entry,
          score,
          progress: filteredProgress,
        }
      })
      .filter((entry: any) => entry.score > 0)
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
    }

    return {
      tableEntries: leaderboard.slice(safeFromRank - 1, safeToRank),
      chartEntries: leaderboard.slice(0, 10),
      exportedAt,
      mode,
      eventLabel,
      sourceUrl,
      scope,
      fileType: 'first_blood',
      fromRank: safeFromRank,
      toRank: safeToRank,
      startDate,
      endDate,
      dateRangeLabel,
    }
  }

  const summary = await getLeaderboardSummary(fetchLimit, 0, eventParam)
  const topUsernames = (endIso || startIso)
    ? summary.slice(0, fetchLimit).map((row: LeaderboardSummaryRow) => row.username)
    : summary.slice(0, 10).map((row: LeaderboardSummaryRow) => row.username)
  const progressMap = await getTopProgressByUsernames(topUsernames, eventParam)

  // Filter progressMap by date if specified
  const filteredProgressMap: typeof progressMap = {}
  if (endIso || startIso) {
    for (const [uname, udata] of Object.entries(progressMap)) {
      const filteredHistory = (udata.history || []).filter((p) => {
        if (endIso && p.date > endIso) return false
        if (startIso && p.date < startIso) return false
        return true
      })
      filteredProgressMap[uname] = {
        ...udata,
        history: filteredHistory,
      }
    }
  }

  const effectiveProgressMap = (endIso || startIso) ? filteredProgressMap : progressMap

  // Recalculate summary scores at cutoff date if filtered (0 if no solves in range)
  const effectiveSummary = (endIso || startIso)
    ? summary.map((row: LeaderboardSummaryRow) => {
      const history = effectiveProgressMap[row.username]?.history || []
      const score = history.length > 0 ? (history.at(-1)?.score ?? 0) : 0
      return {
        ...row,
        score,
      }
    })
    : summary

  const result = buildScoreboard(effectiveSummary, {
    nameKey: 'username',
    scoreKey: 'score',
    limit: fetchLimit,
    filterZero: Boolean(endIso || startIso),
    progressMap: effectiveProgressMap,
  })

  return {
    tableEntries: result.entries.slice(safeFromRank - 1, safeToRank),
    chartEntries: result.entries.slice(0, 10),
    exportedAt,
    mode,
    eventLabel,
    sourceUrl,
    scope,
    fileType: 'point',
    fromRank: safeFromRank,
    toRank: safeToRank,
    startDate,
    endDate,
    dateRangeLabel,
  }
}

export function createScoreboardExportFilename(snapshot: ScoreboardExportSnapshot) {
  const platformName = slugFilenamePart(APP.shortName || APP.fullName || 'nxctf') || 'nxctf'
  const scope = slugFilenamePart(snapshot.scope) || 'scoreboard'
  const eventName = slugFilenamePart(snapshot.eventLabel) || 'scoreboard'
  const type = slugFilenamePart(snapshot.fileType) || 'point'
  
  let dateSuffix = snapshot.exportedAt.slice(0, 10)
  if (snapshot.startDate && snapshot.endDate) {
    dateSuffix = `${snapshot.startDate.slice(0, 10)}_to_${snapshot.endDate.slice(0, 10)}`
  } else if (snapshot.endDate) {
    dateSuffix = `until_${snapshot.endDate.slice(0, 10)}`
  } else if (snapshot.startDate) {
    dateSuffix = `since_${snapshot.startDate.slice(0, 10)}`
  }

  return `${platformName}-${scope}-${eventName}-${type}-${dateSuffix}.png`
}

export function slugFilenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '')
}
