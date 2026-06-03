import { RefreshCcw, Search } from 'lucide-react'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { AdminPageSurface } from '@/features/admin/ui'
import type { Event } from '@/shared/types'
import type { AdminServicesFilters } from '../types'

type AdminServicesToolbarProps = {
  filters: AdminServicesFilters
  events: Event[]
  categories: string[]
  difficulties: string[]
  serviceTypes: string[]
  isRefreshing: boolean
  statusLoading: boolean
  onFiltersChange: (filters: AdminServicesFilters) => void
  onRefresh: () => void
}

export default function AdminServicesToolbar({
  filters,
  events,
  categories,
  difficulties,
  serviceTypes,
  isRefreshing,
  statusLoading,
  onFiltersChange,
  onRefresh,
}: AdminServicesToolbarProps) {
  const updateFilter = <K extends keyof AdminServicesFilters>(
    key: K,
    value: AdminServicesFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <AdminPageSurface>
      <div className="grid grid-cols-1 gap-2.5 border-b border-gray-200/50 px-5 py-4 dark:border-gray-800/60 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(140px,1fr))_auto]">
        <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search service, challenge, event..."
            className="rounded-xl pl-9"
          />
        </div>

        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value as AdminServicesFilters['status'])}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.eventId} onValueChange={(value) => updateFilter('eventId', value)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="main">Main / no event</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={String(event.id)}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.difficulty} onValueChange={(value) => updateFilter('difficulty', value)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            {difficulties.map((difficulty) => (
              <SelectItem key={difficulty} value={difficulty}>
                {difficulty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {serviceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing || statusLoading}
          className="rounded-xl"
        >
          <RefreshCcw className={(isRefreshing || statusLoading) ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>
    </AdminPageSurface>
  )
}
