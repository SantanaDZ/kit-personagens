import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasKitAccess } from '@/lib/kit-access'

const SIGNED_URL_TTL_SECONDS = 300

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kitId: string }> }
) {
  const { kitId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!(await hasKitAccess(supabase, user.id, kitId))) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { data: kit } = await supabase
    .from('kits')
    .select('music_path')
    .eq('id', kitId)
    .maybeSingle()

  if (!kit?.music_path) {
    return NextResponse.json({ error: 'Áudio não encontrado' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: signed, error } = await admin.storage
    .from('audio')
    .createSignedUrl(kit.music_path, SIGNED_URL_TTL_SECONDS)

  if (error || !signed) {
    return NextResponse.json({ error: 'Não foi possível gerar a URL do áudio' }, { status: 500 })
  }

  return NextResponse.json({
    url: signed.signedUrl,
    expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
  })
}
