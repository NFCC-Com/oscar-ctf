import {
  Challenge,
  PortableChallenge,
  ChallengeExportPackage,
  ExportOptions,
  ImportOptions,
  ImportResult,
} from '../types'
import {
  addChallenge,
  getFlag,
  getAdminSubChallenges,
  addAdminSubChallenge,
  getChallengeById,
} from '../lib'

/**
 * Normalizes hints array/string into clean string array
 */
function normalizeHints(hint: any, hints: any): string[] {
  const result: string[] = []

  const processItem = (item: any) => {
    if (typeof item === 'string' && item.trim()) {
      result.push(item.trim())
    } else if (item && typeof item === 'object' && typeof item.content === 'string' && item.content.trim()) {
      result.push(item.content.trim())
    }
  }

  if (Array.isArray(hints)) {
    hints.forEach(processItem)
  } else if (Array.isArray(hint)) {
    hint.forEach(processItem)
  } else if (typeof hint === 'string' && hint.trim()) {
    try {
      const parsed = JSON.parse(hint)
      if (Array.isArray(parsed)) {
        parsed.forEach(processItem)
      } else {
        result.push(hint.trim())
      }
    } catch {
      result.push(hint.trim())
    }
  }

  return result
}

/**
 * Exports selected challenges into a portable NXCTF package
 */
export async function exportChallengesToPackage(
  challenges: Challenge[],
  options: ExportOptions = {}
): Promise<ChallengeExportPackage> {
  const {
    includeFlags = true,
    includeHints = true,
    includeAttachments = true,
    includeSubChallenges = true,
    includeServices = true,
  } = options

  const portableChallenges: PortableChallenge[] = []

  for (const c of challenges) {
    // Fetch full challenge details if needed
    const fullDetail = await getChallengeById(c.id)
    const base = fullDetail ? { ...c, ...fullDetail } : c

    let flagValue: string | undefined = undefined
    if (includeFlags && c.id) {
      const fetchedFlag = await getFlag(c.id)
      flagValue = fetchedFlag || base.flag || ''
    }

    let subChallengesList: any[] | undefined = undefined
    if (includeSubChallenges && c.id) {
      try {
        const subs = await getAdminSubChallenges(c.id)
        if (subs && subs.length > 0) {
          subChallengesList = subs.map((s) => ({
            order_number: s.order_number,
            question: s.question,
            answer: includeFlags ? s.answer : '',
            is_sequential: s.is_sequential,
          }))
        }
      } catch (err) {
        console.warn(`Failed to fetch sub challenges for ${c.title}:`, err)
      }
    }

    const cleanHints = includeHints ? normalizeHints(base.hint, (base as any).hints) : []
    const cleanAttachments = includeAttachments && Array.isArray(base.attachments)
      ? (base.attachments as any[]).map((a: any) => ({ name: String(a.name || 'attachment'), url: String(a.url || '') }))
      : []
    const cleanServices = includeServices && Array.isArray(base.services)
      ? base.services.map((s: any) => String(s))
      : []

    portableChallenges.push({
      title: base.title || 'Untitled Challenge',
      category: base.category || 'General',
      description: base.description || '',
      points: Number(base.points) || 100,
      max_points: base.max_points ? Number(base.max_points) : undefined,
      min_points: base.min_points ? Number(base.min_points) : undefined,
      decay_per_solve: base.decay_per_solve ? Number(base.decay_per_solve) : undefined,
      difficulty: base.difficulty || 'Easy',
      flag: flagValue,
      flag_placeholder: !!base.flag_placeholder,
      hint: cleanHints,
      attachments: cleanAttachments,
      services: cleanServices,
      sub_challenges: subChallengesList,
      is_dynamic: !!base.is_dynamic,
      is_active: base.is_active !== false,
      is_maintenance: !!base.is_maintenance,
    })
  }

  return {
    version: '1.0',
    format: 'nxctf-challenges',
    exported_at: new Date().toISOString(),
    total: portableChallenges.length,
    challenges: portableChallenges,
  }
}

/**
 * Parses and validates raw JSON text from file or paste input
 */
export function parseImportInput(rawText: string): {
  success: boolean
  data?: PortableChallenge[]
  error?: string
} {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return { success: false, error: 'Input is empty. Please provide valid JSON.' }
  }

  let parsed: any
  try {
    parsed = JSON.parse(trimmed)
  } catch (err: any) {
    return { success: false, error: `Invalid JSON format: ${err.message || 'Syntax Error'}` }
  }

  let rawList: any[] = []

  if (Array.isArray(parsed)) {
    rawList = parsed
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.challenges)) {
      rawList = parsed.challenges
    } else if (Array.isArray(parsed.results)) {
      rawList = parsed.results
    } else if (Array.isArray(parsed.data)) {
      rawList = parsed.data
    } else if (typeof parsed.title === 'string') {
      rawList = [parsed]
    } else {
      return { success: false, error: 'Could not detect a valid challenge array in the JSON object.' }
    }
  } else {
    return { success: false, error: 'Invalid JSON payload. Expected an object or array.' }
  }

  if (rawList.length === 0) {
    return { success: false, error: 'No challenges found in the provided JSON data.' }
  }

  const normalized: PortableChallenge[] = []

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i]
    if (!item || typeof item !== 'object') continue

    const title = String(item.title || item.name || '').trim()
    if (!title) continue

    const category = String(item.category || 'General').trim()
    const description = String(item.description || item.body || '').trim()
    const points = Number(item.points ?? item.value ?? 100) || 100
    const difficulty = String(item.difficulty || 'Easy').trim()

    const flag = typeof item.flag === 'string' ? item.flag : (item.flags && typeof item.flags[0] === 'string' ? item.flags[0] : (item.flags?.[0]?.content || ''))
    const flag_placeholder = Boolean(item.flag_placeholder)

    const hints = normalizeHints(item.hint, item.hints)

    const attachments: any[] = []
    const rawAttachments = item.attachments || item.files
    if (Array.isArray(rawAttachments)) {
      for (const a of rawAttachments) {
        if (typeof a === 'string') {
          const parts = a.split('/')
          const name = parts[parts.length - 1] || 'attachment'
          attachments.push({ name, url: a })
        } else if (a && typeof a === 'object') {
          attachments.push({
            name: String(a.name || a.filename || 'attachment'),
            url: String(a.url || a.location || ''),
          })
        }
      }
    }

    const services: string[] = []
    if (Array.isArray(item.services)) {
      for (const s of item.services) {
        if (typeof s === 'string' && s.trim()) services.push(s.trim())
      }
    }

    let sub_challenges: any[] | undefined = undefined
    const rawSubs = item.sub_challenges || item.subchallenges || item.questions
    if (Array.isArray(rawSubs) && rawSubs.length > 0) {
      sub_challenges = rawSubs
        .filter((s: any) => s && typeof s === 'object' && s.question)
        .map((s: any, idx: number) => ({
          order_number: Number(s.order_number ?? idx + 1),
          question: String(s.question || '').trim(),
          answer: String(s.answer || '').trim(),
          is_sequential: Boolean(s.is_sequential),
        }))
    }

    normalized.push({
      title,
      category,
      description,
      points,
      max_points: item.max_points ? Number(item.max_points) : points,
      min_points: item.min_points ? Number(item.min_points) : 0,
      decay_per_solve: item.decay_per_solve ? Number(item.decay_per_solve) : 0,
      difficulty,
      flag,
      flag_placeholder,
      hint: hints,
      attachments,
      services,
      sub_challenges,
      is_dynamic: Boolean(item.is_dynamic),
      is_active: item.is_active !== false,
      is_maintenance: Boolean(item.is_maintenance),
    })
  }

  if (normalized.length === 0) {
    return { success: false, error: 'No valid challenge items with title could be extracted.' }
  }

  return { success: true, data: normalized }
}

/**
 * Imports a list of portable challenges into the database
 */
export async function executeImportChallenges(
  challenges: PortableChallenge[],
  options: ImportOptions = {}
): Promise<ImportResult> {
  const {
    targetEventId = null,
    skipExisting = true,
    existingTitles = new Set<string>(),
    onProgress,
  } = options

  const result: ImportResult = {
    total: challenges.length,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  for (let i = 0; i < challenges.length; i++) {
    const c = challenges[i]
    if (onProgress) {
      onProgress(i + 1, challenges.length, c.title)
    }

    // Duplicate check
    const normalizedTitle = c.title.trim().toLowerCase()
    if (skipExisting && existingTitles.has(normalizedTitle)) {
      result.skipped++
      continue
    }

    try {
      const hints = normalizeHints(c.hint, c.hints)
      const challengeId = await addChallenge({
        title: c.title.trim(),
        description: c.description || '',
        category: c.category || 'General',
        points: Number(c.points) || 100,
        max_points: c.max_points ? Number(c.max_points) : Number(c.points) || 100,
        min_points: c.min_points ? Number(c.min_points) : 0,
        decay_per_solve: c.decay_per_solve ? Number(c.decay_per_solve) : 0,
        flag: c.flag || 'flag{placeholder_flag}',
        difficulty: c.difficulty || 'Easy',
        hint: hints.length > 0 ? hints : null,
        attachments: Array.isArray(c.attachments) ? c.attachments as any : [],
        is_dynamic: !!c.is_dynamic,
        is_maintenance: !!c.is_maintenance,
        event_id: targetEventId,
        flag_placeholder: !!c.flag_placeholder,
        services: Array.isArray(c.services) ? c.services : [],
      })

      if (!challengeId) {
        throw new Error('Database did not return a challenge ID.')
      }

      // Add sub-challenges if present
      if (Array.isArray(c.sub_challenges) && c.sub_challenges.length > 0) {
        for (const sub of c.sub_challenges) {
          if (sub.question) {
            await addAdminSubChallenge(challengeId, {
              question: sub.question,
              answer: sub.answer || '',
              order_number: Number(sub.order_number || 1),
              is_sequential: !!sub.is_sequential,
            })
          }
        }
      }

      // Mark title as existing to avoid duplicate within the same batch
      existingTitles.add(normalizedTitle)
      result.created++
    } catch (err: any) {
      console.error(`Failed to import challenge "${c.title}":`, err)
      result.failed++
      result.errors.push({
        title: c.title,
        error: err.message || 'Unknown error during creation',
      })
    }
  }

  return result
}
