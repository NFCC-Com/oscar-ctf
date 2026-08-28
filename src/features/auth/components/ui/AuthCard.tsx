'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils'
import { SURFACE_GLASS_CARD_CLASS, SURFACE_INTERACTIVE_HOVER_CLASS } from '@/shared/styles'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
  shake?: boolean
}

export function AuthCard({ children, className, shake }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={
        shake
          ? {
            opacity: 1,
            y: 0,
            scale: 1,
            x: [-6, 6, -4, 4, -2, 2, 0],
            transition: { duration: 0.45, ease: 'easeInOut' },
          }
          : { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } }
      }
      className={cn(
        'relative w-full overflow-hidden px-6 pt-6 pb-7 sm:px-8 sm:pt-7 sm:pb-8',
        'rounded-2xl border border-gray-200/80 bg-white/80 shadow-xl backdrop-blur-xl',
        'dark:border-white/[0.08] dark:bg-[#0d121f]/85 dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]',
        'transition-all duration-300 hover:border-gray-300 dark:hover:border-white/[0.14]',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
