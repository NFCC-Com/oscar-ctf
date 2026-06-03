import { cn } from '@/shared/lib/utils'
import { SURFACE_GLASS_CARD_COMPACT_CLASS } from '@/shared/styles'

type AdminLoadingVariant = 'overview' | 'challenges' | 'event' | 'solvers' | 'admins'

type AdminContentLoadingProps = {
  variant?: AdminLoadingVariant
}

const skeletonBlockClass = 'animate-pulse rounded-lg bg-gray-200/70 dark:bg-gray-800/80'

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn(skeletonBlockClass, className)} />
}

function AdminCardSkeleton({
  rows = 3,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div className={cn(SURFACE_GLASS_CARD_COMPACT_CLASS, 'overflow-hidden', className)}>
      <div className="border-b border-gray-200/70 px-4 py-3.5 dark:border-gray-800/80 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-56" />
          </div>
          <SkeletonBlock className="h-8 w-24" />
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200/70 bg-white/40 px-4 py-3 dark:border-gray-800/70 dark:bg-[#111622]/50"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-2/5 max-w-56" />
              <SkeletonBlock className="h-3 w-4/5 max-w-xl" />
            </div>
            <SkeletonBlock className="h-8 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={cn(SURFACE_GLASS_CARD_COMPACT_CLASS, 'p-4')}>
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-4 h-8 w-20" />
            <SkeletonBlock className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <AdminCardSkeleton rows={5} />
      <AdminCardSkeleton rows={4} />
    </div>
  )
}

function ChallengesSkeleton() {
  return (
    <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-4" aria-busy="true">
      <AdminCardSkeleton rows={7} className="order-1 xl:col-span-3" />
      <div className="order-2 space-y-4 xl:order-none">
        <AdminCardSkeleton rows={3} />
        <AdminCardSkeleton rows={4} />
      </div>
    </div>
  )
}

function EventSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <AdminCardSkeleton rows={4} />
      <AdminCardSkeleton rows={3} />
      <AdminCardSkeleton rows={5} />
      <AdminCardSkeleton rows={3} />
    </div>
  )
}

function SolversSkeleton() {
  return (
    <div aria-busy="true">
      <AdminCardSkeleton rows={8} />
    </div>
  )
}

function AdminsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <AdminCardSkeleton rows={3} />
      <AdminCardSkeleton rows={5} />
      <AdminCardSkeleton rows={3} />
    </div>
  )
}

export default function AdminContentLoading({ variant = 'challenges' }: AdminContentLoadingProps) {
  if (variant === 'overview') return <OverviewSkeleton />
  if (variant === 'event') return <EventSkeleton />
  if (variant === 'solvers') return <SolversSkeleton />
  if (variant === 'admins') return <AdminsSkeleton />
  return <ChallengesSkeleton />
}

export { AdminCardSkeleton }
