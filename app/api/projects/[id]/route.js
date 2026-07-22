import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(_, { params }) {
  const { id } = await params

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update({ status: 'complete' })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ project: data }, { status: 200 })
}
