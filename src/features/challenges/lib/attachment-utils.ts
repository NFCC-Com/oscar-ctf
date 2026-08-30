/**
 * Utilities for handling challenge attachments, Google Drive URLs, and download commands (wget/gdown).
 */

import type { Attachment } from '@/shared/types'

/**
 * Extracts Google Drive File ID from various Google Drive URL formats.
 */
export function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null
  const isGoogleDrive = url.includes('drive.google.com') || url.includes('docs.google.com')
  if (!isGoogleDrive) return null

  // Pattern 1: /file/d/FILE_ID/...
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch?.[1]) return fileIdMatch[1]

  // Pattern 2: ?id=FILE_ID or &id=FILE_ID
  const idQueryMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idQueryMatch?.[1]) return idQueryMatch[1]

  // Pattern 3: /d/FILE_ID
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (dMatch?.[1]) return dMatch[1]

  return null
}

/**
 * Converts a Google Drive link to its direct export/download URL with confirm=t bypass.
 */
export function getDirectDownloadUrl(url: string): string {
  const gdriveId = getGoogleDriveFileId(url)
  if (gdriveId) {
    return `https://drive.usercontent.google.com/download?id=${gdriveId}&export=download&confirm=t`
  }
  return url
}

/**
 * Normalizes an attachment URL: trims whitespace, adds https:// if missing domain protocol.
 */
export function normalizeAttachmentUrl(rawUrl: string): string {
  if (!rawUrl) return ''
  const trimmed = rawUrl.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed
  }
  if (
    trimmed.startsWith('drive.google.com') ||
    trimmed.startsWith('docs.google.com') ||
    trimmed.startsWith('github.com') ||
    trimmed.startsWith('gitlab.com') ||
    trimmed.startsWith('raw.githubusercontent.com') ||
    trimmed.startsWith('storage.googleapis.com') ||
    trimmed.startsWith('cdn.') ||
    trimmed.includes('.com/') ||
    trimmed.includes('.org/') ||
    trimmed.includes('.net/') ||
    trimmed.includes('.io/')
  ) {
    return `https://${trimmed}`
  }
  return trimmed
}

/**
 * Checks if URL is a valid web URL or valid path.
 */
export function isValidAttachmentUrl(url: string): boolean {
  if (!url) return false
  const normalized = normalizeAttachmentUrl(url)
  if (normalized.startsWith('/')) return true
  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Common downloadable file extensions.
 */
const KNOWN_FILE_EXTENSIONS = new Set([
  'zip', 'tar', 'gz', 'tgz', 'bz2', '7z', 'rar', 'xz',
  'pcap', 'pcapng', 'cap',
  'py', 'c', 'cpp', 'h', 'hpp', 'java', 'go', 'rs', 'php', 'js', 'ts', 'sh', 'rb', 'pl',
  'exe', 'bin', 'elf', 'dll', 'so', 'iso', 'img', 'raw', 'vmdk',
  'pdf', 'txt', 'log', 'md', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'json', 'xml', 'yaml', 'yml',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico',
  'apk', 'ipa', 'jar', 'war', 'wasm',
  'sqlite', 'db', 'sql',
  'wav', 'mp3', 'mp4', 'mkv', 'avi',
])

/**
 * Determines whether a URL is likely a downloadable binary/data file.
 */
export function isLikelyDirectFileUrl(url: string): boolean {
  if (!url) return false
  if (isGoogleDriveUrl(url)) return true
  if (url.includes('/storage/v1/object/public/')) return true

  const cleanUrl = url.split('?')[0].split('#')[0]
  const lastSegment = cleanUrl.split('/').pop() || ''
  if (!lastSegment.includes('.')) return false

  const ext = lastSegment.split('.').pop()?.toLowerCase() || ''
  return KNOWN_FILE_EXTENSIONS.has(ext)
}

/**
 * Generates an appropriate terminal CLI command to download the file (gdown for Google Drive, wget for direct URLs).
 */
export function getAttachmentDownloadCommand(url: string, filename: string): string {
  if (!url) return ''
  const normalized = normalizeAttachmentUrl(url)
  const gdriveId = getGoogleDriveFileId(normalized)
  const escName = filename.replace(/'/g, "'\\''")

  if (gdriveId) {
    return `gdown 'https://drive.google.com/uc?id=${gdriveId}' -O '${escName}'`
  }

  const escUrl = normalized.replace(/'/g, "'\\''")
  return `wget '${escUrl}' -O '${escName}'`
}

/**
 * Checks if the given URL is a Google Drive link.
 */
export function isGoogleDriveUrl(url: string): boolean {
  return Boolean(getGoogleDriveFileId(url))
}

export type SafeDownloadResult = {
  success: boolean
  status?: number
  message?: string
  isExternalLink?: boolean
  directUrl?: string
}

/**
 * Safely downloads an attachment file:
 * - Checks for valid URL format
 * - Handles Google Drive
 * - Catches 404 and HTTP errors directly without redirecting
 * - Triggers direct blob download
 */
export async function downloadAttachmentSafely(
  attachment: Attachment
): Promise<SafeDownloadResult> {
  const rawUrl = attachment.url || ''
  if (!rawUrl.trim()) {
    return {
      success: false,
      message: 'URL attachment kosong.',
    }
  }

  if (!isValidAttachmentUrl(rawUrl)) {
    return {
      success: false,
      message: `Format URL attachment tidak valid: "${rawUrl}".`,
    }
  }

  const normalizedUrl = normalizeAttachmentUrl(rawUrl)
  const filename = (attachment.name && attachment.name.trim()) || normalizedUrl.split('/').pop()?.split('?')[0] || 'attachment'

  // Google Drive
  if (isGoogleDriveUrl(normalizedUrl)) {
    const directGdrive = getDirectDownloadUrl(normalizedUrl)
    window.open(directGdrive, '_blank', 'noopener,noreferrer')
    return {
      success: true,
      message: 'Membuka download Google Drive...',
    }
  }

  // Direct fetch attempt
  try {
    const response = await fetch(normalizedUrl, { method: 'GET' })

    if (response.status === 404) {
      return {
        success: false,
        status: 404,
        message: 'Attachment file not found on server (404 Not Found). Please contact the admin or challenge author.',
      }
    }

    if (response.status === 403) {
      return {
        success: false,
        status: 403,
        message: 'Access to attachment file forbidden (403 Forbidden).',
      }
    }

    if (response.status >= 500) {
      return {
        success: false,
        status: response.status,
        message: `File server error (HTTP ${response.status}).`,
      }
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: `Failed to download file (HTTP ${response.status} ${response.statusText}).`,
      }
    }

    // Success response - stream blob
    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(objectUrl)

    return {
      success: true,
      message: 'Download started successfully!',
    }
  } catch (error: any) {
    // Network / CORS block fallback:
    // If fetch failed due to CORS on an external host, but the link looks like a direct downloadable file:
    const isDirectFile = isLikelyDirectFileUrl(normalizedUrl)
    if (isDirectFile) {
      // Trigger hidden anchor download to let browser handle cross-origin download
      const link = document.createElement('a')
      link.href = normalizedUrl
      link.download = filename
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return {
        success: true,
        message: 'Memulai download file...',
      }
    }

    // If it is not a direct file format and fetch failed, flag it as an external link
    return {
      success: false,
      isExternalLink: true,
      directUrl: normalizedUrl,
      message: 'Attachment ini mengarah ke tautan eksternal.',
    }
  }
}
