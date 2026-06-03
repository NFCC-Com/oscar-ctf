import React from 'react'
import { Search } from 'lucide-react'
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from '@/shared/ui'
import type { AdminChallengeEventId, AdminChallengeFilterState, Event } from '../types'

interface AdminChallengeFiltersProps {
  filters: AdminChallengeFilterState
  onFiltersChange: React.Dispatch<React.SetStateAction<AdminChallengeFilterState>>
  categories: string[]
  difficulties: string[]
  events: Event[]
  selectedEventId: AdminChallengeEventId
  onEventChange: (eventId: AdminChallengeEventId) => void
  isGlobalAdmin: boolean
  onClear: () => void
}

export default function AdminChallengeFilters({
  filters,
  onFiltersChange,
  categories,
  difficulties,
  events,
  selectedEventId,
  onEventChange,
  isGlobalAdmin,
  onClear,
}: AdminChallengeFiltersProps) {
  const isDirty =
    filters.search ||
    filters.scope !== 'all' ||
    filters.category !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.visibility !== 'all' ||
    filters.service !== 'all' ||
    selectedEventId !== 'all'

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Input Row */}
      <div className="flex flex-1 items-center gap-2 w-full max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <Input
            type="text"
            value={filters.search}
            onChange={(e) => onFiltersChange((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search challenge by name or description..."
            className="pl-9 h-9 w-full"
          />
        </div>
        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-xs h-9 font-semibold text-gray-500 hover:text-red-600 rounded-xl px-3 shrink-0"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Select Dropdowns Row */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* Category Filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</span>
          <Select
            value={filters.category}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, category: val }))}
          >
            <SelectTrigger className="w-[145px] h-9 text-xs rounded-xl bg-white/70 dark:bg-[#111622]/80 border border-gray-200/80 dark:border-gray-700/80 font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500/40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-[#111622]/95 border border-gray-200/80 dark:border-gray-800/90 rounded-xl shadow-lg backdrop-blur-xl max-h-[300px] overflow-y-auto">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Difficulty</span>
          <Select
            value={filters.difficulty}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, difficulty: val }))}
          >
            <SelectTrigger className="w-[145px] h-9 text-xs rounded-xl bg-white/70 dark:bg-[#111622]/80 border border-gray-200/80 dark:border-gray-700/80 font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500/40">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-[#111622]/95 border border-gray-200/80 dark:border-gray-800/90 rounded-xl shadow-lg backdrop-blur-xl">
              <SelectItem value="all">All Difficulties</SelectItem>
              {difficulties.map((diff) => (
                <SelectItem key={diff} value={diff} className="capitalize">{diff}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visibility Filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Visibility</span>
          <Select
            value={filters.visibility}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, visibility: val as any }))}
          >
            <SelectTrigger className="w-[145px] h-9 text-xs rounded-xl bg-white/70 dark:bg-[#111622]/80 border border-gray-200/80 dark:border-gray-700/80 font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500/40">
              <SelectValue placeholder="All Visibility" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-[#111622]/95 border border-gray-200/80 dark:border-gray-800/90 rounded-xl shadow-lg backdrop-blur-xl">
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="active">Active / Visible</SelectItem>
              <SelectItem value="inactive">Inactive / Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Service Filter */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Services</span>
          <Select
            value={filters.service}
            onValueChange={(val) => onFiltersChange((prev) => ({ ...prev, service: val as any }))}
          >
            <SelectTrigger className="w-[145px] h-9 text-xs rounded-xl bg-white/70 dark:bg-[#111622]/80 border border-gray-200/80 dark:border-gray-700/80 font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500/40">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-[#111622]/95 border border-gray-200/80 dark:border-gray-800/90 rounded-xl shadow-lg backdrop-blur-xl">
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="has_service">Has Service</SelectItem>
              <SelectItem value="no_service">No Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Event Filter */}
        {(isGlobalAdmin || events.length > 0) && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Event Scope</span>
            <Select
              value={selectedEventId === null ? 'main' : String(selectedEventId)}
              onValueChange={(val) => {
                if (val === 'all') onEventChange('all')
                else if (val === 'main') onEventChange(null)
                else onEventChange(val)
              }}
            >
              <SelectTrigger className="w-[165px] h-9 text-xs rounded-xl bg-white/70 dark:bg-[#111622]/80 border border-gray-200/80 dark:border-gray-700/80 font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500/40">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-[#111622]/95 border border-gray-200/80 dark:border-gray-800/90 rounded-xl shadow-lg backdrop-blur-xl max-h-[300px] overflow-y-auto">
                {isGlobalAdmin && <SelectItem value="all">All Events</SelectItem>}
                {isGlobalAdmin && <SelectItem value="main">Main Event Only</SelectItem>}
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
