import { createClient } from '@supabase/supabase-js'

/**
 * Client com a service role key. Bypassa RLS — usar apenas em
 * Route Handlers/Server Components, nunca em código client-side.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
