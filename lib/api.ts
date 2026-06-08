import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getToken()
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
}

export async function unlockKit(kitId: string) {
  const res = await apiFetch('/subscriptions/unlock-kit', {
    method: 'POST',
    body: JSON.stringify({ kitId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro ao desbloquear kit')
  return json
}
