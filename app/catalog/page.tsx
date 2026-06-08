import { createClient } from '@/lib/supabase/server'
import { CatalogGrid } from '@/components/catalog/catalog-grid'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: kits } = await supabase
    .from('kits')
    .select('id, title, description, cover_image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  let subscription = null
  let unlockedKitIds = new Set<string>()

  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_end, plans(name, display_name, kit_limit)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .maybeSingle()

    if (sub) {
      const { data: credits } = await supabase
        .from('kit_credits')
        .select('kit_id')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())

      credits?.forEach((c) => unlockedKitIds.add(c.kit_id))

      const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans
      const creditsUsed = unlockedKitIds.size
      const kitLimit = plan?.kit_limit ?? null

      subscription = {
        id: sub.id,
        planName: plan?.display_name ?? '',
        kitLimit,
        creditsUsed,
        creditsRemaining: kitLimit === null ? null : kitLimit - creditsUsed,
        periodEnd: sub.current_period_end,
      }
    }
  }

  const catalogKits = (kits ?? []).map((kit) => ({
    ...kit,
    unlocked: unlockedKitIds.has(kit.id),
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Kits de Personagens</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Escolha os kits para usar nos seus atendimentos este mês
          </p>
        </div>
        <CatalogGrid
          kits={catalogKits}
          isLoggedIn={!!user}
          subscription={subscription}
        />
      </div>
    </div>
  )
}
