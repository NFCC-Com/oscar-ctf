'use client'

import React from 'react'
import APP from '@/config'
import { ShieldX } from 'lucide-react'
import { AuthCard } from './AuthCard'
import { AuthFooter } from './AuthFooter'
import { AuthHeader } from './AuthHeader'

export function SignupDisabled() {
  return (
    <AuthCard>
      <AuthHeader
        badge="REGISTRATION_LOCKED"
        title="Registration Closed"
        subtitle={`Access to ${APP.fullName} is currently restricted`}
      />

      <div className="my-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-300 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider">
          <ShieldX className="h-4 w-4 text-amber-500 shrink-0" />
          <span>New Operative Access Suspended</span>
        </div>
        <p className="mt-2 text-xs opacity-90 leading-relaxed font-medium">
          New account creation has been temporarily disabled by event administrators. If you require credentials, please contact the CTF organizers.
        </p>
      </div>

      <AuthFooter text="Already possess credentials?" href="/login" linkText="Sign in" />
    </AuthCard>
  )
}
