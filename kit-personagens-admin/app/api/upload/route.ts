import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    const { filename, folder } = await request.json()

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Nome do arquivo ausente' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const timestamp = Date.now()
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${(folder as string) || 'uploads'}/${timestamp}_${safeName}`

    // Upload assinado: o arquivo vai direto do navegador para o Supabase
    // Storage, sem passar pela function (evita o limite de 4.5MB da Vercel).
    const { data, error } = await admin.storage
      .from('kit-assets')
      .createSignedUploadUrl(path)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage
      .from('kit-assets')
      .getPublicUrl(data.path)

    return NextResponse.json({ token: data.token, path: data.path, publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno no servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
