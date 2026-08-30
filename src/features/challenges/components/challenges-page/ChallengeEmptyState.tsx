import { CalendarClock, CalendarX, CircleAlert, Search } from 'lucide-react'
import { EmptyState } from '@/shared/components'
import type { EventSelectorValue } from '../../types'

type ChallengeEmptyStateProps = {
  eventId: EventSelectorValue
  selectedEventObj: unknown
  selectedEventStart: Date | null
  selectedEventNotStarted: boolean
  selectedEventEnded: boolean
  nowDate: Date
  challengesCount: number
  formatRemaining: (ms: number) => string
}

export default function ChallengeEmptyState({
  eventId,
  selectedEventObj,
  selectedEventStart,
  selectedEventNotStarted,
  selectedEventEnded,
  nowDate,
  challengesCount,
  formatRemaining,
}: ChallengeEmptyStateProps) {
  const getIcon = () => {
    if (typeof eventId === 'string' && selectedEventNotStarted) return <CalendarClock className="w-full h-full" />
    if (typeof eventId === 'string' && selectedEventEnded) return <CalendarX className="w-full h-full" />
    if (typeof eventId === 'string' && eventId !== 'all' && !selectedEventObj) return <CircleAlert className="w-full h-full" />
    return <Search className="w-full h-full" />
  }

  const getTitle = () => {
    if (typeof eventId === 'string' && selectedEventNotStarted) return 'Event has not started yet'
    if (typeof eventId === 'string' && selectedEventEnded) return 'Event has ended'
    if (typeof eventId === 'string' && eventId !== 'all' && !selectedEventObj) return 'Event not found'
    return challengesCount === 0 ? 'No challenges available' : 'No challenges match your filters'
  }

  const getDescription = () => {
    if (typeof eventId === 'string' && selectedEventNotStarted) {
      return `Starts in ${formatRemaining(selectedEventStart!.getTime() - nowDate.getTime())}`
    }
    if (typeof eventId === 'string' && selectedEventEnded) {
      return 'Challenges for this event are no longer active.'
    }
    if (typeof eventId === 'string' && eventId !== 'all' && !selectedEventObj) {
      return 'Please choose another event.'
    }
    return challengesCount === 0 ? 'Check back later for new challenges' : 'Try adjusting your filter criteria'
  }

  return (
    <EmptyState
      icon={getIcon()}
      title={getTitle()}
      description={getDescription()}
    />
  )
}
