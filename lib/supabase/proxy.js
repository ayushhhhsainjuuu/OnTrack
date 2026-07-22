import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Refreshes the Supabase auth session cookie on every request so it never
// silently expires between page loads / API calls.
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not add logic between createServerClient and getUser() -- it
  // refreshes the token and must run on every request.
  await supabase.auth.getUser()

  return supabaseResponse
}
