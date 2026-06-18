import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/projects
// Creates a new specialty project
export async function POST(request) {
  const { name, description, account_manager_id, start_date, end_date } = await request.json()

  if (!name || !account_manager_id) {
    return NextResponse.json({ error: 'name and account_manager_id are required' }, { status: 400 })
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
  const { data, error } = await supabase
    .from('projects')
    .select('*')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ projects: data }, { status: 200 })
}
