import { callChallengeRpc } from './common'

export type SubmitFlagResult = { success: boolean; message: string }
export type GeoSubmitResult = { success: boolean; message: string; distance_km?: number }

/**
 * Submit flag for a challenge
 */
export async function submitFlag(challengeId: string, flag: string): Promise<SubmitFlagResult> {
  const { data, error } = await callChallengeRpc('submit_flag', {
    p_challenge_id: challengeId,
    p_flag: flag,
  })

  if (error) {
    console.error('RPC error:', error)
    return { success: false, message: 'Failed to submit flag' }
  }

  const result = data as Partial<SubmitFlagResult> | null
  return {
    success: Boolean(result?.success),
    message: String(result?.message || ''),
  }
}

/**
 * Submit geo location for a GeoGuessr-style challenge.
 */
export async function submitGeoLocation(
  challengeId: string,
  lat: number,
  lng: number,
  prefix: string
): Promise<GeoSubmitResult> {
  const geoFlag = `${prefix}{geo:${lat.toFixed(6)},${lng.toFixed(6)}}`

  const { data, error } = await callChallengeRpc('submit_flag', {
    p_challenge_id: challengeId,
    p_flag: geoFlag,
  })

  if (error) {
    console.error('Geo submit RPC error:', error)
    return { success: false, message: 'Failed to submit location' }
  }

  const result = data as Partial<GeoSubmitResult> | null
  return {
    success: Boolean(result?.success),
    message: String(result?.message || ''),
    distance_km: typeof result?.distance_km === 'number' ? result.distance_km : undefined,
  }
}
