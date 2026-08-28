'use client'

import React from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useForgotPassword } from '../hooks'
import { THEME_PRIMARY_TEXT_CLASS } from '@/shared/styles'
import {
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
  AuthTurnstile,
} from './ui'

export default function ForgotPasswordForm() {
  const {
    email,
    setEmail,
    handleSubmit,
    loading,
    error,
    success,
    setCaptchaToken,
    turnstileKey,
    captchaEnabled,
    captchaSiteKey,
    captchaMode,
  } = useForgotPassword()

  return (
    <AuthCard shake={Boolean(error)}>
      <AuthHeader
        badge="RECOVERY"
        title="Reset Password"
        subtitle="Provide your registered email to receive access restoration instructions"
      />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          id="email"
          name="email"
          label="Registered Email Address"
          type="email"
          required
          placeholder="operative@agency.com"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        {captchaEnabled && (
          <AuthTurnstile
            turnstileKey={turnstileKey}
            siteKey={captchaSiteKey}
            mode={captchaMode}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            onError={() => setCaptchaToken(null)}
          />
        )}
        
        {error && (
          <AuthStatusMessage tone="error" title="Recovery Failed">
            {error}
          </AuthStatusMessage>
        )}
        
        {success && (
          <AuthStatusMessage tone="success" title="Instructions Dispatched">
            {success}
          </AuthStatusMessage>
        )}
        
        <AuthButton type="submit" loading={loading}>
          Send Reset Link
        </AuthButton>
      </form>
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className={`text-xs font-mono font-medium transition-colors hover:text-blue-500 dark:hover:text-blue-300 ${THEME_PRIMARY_TEXT_CLASS}`}
        >
          &larr; Back to Sign In
        </Link>
      </div>
    </AuthCard>
  )
}
