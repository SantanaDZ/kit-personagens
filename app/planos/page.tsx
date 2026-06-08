import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

const PLAN_FEATURES: Record<string, string[]> = {
  basico: [
    '3 kits ativos por mês',
    'Acesso ilimitado durante o ciclo',
    'Todos os personagens do catálogo',
    'Suporte por e-mail',
  ],
  pro: [
    '8 kits ativos por mês',
    'Acesso ilimitado durante o ciclo',
    'Todos os personagens do catálogo',
    'Suporte prioritário',
  ],
  premium: [
    'Kits ilimitados',
    'Acesso a todo o catálogo',
    'Novos kits assim que lançados',
    'Suporte prioritário',
  ],
}

export default async function PlanosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plans } = await supabase
    .from('plans')
    .select('id, name, display_name, price, kit_limit')
    .eq('is_active', true)
    .order('price')

  let activePlanName: string | null = null
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plans(name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .maybeSingle()

    if (sub) {
      const p = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans
      activePlanName = p?.name ?? null
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Planos</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Escolha o plano ideal para o seu volume de atendimentos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(plans ?? []).map((plan, i) => {
            const isActive = plan.name === activePlanName
            const isPro = plan.name === 'pro'
            const features = PLAN_FEATURES[plan.name] ?? []

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border bg-card p-6 flex flex-col gap-5 ${isPro ? 'border-primary shadow-md' : ''}`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 px-3">
                      <Sparkles className="h-3 w-3" />
                      Mais popular
                    </Badge>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{plan.display_name}</h2>
                    {isActive && <Badge variant="secondary">Seu plano</Badge>}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.kit_limit === null
                      ? 'Kits ilimitados'
                      : `${plan.kit_limit} kits por mês`}
                  </p>
                </div>

                <ul className="space-y-2 flex-1">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isPro ? 'default' : 'outline'}
                  disabled={isActive}
                  asChild={!isActive}
                >
                  {isActive ? (
                    'Plano atual'
                  ) : (
                    <Link href={user ? `/planos/assinar?plan=${plan.name}` : `/auth/login?next=/planos`}>
                      {user ? 'Assinar' : 'Entrar para assinar'}
                    </Link>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Os créditos expiram ao final de cada ciclo mensal e não acumulam para o mês seguinte.
          Cancele a qualquer momento.
        </p>
      </div>
    </div>
  )
}
