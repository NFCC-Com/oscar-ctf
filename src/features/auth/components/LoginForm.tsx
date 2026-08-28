'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import APP from '@/config'
import { useLogin } from '../hooks'
import { THEME_PRIMARY_RING_CLASS, THEME_PRIMARY_TEXT_CLASS } from '@/shared/styles'
import GoogleLoginButton from './GoogleLoginButton'
import {
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthFooter,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
  AuthTurnstile,
} from './ui'

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const {
    formData,
    handleChange,
    handleLogin,
    loading,
    error,
    setCaptchaToken,
    turnstileKey,
    captchaEnabled,
    captchaSiteKey,
    captchaMode,
  } = useLogin()

  return (
    <AuthCard shake={Boolean(error)}>
      <AuthHeader
        badge="AUTH_PORTAL"
        title={`Sign in to ${APP.fullName}`}
        subtitle="Authenticate to access active challenges and scoreboard"
      />

      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-3.5">
          <AuthInput
            id="identifier"
            name="identifier"
            label="Email or Username"
            type="text"
            autoComplete="username"
            required
            placeholder="operator@domain.com or username"
            icon={Mail}
            value={formData.identifier}
            onChange={handleChange}
          />
          <AuthInput
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            icon={Lock}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className={`rounded-lg p-1.5 text-gray-400 transition-colors hover:text-blue-500 focus:outline-none ${THEME_PRIMARY_RING_CLASS}`}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end pt-0.5">
          <Link
            href="/forgot-password"
            className={`text-xs font-mono font-medium transition-colors hover:text-blue-500 dark:hover:text-blue-300 ${THEME_PRIMARY_TEXT_CLASS}`}
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <AuthStatusMessage tone="error" title="Authentication Error">
            {error}
          </AuthStatusMessage>
        )}

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

        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>

        <AuthDivider />
        <GoogleLoginButton />
      </form>

      <AuthFooter text={`New to ${APP.shortName}?`} href="/register" linkText="Create an account" />
    </AuthCard>
  )
}
