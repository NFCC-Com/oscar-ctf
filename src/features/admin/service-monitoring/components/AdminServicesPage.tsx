"use client"

import { useEffect, useMemo, useState } from 'react'
import { AdminContentLoading, AdminPageShell } from '@/features/admin/ui'
import {
  getFilteredServiceRows,
  getServiceType,
  getServicesSummary,
  getUniqueOptions,
} from '../lib/admin-services-utils'
import { useAdminServicesData } from '../hooks/useAdminServicesData'
import type { AdminServicesFilters } from '../types'
import AdminServiceDetailDialog from './AdminServiceDetailDialog'
import AdminServicesSummary from './AdminServicesSummary'
import AdminServicesTable from './AdminServicesTable'
import AdminServicesToolbar from './AdminServicesToolbar'

const DEFAULT_FILTERS: AdminServicesFilters = {
  search: '',
  status: 'all',
  eventId: 'all',
  category: 'all',
  difficulty: 'all',
  type: 'all',
}

export default function AdminServicesPage() {
  const {
    user,
    authLoading,
    accessReady,
    isAllowed,
    isGlobalAdmin,
    events,
    serviceRows,
    isLoading,
    isRefreshing,
    statusLoading,
    actionLoading,
    refresh,
    runServiceAction,
  } = useAdminServicesData()

  const [filters, setFilters] = useState<AdminServicesFilters>(DEFAULT_FILTERS)
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  useEffect(() => {
    if (serviceRows.length === 0) return
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [serviceRows.length])

  const summary = useMemo(
    () => getServicesSummary(serviceRows, nowTick),
    [nowTick, serviceRows]
  )
  const filteredRows = useMemo(
    () => getFilteredServiceRows(serviceRows, filters, nowTick),
    [filters, nowTick, serviceRows]
  )
  const selectedRow = useMemo(
    () => serviceRows.find((row) => row.id === selectedServiceId) || null,
    [selectedServiceId, serviceRows]
  )
  const categories = useMemo(
    () => getUniqueOptions(serviceRows.map((row) => row.challenge.category)),
    [serviceRows]
  )
  const difficulties = useMemo(
    () => getUniqueOptions(serviceRows.map((row) => row.challenge.difficulty)),
    [serviceRows]
  )
  const serviceTypes = useMemo(
    () => getUniqueOptions(serviceRows.map(getServiceType)),
    [serviceRows]
  )

  if (authLoading || !accessReady) return <AdminContentLoading variant="services" />
  if (!user || !isAllowed) return null

  if (isLoading) {
    return (
      <AdminPageShell>
        <AdminContentLoading variant="services" />
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell>
      <div className="space-y-5">
        <AdminServicesSummary summary={summary} />
        <AdminServicesToolbar
          filters={filters}
          events={events}
          categories={categories}
          difficulties={difficulties}
          serviceTypes={serviceTypes}
          isRefreshing={isRefreshing}
          statusLoading={statusLoading}
          onFiltersChange={setFilters}
          onRefresh={() => void refresh()}
        />
        <AdminServicesTable
          rows={filteredRows}
          isGlobalAdmin={isGlobalAdmin}
          actionLoading={actionLoading}
          onAction={(row, action) => void runServiceAction(row, action)}
          onView={(row) => setSelectedServiceId(row.id)}
        />
      </div>

      <AdminServiceDetailDialog
        row={selectedRow}
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedServiceId(null)
        }}
      />
    </AdminPageShell>
  )
}
