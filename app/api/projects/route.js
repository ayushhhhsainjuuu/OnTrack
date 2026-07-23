import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_ROLES = ['owner', 'general manager (gm)']

// POST /api/projects
// Creates a new specialty project. Only users with the "Owner" or
// "General Manager (GM)" system_role may create projects.
export async function POST(request) {
  const { name, description, account_manager_id, start_date, end_date } = await request.json()

  if (!name || !account_manager_id) {
    return NextResponse.json({ error: 'name and account_manager_id are required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'You must be logged in to create a project' }, { status: 401 })
  }

  const { data: requester, error: requesterError } = await supabase
    .from('users')
    .select('id, system_role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (requesterError) return NextResponse.json({ error: requesterError.message }, { status: 500 })
  if (!requester || !requester.is_active) {
    return NextResponse.json({ error: 'Your user account is not active' }, { status: 403 })
  }
  if (!ALLOWED_ROLES.includes((requester.system_role || '').toLowerCase())) {
    return NextResponse.json(
      { error: 'Only users with the Owner or General Manager (GM) role can create projects' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, account_manager_id, start_date, end_date, status: 'active' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ project: data }, { status: 201 })
}

// GET /api/projects
// Returns all specialty projects
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ projects: data }, { status: 200 })
}
