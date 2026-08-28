'use client'

import React from 'react'
import { motion } from 'framer-motion'
import APP from '@/config'
import { NXCTF } from '@/_vars/const'
import PageBackground from '@/shared/components/PageBackground'
import { cn } from '@/shared/lib/utils'
import { THEME_PRIMARY_SELECTION_CLASS } from '@/shared/styles'

interface AuthPageShellProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function AuthPageShell({ children, className, contentClassName }: AuthPageShellProps) {
  const watermarkSrc = NXCTF.nxctf_logo || APP.image_logo

  return (
    <PageBackground
      className={cn(
        'relative flex !min-h-[calc(100vh-3.5rem)] flex-col overflow-hidden',
        className
      )}
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
    >
      {/* Subtle Cyber Grid & Soft Atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Soft Radial Ambient Atmosphere */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-blue-500/[0.03] dark:bg-blue-500/[0.04] blur-[140px]" />

        {/* Subtle Cyber Grid */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" 
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 75%)',
          }}
        />
      </div>

      {watermarkSrc && (
        <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.015]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={watermarkSrc}
            alt=""
            aria-hidden="true"
            className="h-auto w-[min(56vw,520px)] select-none object-contain"
          />
        </div>
      )}

      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12',
          contentClassName
        )}
      >
        {children}
      </motion.main>
    </PageBackground>
  )
}
