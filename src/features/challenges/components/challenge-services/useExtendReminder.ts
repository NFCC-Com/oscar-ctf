import { useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getExtendState, getServiceDisplayName, formatServiceSeconds } from '../../lib/challenge-service-panel-state'
import type { NxctlServiceEntry } from '../../lib/nxctl-services'

const EXTEND_REMINDER_SOUND = '/sounds/notif_ringtone.mp3'
const EXTEND_REMINDER_VOLUME = 0.25
const EXTEND_SOUND_COOLDOWN_MS = 60000

export function useExtendReminder(
  open: boolean,
  visibleServices: NxctlServiceEntry[],
  serviceDetails: Record<string, any>,
  serviceDetailsFetchTime: Record<string, number>,
  nowTick: number
) {
  const expiryReminderRef = useRef<Record<string, boolean>>({})
  const lastExtendSoundAtRef = useRef<Record<string, number>>({})
  const extendReminderAudioRef = useRef<HTMLAudioElement | null>(null)

  const stopExtendReminderSound = useCallback(() => {
    const audio = extendReminderAudioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    extendReminderAudioRef.current = null
  }, [])

  const playExtendReminderSound = useCallback(async () => {
    if (!open || document.visibilityState !== 'visible') return false

    const currentAudio = extendReminderAudioRef.current
    if (currentAudio && !currentAudio.paused && currentAudio.currentTime > 0) return true

    const audio = new Audio(EXTEND_REMINDER_SOUND)
    audio.volume = EXTEND_REMINDER_VOLUME
    extendReminderAudioRef.current = audio
    audio.addEventListener('ended', () => {
      if (extendReminderAudioRef.current === audio) {
        extendReminderAudioRef.current = null
      }
    }, { once: true })
    try {
      await audio.play()
      return true
    } catch {
      if (extendReminderAudioRef.current === audio) {
        extendReminderAudioRef.current = null
      }
      return false
    }
  }, [open])

  useEffect(() => {
    return () => stopExtendReminderSound()
  }, [stopExtendReminderSound])

  useEffect(() => {
    if (!open) {
      expiryReminderRef.current = {}
      lastExtendSoundAtRef.current = {}
      stopExtendReminderSound()
      return
    }

    const now = Date.now()
    visibleServices.forEach((service) => {
      const details = serviceDetails[service.name]
      const isRunning = details?.runtime?.status === 'running'
      const remainingSecFromApi = details?.runtime?.remaining_seconds ?? null
      const fetchTime = serviceDetailsFetchTime[service.name] ?? nowTick
      const timeSinceFetch = Math.max(0, (nowTick - fetchTime) / 1000)
      const remainingSec = remainingSecFromApi !== null ? Math.max(0, remainingSecFromApi - timeSinceFetch) : null
      const extendState = getExtendState(details, remainingSec, timeSinceFetch)
      const thresholdSec = extendState.thresholdSeconds
      const canExtend = extendState.canExtend

      // Reset toast state if no longer in extend window
      if (!isRunning || remainingSec === null || remainingSec <= 0 || !canExtend || remainingSec > thresholdSec) {
        expiryReminderRef.current[service.name] = false
        return
      }

      // Play sound at most once per EXTEND_SOUND_COOLDOWN_MS
      const lastSoundAt = lastExtendSoundAtRef.current[service.name] ?? 0
      if (now - lastSoundAt >= EXTEND_SOUND_COOLDOWN_MS) {
        lastExtendSoundAtRef.current[service.name] = now
        void playExtendReminderSound()
      }

      // Show toast once per dialog session
      if (expiryReminderRef.current[service.name]) return
      expiryReminderRef.current[service.name] = true
      toast(
        `${getServiceDisplayName(service.name)} expires in ${formatServiceSeconds(Math.floor(remainingSec))}. Extend it if needed.`,
        {
          icon: '!',
          duration: 7000,
          id: `nxctl-expiry-${service.name}`,
        }
      )
    })
  }, [open, visibleServices, serviceDetails, serviceDetailsFetchTime, nowTick, playExtendReminderSound, stopExtendReminderSound])
}
