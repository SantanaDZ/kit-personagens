'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  if (!session_id) redirect('/catalog')

  const supabase = await createClient()
  const { data: { user }, } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  // Garante o acesso mesmo que o webhook não tenha chegado
  let kitId: string | null = null
  let kitTitle = 'seu kit'
  let verifyError: string | null = null

  try {
    const res = await fetch(`${API_URL}/checkout/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId: session_id }),
    })
    const json = await res.json()
    if (res.ok) {
      kitId = json.kitId
    } else {
      verifyError = json.error ?? 'Erro ao confirmar pagamento'
    }
  } catch {
    verifyError = 'Erro de conexão com o servidor'
  }

  // Busca o título do kit
  if (kitId) {
    const { data: kit } = await supabase.from('kits').select('title').eq('id', kitId).single()
    if (kit) kitTitle = kit.title
  }

  if (verifyError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md mb-2">
          <BackButton label="Voltar" fallbackHref="/dashboard" />
        </div>
        <div className="text-center max-w-md space-y-6">
          <div className="flex justify-center">
            <AlertCircle className="h-20 w-20 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold md:text-3xl">Pagamento recebido</h1>
            <p className="mt-2 text-muted-foreground">
              Seu pagamento foi processado, mas houve um problema ao liberar o acesso: <strong>{verifyError}</strong>.
              Entre em contato com o suporte informando o código da sessão: <code className="text-xs bg-muted px-1 rounded">{session_id}</code>
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Ir para o painel</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md mb-2">
        <BackButton label="Voltar" fallbackHref="/dashboard" />
      </div>
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold md:text-3xl">Pagamento confirmado!</h1>
          <p className="mt-2 text-muted-foreground">
            Você acaba de adquirir <strong>{kitTitle}</strong>. Ele já está disponível no seu painel.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {kitId && (
            <Button asChild>
              <Link href={`/dashboard/kit/${kitId}`}>Acessar o kit agora</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/dashboard">Ir para o painel</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
