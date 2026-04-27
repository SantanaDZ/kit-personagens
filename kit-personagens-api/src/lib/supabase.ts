import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const anonKey = process.env.SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente autenticado com o JWT do usuário (respeita RLS)
export function createUserClient(token: string) {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

// Cliente admin — ignora RLS, usar só em webhooks/operações internas
export function createAdminClient() {
  return createClient(url, serviceKey)
}
