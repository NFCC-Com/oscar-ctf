'use client'

import React, { useState, useEffect } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { motion } from 'framer-motion'
import { CAPTCHA_MODE } from '@/_vars/const'
import { cn } from '@/shared/lib/utils'

type AuthTurnstileProps = {
  turnstileKey: number
  siteKey: string
  onSuccess: (token: string) => void
  onExpire: () => void
  onError?: (error: string | Error) => void
  mode?: 'custom' | 'normal' | 'invisible'
}

function PowWorkerSvg({ done }: { done: boolean }) {
  return (
    <div className="flex items-center">
      <style>{`
        @keyframes pow-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pow-stroke {
          from { stroke-dashoffset: 87; }
          to { stroke-dashoffset: -87; }
        }
        .pow-tri-active {
          transform-origin: 12px 12px;
          animation: pow-rotate 0.75s linear infinite;
        }
        .pow-tri-done {
          transform-origin: 12px 12px;
          animation: pow-rotate 3.8s linear infinite;
        }
        .pow-line1 {
          stroke-dasharray: 87 87;
          animation: pow-stroke 2.3s linear infinite;
        }
        .pow-line2 {
          stroke-dasharray: 70 104;
          animation: pow-stroke 1.2s linear infinite;
        }
        .pow-line3 {
          stroke-dasharray: 80 94;
          animation: pow-stroke 1.3s linear infinite;
        }
      `}</style>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="110"
        height="20"
        viewBox="0 0 144 24"
        className={cn(
          'transition-colors duration-300 select-none',
          done
            ? 'stroke-emerald-500 dark:stroke-emerald-400'
            : 'stroke-blue-500 dark:stroke-blue-400'
        )}
      >
        <g fill="none" strokeWidth="1.6">
          {/* Rotating Triangle */}
          <path
            className={done ? 'pow-tri-done' : 'pow-tri-active'}
            strokeWidth="3.6"
            strokeLinecap="square"
            strokeLinejoin="bevel"
            d="M 16.943392,20.175366 2.7831628,11.99999 16.943392,3.8246236 Z"
          />
          {/* Laser Scanlines */}
          <path className="pow-line1" d="M 30,6 H 117" />
          <path className="pow-line2" d="M 38,12 H 140" />
          <path className="pow-line3" d="M 36,18 H 120" />
        </g>
      </svg>
    </div>
  )
}

export function AuthTurnstile({
  turnstileKey,
  siteKey,
  onSuccess,
  onExpire,
  onError,
  mode = CAPTCHA_MODE,
}: AuthTurnstileProps) {
  const [token, setToken] = useState<string | null>(null)
  const [randHex, setRandHex] = useState('0e5cd7b6c765abbf')

  // Reset token state when turnstileKey changes (e.g. after failed login/submit)
  useEffect(() => {
    setToken(null)
  }, [turnstileKey])

  // Rolling hex animation while token is not received yet (RSCTF HashPoW style)
  useEffect(() => {
    if (token || mode !== 'custom') return

    const array = new Uint32Array(2)
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array)
        setRandHex(array.reduce((acc, val) => acc + val.toString(16).padStart(8, '0'), ''))
      }
    }, 75)

    return () => clearInterval(interval)
  }, [token, mode, turnstileKey])

  const handleSuccess = (receivedToken: string) => {
    setToken(receivedToken)
    onSuccess(receivedToken)
  }

  const handleExpire = () => {
    setToken(null)
    onExpire()
  }

  const handleError = (err: string | Error) => {
    setToken(null)
    onError?.(err)
  }

  // Normal mode: Standard Cloudflare Turnstile Box
  if (mode === 'normal') {
    return (
      <div className="flex w-full justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-white/50 p-2 dark:border-white/10 dark:bg-[#111622]/50">
        <Turnstile
          key={turnstileKey}
          siteKey={siteKey}
          className="w-full"
          onSuccess={handleSuccess}
          onExpire={handleExpire}
          onError={handleError}
          options={{
            size: 'flexible',
            theme: 'auto',
          }}
        />
      </div>
    )
  }

  // Custom mode: Invisible Turnstile in background + RSCTF-style PowWorker Animation
  return (
    <div className="space-y-1.5 w-full text-left">
      {/* Invisible Turnstile Engine */}
      <div className="hidden" aria-hidden="true">
        <Turnstile
          key={turnstileKey}
          siteKey={siteKey}
          onSuccess={handleSuccess}
          onExpire={handleExpire}
          onError={handleError}
          options={{
            size: 'invisible',
            theme: 'auto',
          }}
        />
      </div>

      {mode === 'custom' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-mono transition-all duration-300 backdrop-blur-md',
            token
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/30'
              : 'border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300 dark:bg-blue-950/30'
          )}
        >
          {/* Left: RSCTF Rotating Triangle & Laser Lines */}
          <div className="flex items-center gap-2">
            <PowWorkerSvg done={Boolean(token)} />
          </div>

          {/* Right: Rolling Nonce or Verified Hash */}
          <div className="text-right flex items-center gap-1.5">
            <span
              className={cn(
                'inline-block rounded px-2 py-0.5 text-[11px] font-bold font-mono tracking-wider uppercase select-none transition-all duration-300',
                token
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 opacity-90'
              )}
            >
              {token ? `0x${token.slice(0, 12)}` : `0x${randHex.slice(0, 12)}`}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
