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

export async function getAdminUsers(params?: {
  search?: string
  role?: 'all' | 'admin' | 'user'
  sortBy?: 'newest' | 'oldest' | 'username_asc' | 'updated_desc' | 'role'
  limit?: number
  offset?: number
}): Promise<{ users: AdminUserRow[]; totalCount: number }> {
  let query = supabase
    .from('users')
    .select('id,username,is_admin,bio,sosmed,profile_picture_url,created_at,updated_at', { count: 'exact' })

  // Search filter
  if (params?.search) {
    const keyword = params.search.trim()
    if (keyword) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(keyword)
      if (isUuid) {
        query = query.or(`username.ilike.%${keyword}%,id.eq.${keyword},bio.ilike.%${keyword}%`)
      } else {
        query = query.or(`username.ilike.%${keyword}%,bio.ilike.%${keyword}%`)
      }
    }
  }

  // Role filter
  if (params?.role === 'admin') {
    query = query.eq('is_admin', true)
  } else if (params?.role === 'user') {
    query = query.eq('is_admin', false)
  }

  // Sort
  const sortBy = params?.sortBy || 'newest'
  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (sortBy === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else if (sortBy === 'updated_desc') {
    query = query.order('updated_at', { ascending: false })
  } else if (sortBy === 'role') {
    query = query.order('is_admin', { ascending: false }).order('username', { ascending: true })
  } else {
    // username_asc or default
    query = query.order('username', { ascending: true })
  }

  // Pagination
  if (params?.limit) {
    query = query.limit(params.limit)
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 25) - 1)
  } else if (params?.limit) {
    query = query.range(0, params.limit - 1)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching admin users:', error)
    return { users: [], totalCount: 0 }
  }

  return {
    users: (data || []).map(normalizeAdminUser),
    totalCount: count || 0,
  }
}
