'use client'

import { useCallback, useState } from 'react'
import {
  submitChallengeRating,
  getMyChallengeRating,
} from '../services/challenge-rating.service'

type UseChallengeRatingOptions = {
  enabled: boolean
}

export function useChallengeRating({ enabled }: UseChallengeRatingOptions) {
  const [myRating, setMyRating] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchMyRating = useCallback(
    async (challengeId: string) => {
      if (!enabled) return

      setIsLoading(true)
      try {
        const rating = await getMyChallengeRating(challengeId)
        setMyRating(rating)
      } finally {
        setIsLoading(false)
      }
    },
    [enabled]
  )

  const submitRating = useCallback(
    async (challengeId: string, rating: number) => {
      if (!enabled) return { success: false, message: 'Rating is disabled' }

      setIsSubmitting(true)
      try {
        const result = await submitChallengeRating(challengeId, rating)
        if (result.success) {
          setMyRating(rating)
        }
        return result
      } finally {
        setIsSubmitting(false)
      }
    },
    [enabled]
  )

  const resetRating = useCallback(() => {
    setMyRating(null)
  }, [])

  return {
    myRating,
    isLoading,
    isSubmitting,
    fetchMyRating,
    submitRating,
    resetRating,
  }
}
