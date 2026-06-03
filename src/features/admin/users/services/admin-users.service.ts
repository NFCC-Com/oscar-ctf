import { supabase } from '@/lib/supabase/client'
import type { AdminUserRow, UserSocialLinks } from '../types'

function normalizeSocialLinks(value: unknown): UserSocialLinks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function normalizeAdminUser(row: any): AdminUserRow {
  return {
    id: String(row.id),
    username: String(row.username ?? ''),
    is_admin: !!row.is_admin,
    bio: row.bio ? String(row.bio) : null,
    sosmed: normalizeSocialLinks(row.sosmed),
    profile_picture_url: row.profile_picture_url ? String(row.profile_picture_url) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id,username,is_admin,bio,sosmed,profile_picture_url,created_at,updated_at')
    .order('username', { ascending: true })

  if (error) {
    console.error('Error fetching admin users:', error)
    return []
  }

  return (data || []).map(normalizeAdminUser)
}
