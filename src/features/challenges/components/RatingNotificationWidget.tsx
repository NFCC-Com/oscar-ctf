'use client'

import React, { useEffect, useState } from 'react'
import { Star, CheckCircle2, Award } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'
import { AppTabs } from '@/shared/ui'
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import { useAuth } from '@/shared/contexts/AuthContext'
import {
  getUnratedSolvedChallenges,
  getMyRatedChallenges,
  submitChallengeRating,
  UnratedChallenge,
  RatedChallenge,
} from '../services/challenge-rating.service'

interface RatingRowItemProps {
  challenge: {
    challenge_id: string
    challenge_title: string
    category: string
    rating?: number
  }
  onRated: () => void
}

function RatingRowItem({ challenge, onRated }: RatingRowItemProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const currentRating = challenge.rating ?? 0

  const handleRate = async (star: number) => {
    setIsSubmitting(true)
    try {
      const res = await submitChallengeRating(challenge.challenge_id, star)
      if (res.success) {
        toast.success(`Successfully rated "${challenge.challenge_title}" ${star} stars!`)
        // Dispatch global event so that other elements (like the main list or card) reload!
        window.dispatchEvent(new CustomEvent('challenge-rated'))
        onRated()
      } else {
        toast.error(res.message || 'Failed to submit rating')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800/60 last:border-0">
      <div className="min-w-0 pr-4">
        <span className="text-[9px] uppercase font-bold text-amber-500 tracking-wider">
          {challenge.category.split('/')[0]}
        </span>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          {challenge.challenge_title}
        </h4>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hoverRating ?? currentRating)
          return (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => handleRate(star)}
              className="p-1 transition-transform active:scale-90 disabled:opacity-50 cursor-pointer"
            >
              <Star
                size={16}
                className={`transition-colors duration-150 ${active
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300 dark:text-gray-600 fill-transparent'
                  }`}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function RatingNotificationWidget() {
  const { settings } = useSystemSettings()
  const { user } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [unratedList, setUnratedList] = useState<UnratedChallenge[]>([])
  const [ratedList, setRatedList] = useState<RatedChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')

  const isEnabled = settings.enable_challenge_rating
  const isUserLoggedIn = !!user

  const loadData = React.useCallback(async () => {
    if (!isEnabled || !isUserLoggedIn) return
    try {
      const [unrated, rated] = await Promise.all([
        getUnratedSolvedChallenges(50),
        getMyRatedChallenges(),
      ])
      setUnratedList(unrated)
      setRatedList(rated)
    } catch (err) {
      console.error('Failed to load rating widget data:', err)
    } finally {
      setLoading(false)
    }
  }, [isEnabled, isUserLoggedIn])

  // Initial load and global reload listener
  useEffect(() => {
    if (isEnabled && isUserLoggedIn) {
      void loadData()
    }

    const handleGlobalReload = () => {
      void loadData()
    }

    window.addEventListener('challenge-rated', handleGlobalReload)
    return () => {
      window.removeEventListener('challenge-rated', handleGlobalReload)
    }
  }, [isEnabled, isUserLoggedIn, loadData])

  // Reload when the widget opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      void loadData()
    }
  }

  if (!isEnabled || !isUserLoggedIn) return null

  const unratedCount = unratedList.length
  const hasSaweria = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_SAWERIA_API_URL
  const bottomClass = hasSaweria ? 'bottom-[72px]' : 'bottom-6'

  return (
    <>
      {/* Floating Action Button Widget */}
      <button
        onClick={() => handleOpenChange(true)}
        className={`fixed left-6 ${bottomClass} z-40 group flex items-center justify-start h-10 w-10 hover:w-36 px-3 py-2 text-xs font-semibold rounded-full border border-amber-200 bg-white/90 text-amber-500 shadow-md backdrop-blur-md transition-all hover:bg-amber-50 hover:shadow-lg dark:border-amber-950/40 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/30 duration-300 overflow-hidden cursor-pointer`}
        title="Feedback & Rating Solved Challenges"
      >
        <div className="relative shrink-0">
          <Star className="h-4 w-4 fill-amber-500/10 group-hover:fill-amber-500/20 transition-all group-hover:scale-110 duration-300 animate-pulse text-amber-500" />
          {unratedCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white border border-white dark:border-gray-900 animate-bounce">
              {unratedCount}
            </span>
          )}
        </div>
        <span className="ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Beri Rating
        </span>
      </button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-md sm:max-w-lg h-[600px] p-0 overflow-hidden flex flex-col scroll-hidden"
          hideCloseButton={true}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Header Section */}
          <DialogHeader className="pt-5 px-5 pb-1 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
                Rating & Feedback Center
              </DialogTitle>
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded select-none">
                <Star size={11} className="fill-current text-amber-500 shrink-0" />
                <span className="leading-none">CTF Rating</span>
              </div>
            </div>
            <DialogDescription className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed text-justify">
              Berikan rating 1-5 bintang untuk challenge yang telah berhasil kamu selesaikan. Feedback rating kamu sangat membantu dalam meningkatkan kualitas soal di event berikutnya.
            </DialogDescription>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="px-5 shrink-0">
            <AppTabs
              items={[
                { value: 'pending', label: `Pending (${unratedCount})` },
                { value: 'completed', label: `Completed (${ratedList.length})` }
              ]}
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'pending' | 'completed')}
              variant="panel"
              stretch
              ariaLabel="Rating center tabs"
            />
          </div>

          {/* Content Body */}
          <div className="flex-1 min-w-0 w-full overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col min-w-0 w-full px-5 pb-5 mt-2 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
                  <span className="text-xs">Loading data...</span>
                </div>
              ) : activeTab === 'pending' ? (
                unratedCount === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 opacity-80 mb-3 animate-bounce" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Semua Solved Challenge Sudah Kamu Rating!</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-relaxed">
                      Terima kasih banyak atas feedback yang telah kamu berikan. Kamu siap untuk menaklukkan tantangan lainnya!
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto scroll-hidden">
                    {unratedList.map((item) => (
                      <RatingRowItem
                        key={item.challenge_id}
                        challenge={item}
                        onRated={loadData}
                      />
                    ))}
                  </div>
                )
              ) : ratedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
                  <Award className="h-12 w-12 text-gray-400 dark:text-gray-600 opacity-60 mb-3" />
                  <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500">Belum ada rating yang dibuat</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-relaxed">
                    Selesaikan challenge dan berikan rating bintangmu untuk melihat daftarnya di sini.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scroll-hidden">
                  {ratedList.map((item) => (
                    <RatingRowItem
                      key={item.challenge_id}
                      challenge={{
                        challenge_id: item.challenge_id,
                        challenge_title: item.challenge_title,
                        category: item.category,
                        rating: item.rating,
                      }}
                      onRated={loadData}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer controls */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-end shrink-0 bg-gray-50/50 dark:bg-gray-900/10">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
