'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface AuthStatusMessageProps {
  children: React.ReactNode
  tone: 'error' | 'success'
  title?: string
}

export function AuthStatusMessage({ children, tone, title }: AuthStatusMessageProps) {
  const isSuccess = tone === 'success'
  const Icon = isSuccess ? CheckCircle2 : (title ? ShieldAlert : AlertCircle)

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        'relative flex items-start gap-3 overflow-hidden rounded-xl border p-3.5 text-sm text-left shadow-sm backdrop-blur-md transition-all',
        isSuccess
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 shadow-emerald-500/5 dark:text-emerald-300 dark:bg-emerald-950/40'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-900 shadow-rose-500/5 dark:text-rose-300 dark:bg-rose-950/40'
      )}
    >
      {/* Side Accent Line */}
      <div 
        className={cn(
          'absolute left-0 inset-y-0 w-1',
          isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
        )} 
      />

      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        )}
      />
      <div className="flex-1">
        {title && (
          <div className="font-mono text-xs font-bold uppercase tracking-wider mb-0.5">
            {title}
          </div>
        )}
        <div className={title ? 'text-xs opacity-90 leading-relaxed' : 'text-xs leading-relaxed font-medium'}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}
