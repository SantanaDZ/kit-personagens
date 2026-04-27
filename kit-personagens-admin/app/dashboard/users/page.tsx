import { createAdminClient } from '@/lib/supabase/server'
import { UsersTable } from '@/components/users-table'

export default async function UsersPage() {
  const supabase = createAdminClient()

  const [{ data: users }, { data: kits }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('kits').select('id, title').eq('is_active', true).order('title'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usuários</h1>
      <UsersTable users={users ?? []} kits={kits ?? []} />
    </div>
  )
}
