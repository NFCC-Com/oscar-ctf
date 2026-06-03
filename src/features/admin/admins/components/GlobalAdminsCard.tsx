import React from 'react'
import { ShieldCheck } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { AdminPageSurface, AdminTableSurface } from '@/features/admin/ui'
import type { UserLite } from '../types'

interface GlobalAdminsCardProps {
  admins: UserLite[]
}

const GlobalAdminsCard: React.FC<GlobalAdminsCardProps> = ({ admins }) => {
  return (
    <AdminPageSurface>
      <div className="px-5 py-4 border-b border-gray-150 dark:border-gray-800/60 flex items-center gap-2">
        <ShieldCheck size={16} className="text-blue-500" />
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Global Admins</h2>
      </div>

      {admins.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm font-medium text-muted-foreground">
          No global admins found.
        </div>
      ) : (
        <AdminTableSurface>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200/80 hover:bg-transparent dark:border-gray-800">
                <TableHead className="px-5">Username</TableHead>
                <TableHead className="px-5">User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id} className="border-b border-gray-100/80 transition-colors duration-150 ease-in-out last:border-b-0 hover:bg-blue-50/40 dark:border-gray-800/70 dark:hover:bg-blue-900/10">
                  <TableCell className="font-medium px-5 py-3">{admin.username}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground px-5 py-3">{admin.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableSurface>
      )}
    </AdminPageSurface>
  )
}

export default GlobalAdminsCard
