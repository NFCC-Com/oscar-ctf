"use client"

import AddEventAdminCard from '@/features/admin/admins/components/AddEventAdminCard'
import EventAdminsCard from '@/features/admin/admins/components/EventAdminsCard'
import GlobalAdminsCard from '@/features/admin/admins/components/GlobalAdminsCard'
import RemoveEventAdminConfirmDialog from '@/features/admin/admins/components/RemoveEventAdminConfirmDialog'
import { useAdminAdminsData } from '@/features/admin/admins/hooks/useAdminAdminsData'
import { AdminContentLoading } from '../../ui'

export default function UserRolesTab() {
  const {
    user,
    authLoading,
    isLoading,
    isAllowed,
    events,
    globalAdmins,
    eventAdmins,
    usernameQuery,
    setUsernameQuery,
    userResults,
    setUserResults,
    selectedUser,
    setSelectedUser,
    selectedEventId,
    setSelectedEventId,
    selectedEvent,
    submitting,
    canSubmit,
    confirmOpen,
    setConfirmOpen,
    pendingRemove,
    askRemove,
    doRemove,
    doGrant,
    resetGrantForm,
  } = useAdminAdminsData()

  if (authLoading || isLoading) return <AdminContentLoading variant="admins" />
  if (!user || !isAllowed) return null

  return (
    <>
      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <div className="space-y-5">
          <EventAdminsCard admins={eventAdmins} onAskRemove={askRemove} />
          <GlobalAdminsCard admins={globalAdmins} />
        </div>

        <AddEventAdminCard
          events={events}
          usernameQuery={usernameQuery}
          userResults={userResults}
          selectedUser={selectedUser}
          selectedEventId={selectedEventId}
          selectedEventName={selectedEvent?.name ?? null}
          submitting={submitting}
          canSubmit={canSubmit}
          onUsernameChange={(value) => {
            setUsernameQuery(value)
            setSelectedUser(null)
          }}
          onUserSelect={(user) => {
            setSelectedUser(user)
            setUsernameQuery(user.username)
            setUserResults([])
          }}
          onEventChange={setSelectedEventId}
          onSubmit={doGrant}
          onReset={resetGrantForm}
        />
      </div>

      <RemoveEventAdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        pendingRemove={pendingRemove}
        onConfirm={doRemove}
      />
    </>
  )
}
