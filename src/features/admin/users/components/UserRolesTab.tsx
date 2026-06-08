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
      <div className="space-y-5">
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

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <GlobalAdminsCard admins={globalAdmins} />
          <EventAdminsCard admins={eventAdmins} onAskRemove={askRemove} />
        </div>
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
