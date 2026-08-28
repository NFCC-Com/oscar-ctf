import React from 'react'
import Image from 'next/image'
import APP from '@/config'
import { NXCTF } from '@/_vars/const'
import { THEME_PRIMARY_PILL_CLASS } from '@/shared/styles'

interface AuthHeaderProps {
  badge?: string
  title: string
  subtitle?: string
}

export function AuthHeader({ badge, title, subtitle }: AuthHeaderProps) {
  const logoUrl = NXCTF.nxctf_logo || APP.image_logo

  return (
    <div className="mb-6 flex flex-col items-start text-left w-full">
      {/* Top Row: Logo (left) & Badge (right) */}
      <div className="mb-3 flex w-full items-center justify-between">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="Logo"
            width={52}
            height={52}
            className="h-12 w-12 object-contain select-none transition-transform duration-200 hover:scale-105"
            unoptimized
          />
        )}
        {badge ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75 dark:bg-blue-300" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            </span>
            <span>{badge}</span>
          </div>
        ) : null}
      </div>

      <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white sm:text-2xl">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  )
}
