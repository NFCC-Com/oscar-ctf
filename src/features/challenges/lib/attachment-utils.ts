/**
 * Utilities for handling challenge attachments, Google Drive URLs, and download commands (wget/gdown).
 */

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
 * Generates an appropriate terminal CLI command to download the file (gdown for Google Drive, wget for direct URLs).
 */
export function getAttachmentDownloadCommand(url: string, filename: string): string {
  if (!url) return ''
  const gdriveId = getGoogleDriveFileId(url)
  const escName = filename.replace(/'/g, "'\\''")

  if (gdriveId) {
    return `gdown 'https://drive.google.com/uc?id=${gdriveId}' -O '${escName}'`
  }

  const escUrl = url.replace(/'/g, "'\\''")
  return `wget '${escUrl}' -O '${escName}'`
}

/**
 * Checks if the given URL is a Google Drive link.
 */
export function isGoogleDriveUrl(url: string): boolean {
  return Boolean(getGoogleDriveFileId(url))
}
