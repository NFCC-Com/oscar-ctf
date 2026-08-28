import React, { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { SURFACE_GLASS_INPUT_CLASS } from '@/shared/styles'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  label?: string
  rightElement?: React.ReactNode
  error?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ icon: Icon, label, rightElement, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5 text-left">
        {label && (
          <label 
            htmlFor={id} 
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 font-mono"
          >
            {label}
          </label>
        )}
        <div className="group relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400" />
          )}
          <input
            id={id}
            ref={ref}
            spellCheck={false}
            className={cn(
              'h-11 w-full rounded-xl border border-gray-200/80 bg-white/70 text-sm text-gray-900 caret-blue-500 shadow-sm backdrop-blur-md outline-none transition-all duration-200',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'hover:border-blue-500/40 hover:bg-white/90',
              'focus:border-blue-500/80 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_16px_rgba(59,130,246,0.15)]',
              'dark:border-gray-700/80 dark:bg-[#111622]/80 dark:text-gray-100 dark:hover:bg-[#151b2a] dark:focus:bg-[#111622] dark:focus:border-blue-400 dark:focus:ring-blue-500/25',
              'disabled:cursor-not-allowed disabled:opacity-60',
              Icon ? 'pl-10 pr-4' : 'px-4',
              rightElement && 'pr-11',
              error && 'border-red-400/60 focus:border-red-400 focus:ring-red-500/20 dark:border-red-500/50 dark:focus:border-red-400',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'
