"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/contexts/AuthContext'
import {
  isGlobalAdmin,
  getSystemSettings,
  updateSystemSettings
} from '@/features/admin/services/admin.service'
import { AdminContentLoading, AdminPageShell, AdminPanel } from '../../ui'
import { Switch } from '@/shared/ui/switch'
import { Button } from '@/shared/ui/button'
import toast from 'react-hot-toast'
import { Settings, Save, ShieldAlert } from 'lucide-react'

const CONFIG_KEYS = [
  {
    key: 'disable_create_team',
    label: 'Disable Team Creation',
    description: 'Prevent participants from creating new teams. Global administrators are unaffected.',
  },
  {
    key: 'disable_join_team',
    label: 'Disable Joining/Leaving Teams',
    description: 'Prevent participants from joining or leaving teams. Global administrators are unaffected.',
  },
  {
    key: 'disable_edit_team',
    label: 'Disable Editing Team Name/Profile',
    description: 'Prevent participants from renaming or modifying team profiles. Global administrators are unaffected.',
  },
  {
    key: 'disable_edit_username',
    label: 'Disable Editing Username',
    description: 'Prevent participants from changing their own usernames. Global administrators are unaffected.',
  },
]

export default function AdminSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [accessReady, setAccessReady] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let mounted = true

    const checkAccessAndLoad = async () => {
      if (authLoading) return

      if (!user) {
        setAccessReady(true)
        router.push('/challenges')
        return
      }

      const adminCheck = await isGlobalAdmin()
      if (!mounted) return

      setIsAllowed(adminCheck)
      setAccessReady(true)

      if (!adminCheck) {
        router.push('/challenges')
        return
      }

      // Load current system settings
      try {
        const data = await getSystemSettings()
        if (!mounted) return

        const settingsMap: Record<string, boolean> = {}
        // Initialize with default false for keys
        CONFIG_KEYS.forEach((cfg) => {
          settingsMap[cfg.key] = false
        })
        // Override with database values
        data.forEach((s) => {
          settingsMap[s.key] = s.value === 'true'
        })

        setSettings(settingsMap)
      } catch (err) {
        console.error('Failed to load settings:', err)
        toast.error('Failed to load system settings')
      } finally {
        if (mounted) {
          setIsLoadingSettings(false)
        }
      }
    }

    void checkAccessAndLoad()

    return () => {
      mounted = false
    }
  }, [authLoading, user, router])

  const handleToggle = (key: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: Record<string, string> = {}
      Object.entries(settings).forEach(([k, v]) => {
        payload[k] = v ? 'true' : 'false'
      })

      const res = await updateSystemSettings(payload)
      if (res.success) {
        toast.success('System settings updated successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || !accessReady) return <AdminContentLoading />
  if (!user || !isAllowed) return null

  return (
    <AdminPageShell>
      <div className="py-5 pt-7.5 space-y-6">
        {isLoadingSettings ? (
          <AdminContentLoading />
        ) : (
          <AdminPanel
            title="System Settings"
            icon={Settings}
            description="Configure system-wide feature flags, restriction levels, and participant actions."
          >
            <div className="divide-y divide-gray-200/50 dark:divide-gray-800/50">
              {CONFIG_KEYS.map((config) => (
                <div
                  key={config.key}
                  className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1.5 min-w-0 pr-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {config.label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                      {config.description}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Switch
                      checked={settings[config.key] ?? false}
                      onCheckedChange={(checked) => handleToggle(config.key, checked)}
                      aria-label={config.label}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200/50 dark:border-gray-800/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500/90 font-medium">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Modifying these settings alters active tournament features.</span>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 font-semibold"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </AdminPanel>
        )}
      </div>
    </AdminPageShell>
  )
}
