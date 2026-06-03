export type AdminUserRow = {
  id: string
  username: string
  email: string | null
  score: number
  rank: number
  is_admin: boolean
  solve_count: number
  last_solve_at: string | null
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  created_at: string
  updated_at: string
}
