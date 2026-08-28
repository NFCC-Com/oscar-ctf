'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useResetPassword } from '../hooks'
import { THEME_PRIMARY_RING_CLASS } from '@/shared/styles'
import {
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  AuthStatusMessage,
  PasswordMatchIndicator,
  PasswordStrength,
} from './ui'

export default function ResetPasswordForm() {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    handleResetPassword,
    loading,
    error,
    success
  } = useResetPassword()

  return (
    <AuthCard shake={Boolean(error)}>
      <AuthHeader
        badge="CREDENTIAL_UPDATE"
        title="Set New Password"
        subtitle="Specify a strong, secure passphrase for your operative account"
      />

      <form className="space-y-4" onSubmit={handleResetPassword}>
        <div className="space-y-3.5">
          <AuthInput
            id="newPassword"
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            name="newPassword"
            required
            placeholder="••••••••••••"
            icon={Lock}
            rightElement={
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className={`rounded-lg p-1.5 text-gray-400 transition-colors hover:text-blue-500 focus:outline-none ${THEME_PRIMARY_RING_CLASS}`}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />

          {newPassword && (
            <PasswordStrength password={newPassword} />
          )}

          <AuthInput
            id="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
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
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

          <PasswordMatchIndicator
            password={newPassword}
            confirmPassword={confirmPassword}
          />
        </div>

        {error && (
          <AuthStatusMessage tone="error" title="Update Failed">
            {error}
          </AuthStatusMessage>
        )}

        {success && (
          <AuthStatusMessage tone="success" title="Password Updated">
            {success}
          </AuthStatusMessage>
        )}

        <AuthButton type="submit" loading={loading}>
          Update Password
        </AuthButton>
      </form>
    </AuthCard>
  )
}
