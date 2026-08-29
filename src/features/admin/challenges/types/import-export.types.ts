import type { Attachment } from '@/shared/types'

export interface PortableAttachment {
  name: string
  url: string
}

export interface PortableSubChallenge {
  order_number?: number
  question: string
  answer: string
  is_sequential?: boolean
}

export interface PortableHint {
  content: string
  cost?: number
}

export interface PortableChallenge {
  title: string
  category: string
  description: string
  points: number
  max_points?: number
  min_points?: number
  decay_per_solve?: number
  difficulty?: string
  flag?: string
  flag_placeholder?: boolean
  hint?: string[] | string
  hints?: (string | PortableHint)[]
  attachments?: (Attachment | PortableAttachment)[]
  services?: string[]
  sub_challenges?: PortableSubChallenge[]
  is_dynamic?: boolean
  is_active?: boolean
  is_maintenance?: boolean
}

export interface ChallengeExportPackage {
  version: '1.0'
  format: 'nxctf-challenges'
  exported_at: string
  source?: string
  total: number
  challenges: PortableChallenge[]
}

export interface ExportOptions {
  includeFlags?: boolean
  includeHints?: boolean
  includeAttachments?: boolean
  includeSubChallenges?: boolean
  includeServices?: boolean
}

export interface ImportOptions {
  targetEventId?: string | null
  skipExisting?: boolean
  existingTitles?: Set<string>
  onProgress?: (current: number, total: number, currentTitle: string) => void
}

export interface ImportResult {
  total: number
  created: number
  skipped: number
  failed: number
  errors: Array<{ title: string; error: string }>
}
