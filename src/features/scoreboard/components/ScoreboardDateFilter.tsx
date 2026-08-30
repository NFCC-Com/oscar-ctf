'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, X, Check, Clock, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/lib/utils'

export interface ScoreboardDateFilterProps {
  startDate: string
  endDate: string
  onApply: (startDate: string, endDate: string) => void
  onReset: () => void
  className?: string
}

function toLocalDatetimeInputString(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

function formatShortBadgeDate(value: string) {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    const day = d.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${day} ${months[d.getMonth()]}`
  } catch {
    return value
  }
}

export default function ScoreboardDateFilter({
  startDate,
  endDate,
  onApply,
  onReset,
  className,
}: ScoreboardDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempStart, setTempStart] = useState(startDate)
  const [tempEnd, setTempEnd] = useState(endDate)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setTempStart(startDate)
    setTempEnd(endDate)
  }, [startDate, endDate])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const isActive = Boolean(startDate || endDate)

  const handleApply = () => {
    onApply(tempStart, tempEnd)
    setIsOpen(false)
  }

  const handleClear = () => {
    setTempStart('')
    setTempEnd('')
    onReset()
    setIsOpen(false)
  }

  const handlePreset = (preset: 'today' | '24h' | '7d' | '30d' | '90d' | '1y') => {
    const now = new Date()
    const endStr = toLocalDatetimeInputString(now)
    let startStr = ''

    if (preset === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      startStr = toLocalDatetimeInputString(todayStart)
    } else if (preset === '24h') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      startStr = toLocalDatetimeInputString(yesterday)
    } else if (preset === '7d') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startStr = toLocalDatetimeInputString(lastWeek)
    } else if (preset === '30d') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), now.getHours(), now.getMinutes())
      startStr = toLocalDatetimeInputString(oneMonthAgo)
    } else if (preset === '90d') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), now.getHours(), now.getMinutes())
      startStr = toLocalDatetimeInputString(threeMonthsAgo)
    } else if (preset === '1y') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes())
      startStr = toLocalDatetimeInputString(oneYearAgo)
    }

    setTempStart(startStr)
    setTempEnd(endStr)
    onApply(startStr, endStr)
    setIsOpen(false)
  }

  const getButtonLabel = () => {
    if (startDate && endDate) {
      return `${formatShortBadgeDate(startDate)} - ${formatShortBadgeDate(endDate)}`
    }
    if (endDate) {
      return `s.d. ${formatShortBadgeDate(endDate)}`
    }
    if (startDate) {
      return `Sejak ${formatShortBadgeDate(startDate)}`
    }
    return 'Filter Tanggal'
  }

  return (
    <div className={cn('relative inline-block', className)} ref={popoverRef}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'h-9 rounded-xl px-3 text-xs font-semibold transition-colors flex items-center gap-1.5',
            isActive
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:border-blue-400/40 dark:bg-blue-900/25 dark:text-blue-300'
              : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900/50'
          )}
        >
          <Calendar className={cn('h-3.5 w-3.5', isActive && 'text-blue-500')} />
          <span>{getButtonLabel()}</span>
          {isActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          )}
        </Button>

        {isActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-9 w-7 p-0 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10"
            title="Reset Date Filter"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(94vw,340px)] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-[#0b0f19]">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>Filter Tanggal Scoreboard</span>
              </div>
              {isActive && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] font-semibold text-red-500 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Preset Cepat
              </Label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePreset('today')}
                  className="rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-500/10 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900/50"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('24h')}
                  className="rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-500/10 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900/50"
                >
                  24 Jam
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('7d')}
                  className="rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-500/10 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900/50"
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('30d')}
                  className="rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-500/10 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900/50"
                >
                  1 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('90d')}
                  className="rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-500/10 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900/50"
                >
                  3 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('1y')}
                  className="rounded-xl border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-500/10 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900/50"
                >
                  1 Tahun
                </button>
              </div>
            </div>

            {/* Custom Range Inputs */}
            <div className="space-y-2.5 pt-1">
              <div>
                <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                  Dari (Mulai)
                </Label>
                <Input
                  type="datetime-local"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="mt-1 h-8 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                  Sampai / Cutoff (Akhir)
                </Label>
                <Input
                  type="datetime-local"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="mt-1 h-8 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 rounded-xl px-3 text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 text-xs font-bold flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Terapkan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
