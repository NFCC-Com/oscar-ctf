/**
 * Client-side custom NXCTL Node & Relay configuration stored in localStorage.
 * Allows participants/organizers to switch to a backup or local NXCTL instance seamlessly.
 */

export const CUSTOM_NXCTL_STORAGE_KEY = 'nxctf_custom_nxctl_node'
export const CUSTOM_NXCTL_URL_HEADER = 'X-Custom-NXCTL-Url'
export const CUSTOM_NXCTL_SECRET_HEADER = 'X-Custom-NXCTL-Secret'

export interface CustomNxctlConfig {
  enabled: boolean
  url: string
  secret: string
}

export const DEFAULT_CUSTOM_NXCTL_CONFIG: CustomNxctlConfig = {
  enabled: false,
  url: '',
  secret: '',
}

export function getCustomNxctlConfig(): CustomNxctlConfig {
  if (typeof window === 'undefined') return DEFAULT_CUSTOM_NXCTL_CONFIG

  try {
    const raw = localStorage.getItem(CUSTOM_NXCTL_STORAGE_KEY)
    if (!raw) return DEFAULT_CUSTOM_NXCTL_CONFIG
    const parsed = JSON.parse(raw)
    return {
      enabled: Boolean(parsed.enabled),
      url: typeof parsed.url === 'string' ? parsed.url.trim() : '',
      secret: typeof parsed.secret === 'string' ? parsed.secret.trim() : '',
    }
  } catch {
    return DEFAULT_CUSTOM_NXCTL_CONFIG
  }
}

export function setCustomNxctlConfig(config: Partial<CustomNxctlConfig>): CustomNxctlConfig {
  if (typeof window === 'undefined') return DEFAULT_CUSTOM_NXCTL_CONFIG

  const current = getCustomNxctlConfig()
  const updated: CustomNxctlConfig = {
    ...current,
    ...config,
  }

  try {
    localStorage.setItem(CUSTOM_NXCTL_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('nxctl-node-config-change'))
  } catch (err) {
    console.error('Failed to save custom NXCTL config to localStorage', err)
  }

  return updated
}

export function appendCustomNxctlHeaders(headers: Record<string, string>): Record<string, string> {
  const config = getCustomNxctlConfig()
  if (config.enabled && config.url) {
    headers[CUSTOM_NXCTL_URL_HEADER] = config.url
    if (config.secret) {
      headers[CUSTOM_NXCTL_SECRET_HEADER] = config.secret
    }
  }
  return headers
}
