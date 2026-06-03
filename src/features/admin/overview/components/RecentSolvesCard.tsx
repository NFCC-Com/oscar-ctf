import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { ADMIN_CARD_PLAIN_CLASS } from '@/features/admin/ui'
import { formatRelativeDate } from '@/features/admin/solvers/lib'
import type { SolverRow } from '@/features/admin/solvers/types'

type RecentSolvesCardProps = {
  solves: SolverRow[]
}

export default function RecentSolvesCard({ solves }: RecentSolvesCardProps) {
  return (
    <Card className={ADMIN_CARD_PLAIN_CLASS}>
      <CardHeader>
        <CardTitle>Recent Solves</CardTitle>
      </CardHeader>
      <CardContent>
        {solves.length === 0 ? (
          <div className="rounded-lg border border-gray-200/80 px-4 py-8 text-center text-sm font-medium text-muted-foreground dark:border-gray-800/80">
            No solves recorded yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solves.slice(0, 10).map((solve) => (
                <TableRow key={solve.solve_id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/user/${encodeURIComponent(solve.username)}`}
                      className="text-blue-600 hover:underline dark:text-blue-300"
                    >
                      {solve.username}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {solve.challenge_title}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatRelativeDate(solve.solved_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
