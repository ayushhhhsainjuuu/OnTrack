import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/accounts/:id/members
// Assigns an existing user to an account as Lead or Cleaner
export async function POST(request, { params }) {
  const { id: account_id } = await params
  const { user_id, role } = await request.json()

  if (!user_id || !role) {
    return NextResponse.json({ error: 'user_id and role are required' }, { status: 400 })
  }

  if (role !== 'Lead' && role !== 'Cleaner') {
    return NextResponse.json({ error: 'role must be Lead or Cleaner' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('account_members')
    .insert({ account_id, user_id, role, start_date: new Date().toISOString().split('T')[0] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ member: data }, { status: 201 })
}

// GET /api/accounts/:id/members
// Returns all members of an account
export async function GET(_, { params }) {
  const { id: account_id } = await params

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('account_members')
    .select('id, role, start_date, users ( id, full_name, email, phone )')
    .eq('account_id', account_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ members: data }, { status: 200 })
}
