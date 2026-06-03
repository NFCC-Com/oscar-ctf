"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { ADMIN_CARD_PLAIN_CLASS } from '@/features/admin/ui'
import type { AdminUserRow } from '../types'

type UsersTableCardProps = {
  users: AdminUserRow[]
}

type RoleFilter = 'all' | 'admin' | 'user'
type EmailFilter = 'all' | 'confirmed' | 'unconfirmed' | 'missing'
type SortMode = 'score_desc' | 'solves_desc' | 'username_asc' | 'joined_desc' | 'last_login_desc' | 'updated_desc'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function formatDate(value?: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function compareDateDesc(a?: string, b?: string) {
  return new Date(b || 0).getTime() - new Date(a || 0).getTime()
}

function formatNumber(value?: number) {
  return (value ?? 0).toLocaleString()
}

export default function UsersTableCard({ users }: UsersTableCardProps) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [emailFilter, setEmailFilter] = useState<EmailFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('score_desc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return users
      .filter((listedUser) => {
        if (roleFilter === 'admin' && !listedUser.is_admin) return false
        if (roleFilter === 'user' && listedUser.is_admin) return false
        if (emailFilter === 'confirmed' && !listedUser.email_confirmed_at) return false
        if (emailFilter === 'unconfirmed' && (!listedUser.email || listedUser.email_confirmed_at)) return false
        if (emailFilter === 'missing' && listedUser.email) return false
        if (!keyword) return true

        return (
          listedUser.username.toLowerCase().includes(keyword) ||
          (listedUser.email || '').toLowerCase().includes(keyword) ||
          listedUser.id.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => {
        if (sortMode === 'score_desc') return (b.score ?? 0) - (a.score ?? 0)
        if (sortMode === 'solves_desc') return (b.solve_count ?? 0) - (a.solve_count ?? 0)
        if (sortMode === 'joined_desc') return compareDateDesc(a.created_at, b.created_at)
        if (sortMode === 'last_login_desc') return compareDateDesc(a.last_sign_in_at || undefined, b.last_sign_in_at || undefined)
        if (sortMode === 'updated_desc') return compareDateDesc(a.updated_at, b.updated_at)
        return a.username.localeCompare(b.username)
      })
  }, [emailFilter, query, roleFilter, sortMode, users])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const startIndex = (safePage - 1) * pageSize
  const visibleUsers = filteredUsers.slice(startIndex, startIndex + pageSize)
  const firstResult = filteredUsers.length === 0 ? 0 : startIndex + 1
  const lastResult = Math.min(startIndex + pageSize, filteredUsers.length)
  const adminCount = users.filter((listedUser) => listedUser.is_admin).length
  const topScore = users.reduce((currentTop, listedUser) => Math.max(currentTop, listedUser.score ?? 0), 0)
  const totalSolves = users.reduce((total, listedUser) => total + (listedUser.solve_count ?? 0), 0)

  const resetPage = () => setPage(1)

  return (
    <Card className={ADMIN_CARD_PLAIN_CLASS}>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CardTitle>Users</CardTitle>
          <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300">
            {users.length} total
          </Badge>
          <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300">
            {formatNumber(topScore)} top score
          </Badge>
          <Badge variant="outline" className="border-gray-300/80 bg-gray-100/60 text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
            {adminCount} admins
          </Badge>
          <Badge variant="outline" className="border-gray-300/80 bg-gray-100/60 text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300">
            {formatNumber(totalSolves)} solves
          </Badge>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(220px,1fr)_140px_150px_150px_110px] lg:w-auto">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                resetPage()
              }}
              placeholder="Search username, email, or ID"
              className="pl-9"
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value as RoleFilter)
              resetPage()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={emailFilter}
            onValueChange={(value) => {
              setEmailFilter(value as EmailFilter)
              resetPage()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All email</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortMode}
            onValueChange={(value) => {
              setSortMode(value as SortMode)
              resetPage()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score_desc">Top score</SelectItem>
              <SelectItem value="solves_desc">Most solves</SelectItem>
              <SelectItem value="username_asc">Username</SelectItem>
              <SelectItem value="joined_desc">Newest</SelectItem>
              <SelectItem value="last_login_desc">Last login</SelectItem>
              <SelectItem value="updated_desc">Recently updated</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value))
              resetPage()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredUsers.length === 0 ? (
          <div className="rounded-lg border border-gray-200/80 px-4 py-8 text-center text-sm font-medium text-muted-foreground dark:border-gray-800/80">
            No users match the current filters.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Solves</TableHead>
                  <TableHead className="text-right">Rank</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead className="text-right">Last Login</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((listedUser) => (
                  <TableRow key={listedUser.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/user/${encodeURIComponent(listedUser.username)}`}
                        className="text-blue-600 hover:underline dark:text-blue-300"
                      >
                        {listedUser.username}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                      {listedUser.email || '-'}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                      {listedUser.id}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex min-w-20 justify-end rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-sm font-bold text-blue-600 dark:text-blue-300">
                        {formatNumber(listedUser.score)} pts
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(listedUser.solve_count)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {listedUser.rank ? `#${listedUser.rank}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          listedUser.is_admin
                            ? 'border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-300'
                            : 'border-gray-300/80 bg-gray-100/60 text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300'
                        }
                      >
                        {listedUser.is_admin ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          listedUser.email_confirmed_at
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-gray-300/80 bg-gray-100/60 text-gray-600 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300'
                        }
                      >
                        {listedUser.email_confirmed_at ? 'Confirmed' : listedUser.email ? 'Unconfirmed' : 'Missing'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(listedUser.last_sign_in_at || undefined)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(listedUser.created_at)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(listedUser.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex flex-col gap-3 border-t border-gray-200/80 pt-4 text-sm text-muted-foreground dark:border-gray-800/80 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {firstResult}-{lastResult} of {filteredUsers.length}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="min-w-20 text-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {safePage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((currentPage) => Math.min(pageCount, currentPage + 1))}
                  disabled={safePage >= pageCount}
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
