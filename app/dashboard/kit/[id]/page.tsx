import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { KitPlayer } from '@/components/dashboard/kit-player'

interface KitPageProps {
  params: Promise<{ id: string }>
}

export default async function KitPage({ params }: KitPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verificar se o usuário tem acesso ao kit
  const { data: userKit } = await supabase
    .from('user_kits')
    .select('*')
    .eq('user_id', user.id)
    .eq('kit_id', id)
    .single()

  // Se não tem acesso, verificar se é admin
  if (!userKit) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      redirect('/dashboard')
    }
  }

  // Buscar dados do kit
  const { data: kit } = await supabase
    .from('kits')
    .select('*')
    .eq('id', id)
    .single()

  if (!kit) {
    notFound()
  }

  return <KitPlayer kit={kit} />
}
