import { createClient } from '@/lib/supabase/server'
import { KitCard } from '@/components/dashboard/kit-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Sparkles, CalendarDays } from 'lucide-react'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_end, plans(name, display_name, kit_limit)')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()

  const { data: credits } = await supabase
    .from('kit_credits')
    .select(`
      id, unlocked_at, expires_at,
      kit:kits (id, title, description, cover_image_url, character_name, character_image_url, is_active)
    `)
    .eq('user_id', user!.id)
    .gt('expires_at', new Date().toISOString())
    .order('unlocked_at', { ascending: false })

  const plan = sub ? (Array.isArray(sub.plans) ? sub.plans[0] : sub.plans) : null
  const creditsUsed = credits?.length ?? 0
  const kitLimit = plan?.kit_limit ?? null
  const creditsRemaining = kitLimit === null ? null : (kitLimit - creditsUsed)
  const kits = credits?.map((c) => c.kit).filter(Boolean) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Kits</h1>
        <p className="text-muted-foreground mt-2">Kits ativos no ciclo atual</p>
      </div>

      {sub && plan ? (
        <div className="rounded-lg border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Plano {plan.display_name}</p>
                <Badge variant="secondary">Ativo</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {creditsRemaining === null
                  ? `${creditsUsed} kits desbloqueados · ilimitado`
                  : `${creditsUsed} de ${kitLimit} kits desbloqueados este mês`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Renova em {formatDate(sub.current_period_end)}
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/planos">Gerenciar</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Nenhuma assinatura ativa</p>
            <p className="text-sm text-muted-foreground mt-1">
              Assine um plano para desbloquear kits e usá-los nos seus atendimentos.
            </p>
          </div>
          <Button asChild>
            <Link href="/planos">Ver planos</Link>
          </Button>
        </div>
      )}

      {kits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Nenhum kit desbloqueado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Explore o catálogo e use seus créditos para desbloquear kits.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/catalog">Explorar catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kits.map((kit) => (
            <KitCard key={kit.id} kit={kit} />
          ))}
        </div>
      )}
    </div>
  )
}
