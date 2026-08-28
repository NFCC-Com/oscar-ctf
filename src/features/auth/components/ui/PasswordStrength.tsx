'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 6 characters', test: (val: string) => val.length >= 6 },
  { id: 'number', label: 'Includes a number (0-9)', test: (val: string) => /[0-9]/.test(val) },
  { id: 'case', label: 'Mixed uppercase & lowercase', test: (val: string) => /[a-z]/.test(val) && /[A-Z]/.test(val) },
  { id: 'symbol', label: 'Special symbol (!@#$%^&*)', test: (val: string) => /[`$&+,:;=?@#|'<>.^*()%!-]/.test(val) },
]

export function calculatePasswordStrength(password: string): {
  score: number
  percent: number
  color: string
  label: string
} {
  if (!password) {
    return { score: 0, percent: 0, color: 'bg-gray-300 dark:bg-gray-700', label: 'Enter password' }
  }

  const passedCount = PASSWORD_REQUIREMENTS.reduce((count, req) => count + (req.test(password) ? 1 : 0), 0)
  const percent = Math.round((passedCount / PASSWORD_REQUIREMENTS.length) * 100)

  if (passedCount <= 1) {
    return { score: passedCount, percent: Math.max(percent, 20), color: 'bg-rose-500', label: 'Weak' }
  }
  if (passedCount <= 3) {
    return { score: passedCount, percent, color: 'bg-amber-500', label: 'Good' }
  }
  return { score: passedCount, percent: 100, color: 'bg-emerald-500', label: 'Strong' }
}

interface PasswordStrengthProps {
  password: string
  compact?: boolean
}

export function PasswordStrength({ password, compact = false }: PasswordStrengthProps) {
  const { percent, color, label } = calculatePasswordStrength(password)
  const hasInput = Boolean(password)

  if (!hasInput && compact) return null

  return (
    <div className="space-y-2.5 rounded-xl border border-gray-200/80 bg-white/60 p-3 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#111622]/60">
      {/* Strength Bar & Label */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {percent >= 75 ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
          )}
          <span>Password Strength</span>
        </div>
        <span
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            percent >= 75
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : percent >= 50
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          )}
        >
          {label}
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-800">
        <motion.div
          className={cn('h-full rounded-full transition-colors duration-300', color)}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* Requirements List */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 pt-0.5">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const meets = req.test(password)
          return (
            <div
              key={req.id}
              className={cn(
                'flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-200',
                meets
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 opacity-80'
              )}
            >
              <span
                className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
                  meets
                    ? 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300'
                    : 'bg-gray-200/70 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                )}
              >
                {meets ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <X className="h-2.5 w-2.5" />}
              </span>
              <span className="truncate">{req.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PasswordMatchIndicator({
  password,
  confirmPassword,
}: {
  password: string
  confirmPassword: string
}) {
  if (!confirmPassword) return null

  const matches = Boolean(password) && password === confirmPassword

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className={cn(
          'flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-all duration-200',
          matches
            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400'
            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:text-rose-400'
        )}
      >
        <span
          className={cn(
            'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full',
            matches ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          )}
        >
          {matches ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <X className="h-2.5 w-2.5 stroke-[3]" />}
        </span>
        <span>{matches ? 'Passwords match' : 'Passwords do not match yet'}</span>
      </motion.div>
    </AnimatePresence>
  )
}
