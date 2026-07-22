import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/users
// Returns active users with system_role "Project Manager" or "Supervisor"
// for use in pickers -- e.g. selecting an account manager for a project.
// Calls the get_account_managers() SECURITY DEFINER function (see repo
// memory / migration SQL) because the `users` table RLS policy only lets a
// caller SELECT their own row, which would otherwise hide every other user.
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_account_managers')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: data || [] }, { status: 200 })
}

