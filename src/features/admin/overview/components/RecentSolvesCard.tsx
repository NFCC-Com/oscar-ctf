import Link from 'next/link'
import { Flag } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { AdminPanel } from '@/features/admin/ui'
import { formatRelativeDate } from '@/features/admin/solvers/lib'
import type { SolverRow } from '@/features/admin/solvers/types'

type RecentSolvesCardProps = {
  solves: SolverRow[]
}

export default function RecentSolvesCard({ solves }: RecentSolvesCardProps) {
  return (
    <AdminPanel title="Recent Solves" icon={Flag} contentClassName="p-0">
      {solves.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm font-medium text-muted-foreground">
          No solves recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200/80 hover:bg-transparent dark:border-gray-800">
                <TableHead className="px-5">User</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead className="text-right px-5">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solves.slice(0, 10).map((solve) => (
                <TableRow key={solve.solve_id} className="border-b border-gray-100/80 transition-colors duration-150 ease-in-out last:border-b-0 hover:bg-blue-50/40 dark:border-gray-800/70 dark:hover:bg-blue-900/10">
                  <TableCell className="font-medium px-5 py-3">
                    <Link
                      href={`/user/${encodeURIComponent(solve.username)}`}
                      className="text-blue-600 hover:underline dark:text-blue-300"
                    >
                      {solve.username}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground py-3">
                    {solve.challenge_title}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground px-5 py-3">
                    {formatRelativeDate(solve.solved_at)}
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

