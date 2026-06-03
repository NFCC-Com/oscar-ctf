import React from 'react'
import { ShieldAlert } from 'lucide-react'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { AdminPanel } from '@/features/admin/ui'
import type { EventAdminRow } from '../types'

interface EventAdminsCardProps {
  admins: EventAdminRow[]
  onAskRemove: (admin: EventAdminRow) => void
}

const EventAdminsCard: React.FC<EventAdminsCardProps> = ({ admins, onAskRemove }) => {
  return (
    <AdminPanel title="Event Admins" icon={ShieldAlert} contentClassName="p-0">
      {admins.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm font-medium text-muted-foreground">
          No event admins assigned yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200/80 hover:bg-transparent dark:border-gray-800">
                <TableHead className="px-5">Username</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="w-[120px] text-right px-5">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={`${admin.user_id}:${admin.event_id}`} className="border-b border-gray-100/80 transition-colors duration-150 ease-in-out last:border-b-0 hover:bg-blue-50/40 dark:border-gray-800/70 dark:hover:bg-blue-900/10">
                  <TableCell className="font-medium px-5 py-3">{admin.username}</TableCell>
                  <TableCell className="py-3">{admin.event_name}</TableCell>
                  <TableCell className="text-right px-5 py-3">
                    <Button variant="outline" size="sm" onClick={() => onAskRemove(admin)} className="rounded-xl">
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPanel>
  )
}

export default EventAdminsCard

