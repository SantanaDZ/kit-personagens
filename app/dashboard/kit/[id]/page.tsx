import { createClient } from '@/lib/supabase/server'
import { hasKitAccess } from '@/lib/kit-access'
import { notFound, redirect } from 'next/navigation'
import { KitContent } from '@/components/kit/kit-content'

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

  // Verificar se o usuário tem acesso ao kit (admin, compra avulsa ou assinatura com crédito)
  if (!(await hasKitAccess(supabase, user.id, id))) {
    redirect('/dashboard')
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

  // Nunca expor a URL pública legada do áudio no frontend; o player usa
  // apenas music_path via /api/audio/[kitId] (signed URL).
  return <KitContent kit={{ ...kit, music_url: null }} />
}
