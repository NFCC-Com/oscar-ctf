"use client"

import { Loader } from '@/shared/components'
import DeleteSolverConfirmDialog from './DeleteSolverConfirmDialog'
import SolversListCard from './SolversListCard'
import { useAdminSolversData } from '../hooks/useAdminSolversData'
import { AdminContentLoading, AdminPageShell } from '../../ui'

export default function AdminSolversPage() {
  const {
    user,
    authLoading,
    isLoading,
    isAdminUser,
    solvers,
    offset,
    hasMore,
    loadingMore,
    searchQuery,
    setSearchQuery,
    searching,
    confirmOpen,
    setConfirmOpen,
    pendingDelete,
    setPendingDelete,
    pendingDeleteDetail,
    setPendingDeleteDetail,
    fetchSolvers,
    searchSolvers,
    resetSearch,
    askDelete,
    doDelete,
  } = useAdminSolversData()

  if (authLoading || (isLoading && !isAdminUser)) return <Loader fullscreen />
  if (!user || !isAdminUser) return null

  if (isLoading) {
    return (
      <AdminPageShell
        title="Solvers"
        subtitle="Review submissions and manage solve records."
      >
        <AdminContentLoading variant="solvers" />
      </AdminPageShell>
    )
  }

  const clearPendingDelete = () => {
    setPendingDelete(null)
    setPendingDeleteDetail(null)
  }

  return (
    <>
      <AdminPageShell
        title="Solvers"
        subtitle="Review submissions and manage solve records."
      >
        <SolversListCard
          solvers={solvers}
          searchQuery={searchQuery}
          searching={searching}
          loadingMore={loadingMore}
          hasMore={hasMore}
          offset={offset}
          onSearchQueryChange={setSearchQuery}
          onSearch={() => void searchSolvers()}
          onReset={() => void resetSearch()}
          onAskDelete={askDelete}
          onLoadMore={fetchSolvers}
        />
      </AdminPageShell>

      <DeleteSolverConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        pendingDelete={pendingDelete}
        pendingDeleteDetail={pendingDeleteDetail}
        onConfirmDelete={doDelete}
        onClearPendingDelete={clearPendingDelete}
      />
    </>
  )
}
