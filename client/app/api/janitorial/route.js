import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


// Creates a new janitorial user in the users table and assigns them 
//  to a work site (account) with the role "Cleaner" in account_members.

export async function POST(request) {
  try {
    const { full_name, email, phone, password_hash, account_id } = await request.json()

    // Validate required fields
    if (!full_name || !email || !password_hash) {
      return NextResponse.json(
        { error: 'full_name, email, and password_hash are required' },
        { status: 400 }
      )
    }

    // Check if a user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Insert new user into the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ full_name, email, phone, password_hash })
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // If an account_id is provided, link the user to that work site as a Cleaner
    if (account_id) {
      const { error: memberError } = await supabase
        .from('account_members')
        .insert({
          account_id,
          user_id: user.id,
          role: 'Cleaner',
          start_date: new Date().toISOString().split('T')[0], // today's date
        })

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/janitorial
// Returns all users with the role "Cleaner" along with their assigned work site info.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('account_members')
      .select(`
        id,
        role,
        start_date,
        users ( id, full_name, email, phone ),
        accounts ( id, name, address )
      `)
      .eq('role', 'Cleaner')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cleaners: data }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
