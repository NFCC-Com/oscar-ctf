'use client'

import React, { useMemo, useState } from 'react'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import APP from '@/config'
import { useRegister } from '../hooks'
import { isValidUsername } from '../lib/auth-utils'
import { THEME_PRIMARY_RING_CLASS } from '@/shared/styles'
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
  PasswordMatchIndicator,
  PasswordStrength,
  SignupDisabled,
} from './ui'

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    formData,
    handleChange,
    handleRegister,
    loading,
    error,
    success,
    setCaptchaToken,
    turnstileKey,
    captchaEnabled,
    captchaSiteKey,
    captchaMode,
    signupDisabled,
    checkingSettings
  } = useRegister()

  const usernameError = useMemo(() => {
    if (!formData.username) return ''
    return isValidUsername(formData.username) ?? ''
  }, [formData.username])

  if (checkingSettings) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-xs font-mono text-gray-400">Checking registration status...</p>
        </div>
      </AuthCard>
    )
  }

  if (signupDisabled) {
    return <SignupDisabled />
  }

  return (
    <AuthCard shake={Boolean(error)}>
      <AuthHeader
        badge="RECRUITMENT"
        title={`Join ${APP.fullName}`}
        subtitle="Create an operative account to participate in challenges"
      />

      <form className="space-y-4" onSubmit={handleRegister}>
        <div className="space-y-3.5">
          <AuthInput
            id="username"
            name="username"
            label="Operative Username"
            type="text"
            required
            placeholder="e.g. shadow_runner"
            icon={User}
            error={usernameError}
            value={formData.username}
            onChange={handleChange}
          />

          <AuthInput
            id="email"
            name="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            required
            placeholder="operative@agency.com"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
          />

          <AuthInput
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

          {/* Interactive RSCTF-inspired Password Strength Meter */}
          {formData.password && (
            <PasswordStrength password={formData.password} />
          )}

          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="••••••••••••"
            icon={Lock}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className={`rounded-lg p-1.5 text-gray-400 transition-colors hover:text-blue-500 focus:outline-none ${THEME_PRIMARY_RING_CLASS}`}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <PasswordMatchIndicator
            password={formData.password}
            confirmPassword={formData.confirmPassword}
          />
        </div>

        {error && (
          <AuthStatusMessage tone="error" title="Registration Failed">
            {error}
          </AuthStatusMessage>
        )}

        {success && (
          <AuthStatusMessage tone="success" title="Account Confirmation Sent">
            {success}
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
          Create Account
        </AuthButton>

        <AuthDivider />
        <GoogleLoginButton />
      </form>

      <AuthFooter text="Already have an account?" href="/login" linkText="Sign in" />
    </AuthCard>
  )
}
