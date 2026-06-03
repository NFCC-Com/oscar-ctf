import { supabase } from '@/lib/supabase/client'
import type { AdminUserRow } from '../types'

function normalizeAdminUser(row: any): AdminUserRow {
  return {
    id: String(row.id),
    username: String(row.username ?? ''),
    email: row.email ? String(row.email) : null,
    score: Number(row.score || 0),
    rank: Number(row.rank || 0),
    is_admin: !!row.is_admin,
    solve_count: Number(row.solve_count || 0),
    last_solve_at: row.last_solve_at ? String(row.last_solve_at) : null,
    last_sign_in_at: row.last_sign_in_at ? String(row.last_sign_in_at) : null,
    email_confirmed_at: row.email_confirmed_at ? String(row.email_confirmed_at) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await (supabase as any).rpc('get_admin_users')

  if (error) {
    console.error('Error fetching admin users:', error)
    return []
  }

  return (data || []).map(normalizeAdminUser)
}
