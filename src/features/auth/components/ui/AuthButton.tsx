import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  THEME_PRIMARY_BG_CLASS,
  THEME_PRIMARY_BG_HOVER_CLASS,
  THEME_PRIMARY_SHADOW_CLASS,
} from '@/shared/styles'

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  loading?: boolean
}

export function AuthButton({ children, loading, className = '', disabled, ...props }: AuthButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'group relative flex w-full items-center justify-center overflow-hidden rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider font-mono text-white transition-all duration-200',
        'shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.99]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 dark:focus:ring-offset-[#0b0f19]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:shadow-none',
        className
      )}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 transition-all duration-300 group-hover:brightness-110" />

      {/* Shimmer Sheen on Hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin stroke-[2.5]" />
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </span>
    </button>
  )
}
