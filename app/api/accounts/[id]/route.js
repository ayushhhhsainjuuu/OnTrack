import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(_, { params }) {
  const { id } = await params

  const { data, error } = await supabase
    .from('accounts')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  return NextResponse.json({ account: data }, { status: 200 })
}
